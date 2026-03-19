import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { loginSchema, insertUserSchema, insertActivitySchema, insertReportSchema, insertAnnouncementSchema, insertSystemSettingsSchema, insertRewardSchema, updateProfileSchema } from "../shared/schema.js";
import { log } from "./index.js";
import {
  notifyReportStatus,
  notifyAnnouncementCreated,
  notifyAnnouncementDeleted,
  notifyNewRegistration,
  notifyAdminAction,
  notifyRedemption,
  notifyQrCheckin,
} from "./discord.js";
import type { User } from "../shared/schema.js";

declare module "express-serve-static-core" {
  interface Request {
    adminUser?: User;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่" });
  }
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
  }
  req.adminUser = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const { studentId, password } = result.data;
    const user = await storage.getUserByStudentId(studentId);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง" });
    }
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.post("/api/auth/register", async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const existing = await storage.getUserByStudentId(result.data.studentId);
    if (existing) {
      return res.status(409).json({ message: "รหัสนักเรียนนี้ถูกใช้งานแล้ว" });
    }
    const user = await storage.createUser(result.data);
    const { password: _, ...safeUser } = user;

    notifyNewRegistration({
      name: user.name,
      studentId: user.studentId,
      schoolCode: user.schoolCode,
    });

    res.status(201).json({ user: safeUser });
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const requesterId = req.headers["x-user-id"] as string;
      if (requesterId !== req.params.id) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
      }
      const updated = await storage.updateUserProfile(req.params.id, result.data);
      if (!updated) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // System settings (public GET, admin PATCH)
  app.get("/api/system/settings", async (_req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.patch("/api/system/settings", requireAdmin, async (req, res) => {
    try {
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "ไม่มีข้อมูลที่จะอัปเดต" });
      }
      const result = insertSystemSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
      }
      const settings = await storage.updateSystemSettings(result.data);

      const admin = req.adminUser!;
      const modeText = result.data.maintenanceMode === 1 ? "เปิด Maintenance Mode" : "ปิด Maintenance Mode";
      notifyAdminAction({
        action: "อัปเดตตั้งค่าระบบ",
        detail: modeText,
        adminName: admin.name,
        adminStudentId: admin.studentId,
      });

      res.json(settings);
    } catch (error: any) {
      log(`Error updating settings: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  // Announcements
  app.get("/api/announcements", async (_req, res) => {
    const announcements = await storage.getAnnouncements();
    res.json(announcements);
  });

  app.post("/api/announcements", requireAdmin, async (req, res) => {
    const result = insertAnnouncementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const ann = await storage.createAnnouncement(result.data);

    const admin = req.adminUser!;
    notifyAnnouncementCreated({
      title: ann.title,
      content: ann.content,
      authorName: ann.authorName,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });
    notifyAdminAction({
      action: "สร้างประกาศ",
      detail: `หัวข้อ: "${ann.title}"`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.status(201).json(ann);
  });

  app.delete("/api/announcements/:id", requireAdmin, async (req, res) => {
    const ann = await storage.getAnnouncement(req.params.id);
    const success = await storage.deleteAnnouncement(req.params.id);
    if (!success) return res.status(404).json({ message: "ไม่พบประกาศ" });

    const admin = req.adminUser!;
    notifyAnnouncementDeleted({
      title: ann?.title ?? req.params.id,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });
    notifyAdminAction({
      action: "ลบประกาศ",
      detail: `หัวข้อ: "${ann?.title ?? req.params.id}"`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json({ message: "ลบประกาศสำเร็จ" });
  });

  // QR Code
  app.post("/api/qr/generate", requireAdmin, async (req, res) => {
    const { type, expiryMinutes } = req.body;
    if (type !== "checkin" && type !== "stamp") {
      return res.status(400).json({ message: "ประเภท QR ไม่ถูกต้อง" });
    }
    const qr = await storage.createQrToken(type, type === "stamp" ? (expiryMinutes ?? 5) : null);

    const admin = req.adminUser!;
    const typeLabel = type === "checkin" ? "QR เช็คชื่อ" : "QR แสตมป์ขยะ";
    notifyAdminAction({
      action: "สร้าง QR Code",
      detail: `ประเภท: ${typeLabel}`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json({
      token: qr.token,
      type: qr.type,
      expiresAt: qr.expiresAt?.toISOString() ?? null,
      permanent: qr.expiresAt === null,
    });
  });

  app.get("/api/qr/checkin", requireAdmin, async (_req, res) => {
    const qr = await storage.getCheckinQr();
    if (!qr) return res.json({ exists: false });
    res.json({ exists: true, token: qr.token, usedCount: qr.usedBy.size });
  });

  app.post("/api/qr/scan", async (req, res) => {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }
    const qr = await storage.getQrToken(token);
    if (!qr) {
      return res.status(404).json({ message: "QR Code ไม่ถูกต้องหรือหมดอายุ" });
    }

    const now = new Date();
    const hour = now.getHours();
    if (hour < 6 || hour >= 8) {
      return res.status(403).json({ message: "QR Code ใช้ได้เฉพาะเวลา 06:00 - 08:00 น. เท่านั้น" });
    }

    if (qr.type === "checkin") {
      const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const dailyKey = `${userId}_${today}`;
      if (qr.usedBy.has(dailyKey)) {
        return res.status(409).json({ message: "คุณได้เช็คชื่อวันนี้ไปแล้ว" });
      }
    }

    if (qr.type === "stamp" && qr.usedBy.size > 0) {
      return res.status(409).json({ message: "QR Code นี้ถูกใช้งานแล้ว กรุณาขอ QR Code ใหม่จากสภานักเรียน" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    if (qr.type === "checkin") {
      const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const dailyKey = `${userId}_${today}`;
      await storage.markQrUsed(token, dailyKey);
      await storage.createActivity(userId, { type: "checkin", description: "เช็คชื่อผ่าน QR Code (+1 แต้มความดี)" });
      const updated = await storage.updateUserMerits(userId, 1);
      const { password: _, ...safeUser } = updated!;

      notifyQrCheckin({
        studentName: user.name,
        studentId: user.studentId,
        totalMerits: updated!.merits,
      });

      res.json({
        message: `เช็คชื่อสำเร็จ! ได้รับ 1 แต้มความดี (รวม ${updated!.merits} แต้ม)`,
        user: safeUser,
        type: "checkin",
      });
    } else {
      const success = await storage.markQrUsed(token, userId);
      if (!success) {
        return res.status(409).json({ message: "คุณได้สแกน QR Code นี้ไปแล้ว" });
      }
      await storage.createActivity(userId, { type: "stamp", description: "รับแต้มขยะผ่าน QR Code (+10 แต้มขยะ = 1 แสตมป์)" });
      const updated = await storage.updateUserTrashPoints(userId, 10);
      const { password: _, ...safeUser } = updated!;
      res.json({
        message: `รับแต้มขยะสำเร็จ! ได้รับ 10 แต้มขยะ = 1 แสตมป์ (รวม ${updated!.trashPoints} แต้ม)`,
        user: safeUser,
        type: "stamp",
      });
    }
  });

  // Activities
  app.get("/api/activities/:userId", async (req, res) => {
    const acts = await storage.getActivities(req.params.userId);
    res.json(acts);
  });

  app.post("/api/activities/:userId", async (req, res) => {
    try {
      log(`POST /api/activities/${req.params.userId}`);
      const result = insertActivitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
      }
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

      const act = await storage.createActivity(req.params.userId, result.data);
      const { password: _, ...safeUser } = user;
      log(`Activity created (pending approval) for ${req.params.userId}`);
      res.status(201).json({ activity: act, user: safeUser });
    } catch (error: any) {
      log(`Error creating activity: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  // Reports
  app.get("/api/reports/:userId", async (req, res) => {
    const rpts = await storage.getReports(req.params.userId);
    res.json(rpts);
  });

  app.post("/api/reports/:userId", async (req, res) => {
    try {
      log(`POST /api/reports/${req.params.userId}`);
      const result = insertReportSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
      }
      const rpt = await storage.createReport(req.params.userId, result.data);
      res.status(201).json(rpt);
    } catch (error: any) {
      log(`Error creating report: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ADMIN ROUTES =====
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    const safeUsers = users.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const target = await storage.getUser(req.params.id);
    const success = await storage.deleteUser(req.params.id);
    if (!success) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const admin = req.adminUser!;
    notifyAdminAction({
      action: "ลบผู้ใช้",
      detail: target
        ? `ลบ: ${target.name} (รหัส: ${target.studentId})`
        : `ลบ user ID: ${req.params.id}`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });

  app.get("/api/admin/activities", requireAdmin, async (_req, res) => {
    const acts = await storage.getAllActivities();
    res.json(acts);
  });

  // เมื่อ Admin อนุมัติกิจกรรมความดี ถึงจะให้คะแนน
  app.patch("/api/admin/activities/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const act = await storage.updateActivityStatus(req.params.id, status);
    if (!act) return res.status(404).json({ message: "ไม่พบกิจกรรม" });

    if (status === "approved" && act.type === "goodness") {
      await storage.updateUserMerits(act.userId, 1);
      log(`Awarded 1 merit to user ${act.userId} for approved goodness activity ${act.id}`);
    }

    const admin = req.adminUser!;
    const statusLabel = status === "approved" ? "✅ อนุมัติ" : "❌ ปฏิเสธ";
    const targetUser = await storage.getUser(act.userId);
    notifyAdminAction({
      action: `${statusLabel}กิจกรรมความดี`,
      detail: `กิจกรรม: "${act.description.slice(0, 100)}"\nนักเรียน: ${targetUser?.name ?? act.userId} (${targetUser?.studentId ?? "-"})`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
      color: status === "approved" ? 0x22C55E : 0xEF4444,
    });

    res.json(act);
  });

  app.get("/api/admin/reports", requireAdmin, async (_req, res) => {
    const rpts = await storage.getAllReports();
    res.json(rpts);
  });

  app.patch("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["resolved", "rejected", "in_progress"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const rpt = await storage.updateReportStatus(req.params.id, status);
    if (!rpt) return res.status(404).json({ message: "ไม่พบรายงาน" });

    const admin = req.adminUser!;
    const reporter = await storage.getUser(rpt.userId);
    notifyReportStatus({
      reportId: rpt.id,
      category: rpt.category,
      details: rpt.details,
      studentName: reporter?.name ?? rpt.userId,
      studentId: reporter?.studentId ?? "-",
      newStatus: status,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });
    notifyAdminAction({
      action: "อัปเดตสถานะรายงาน",
      detail: `รายงาน: "${rpt.category}" → ${status}\nนักเรียน: ${reporter?.name ?? rpt.userId} (${reporter?.studentId ?? "-"})`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json(rpt);
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    const acts = await storage.getAllActivities();
    const rpts = await storage.getAllReports();
    const anns = await storage.getAnnouncements();
    res.json({
      totalStudents: users.filter(u => u.role === "student").length,
      totalActivities: acts.length,
      pendingActivities: acts.filter(a => a.status === "pending").length,
      totalReports: rpts.length,
      pendingReports: rpts.filter(r => r.status === "pending").length,
      totalAnnouncements: anns.length,
      totalMerits: users.reduce((sum, u) => sum + u.merits, 0),
      totalStamps: users.reduce((sum, u) => sum + u.stamps, 0),
    });
  });

  app.delete("/api/admin/clear-all", requireAdmin, async (_req, res) => {
    try {
      await storage.clearAllData();

      const admin = req.adminUser!;
      notifyAdminAction({
        action: "⚠️ ลบข้อมูลทั้งหมด",
        detail: "ดำเนินการล้างข้อมูลทั้งหมดในระบบ",
        adminName: admin.name,
        adminStudentId: admin.studentId,
        color: 0xEF4444,
      });

      res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อย" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: เพิ่มแต้มขยะ Manual
  app.post("/api/admin/trash-points", requireAdmin, async (req, res) => {
    const { studentId, amount } = req.body;
    if (!studentId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "กรุณากรอกรหัสนักเรียนและจำนวนแต้มให้ถูกต้อง" });
    }
    const user = await storage.getUserByStudentId(studentId);
    if (!user) return res.status(404).json({ message: "ไม่พบนักเรียนที่มีรหัสนี้" });
    const updated = await storage.updateUserTrashPoints(user.id, Number(amount));
    await storage.createActivity(user.id, { type: "stamp", description: `Admin เพิ่มแต้มขยะ +${amount} แต้ม (${Math.floor(Number(amount) / 10)} แสตมป์)` });

    const admin = req.adminUser!;
    notifyAdminAction({
      action: "เพิ่มแต้มขยะ (Manual)",
      detail: `นักเรียน: ${user.name} (${user.studentId})\nแต้มที่เพิ่ม: +${amount} แต้ม`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    const { password: _, ...safeUser } = updated!;
    res.json({ message: `เพิ่ม ${amount} แต้มขยะให้ ${user.name} สำเร็จ`, user: safeUser });
  });

  // Rewards
  app.get("/api/rewards", async (_req, res) => {
    const list = await storage.getRewards();
    res.json(list);
  });

  app.post("/api/rewards", requireAdmin, async (req, res) => {
    const result = insertRewardSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
    }
    const reward = await storage.createReward(result.data);

    const admin = req.adminUser!;
    notifyAdminAction({
      action: "เพิ่มของรางวัล",
      detail: `รางวัล: "${reward.title}"\nราคา: ${reward.stampCost} แต้มขยะ\nจำนวน: ${reward.stock === -1 ? "ไม่จำกัด" : reward.stock}`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json(reward);
  });

  app.delete("/api/rewards/:id", requireAdmin, async (req, res) => {
    const rewards = await storage.getRewards();
    const reward = rewards.find(r => r.id === req.params.id);
    const ok = await storage.deleteReward(req.params.id);
    if (!ok) return res.status(404).json({ message: "ไม่พบของรางวัล" });

    const admin = req.adminUser!;
    notifyAdminAction({
      action: "ลบของรางวัล",
      detail: `รางวัล: "${reward?.title ?? req.params.id}"`,
      adminName: admin.name,
      adminStudentId: admin.studentId,
    });

    res.json({ message: "ลบของรางวัลสำเร็จ" });
  });

  app.post("/api/rewards/:id/redeem", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ" });
    const rewards = await storage.getRewards();
    const reward = rewards.find(r => r.id === req.params.id);
    const result = await storage.createRedemption(userId, req.params.id);
    if (!result.ok) return res.status(400).json({ message: result.message });

    notifyRedemption({
      studentName: result.user!.name,
      studentId: result.user!.studentId,
      rewardTitle: reward?.title ?? req.params.id,
      stampCost: reward?.stampCost ?? 0,
      remainingPoints: result.user!.trashPoints,
    });

    const { password: _, ...safeUser } = result.user!;
    res.json({ message: result.message, user: safeUser, redemption: result.redemption });
  });

  app.get("/api/redemptions", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ" });
    const list = await storage.getRedemptions(userId);
    res.json(list);
  });

  app.get("/api/admin/redemptions", requireAdmin, async (_req, res) => {
    const list = await storage.getAllRedemptions();
    res.json(list);
  });

  return httpServer;
}
