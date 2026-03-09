import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { loginSchema, insertUserSchema, insertActivitySchema, insertReportSchema, insertAnnouncementSchema } from "../shared/schema.js";
import { log } from "./index.js";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  log(`Checking admin for user: ${userId}`);
  if (!userId) {
    log("Auth failed: Missing x-user-id header");
    return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ (Missing ID)" });
  }
  const user = await storage.getUser(userId);
  if (!user) {
    log(`Auth failed: User ${userId} not found in storage`);
    return res.status(401).json({ message: "ไม่พบผู้ใช้" });
  }
  if (user.role !== "admin") {
    log(`Auth failed: User ${userId} is not admin. Role: ${user.role}`);
    return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/sync", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      log(`Error syncing user: ${error}`);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการซิงค์ข้อมูล" });
    }
  });

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
    res.status(201).json({ user: safeUser });
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/announcements", async (_req, res) => {
    const announcements = await storage.getAnnouncements();
    res.json(announcements);
  });

  app.post("/api/announcements", async (req, res) => {
    const result = insertAnnouncementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const ann = await storage.createAnnouncement(result.data);
    res.status(201).json(ann);
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    const success = await storage.deleteAnnouncement(req.params.id);
    if (!success) return res.status(404).json({ message: "ไม่พบประกาศ" });
    res.json({ message: "ลบประกาศสำเร็จ" });
  });

  app.post("/api/qr/generate", requireAdmin, async (req, res) => {
    const { type, expiryMinutes } = req.body;
    if (type !== "checkin" && type !== "stamp") {
      return res.status(400).json({ message: "ประเภท QR ไม่ถูกต้อง" });
    }
    const qr = await storage.createQrToken(type, type === "stamp" ? (expiryMinutes ?? 5) : null);
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

    if (qr.type === "checkin") {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 6 || hour >= 8) {
        return res.status(403).json({ message: "QR เช็คชื่อใช้ได้เฉพาะเวลา 06:00 - 08:00 น. เท่านั้น" });
      }
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
      const now = new Date();
      const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const dailyKey = `${userId}_${today}`;
      await storage.markQrUsed(token, dailyKey);
    } else {
      const success = await storage.markQrUsed(token, userId);
      if (!success) {
        return res.status(409).json({ message: "คุณได้สแกน QR Code นี้ไปแล้ว" });
      }
    }

    if (qr.type === "checkin") {
      await storage.createActivity(userId, { type: "checkin", description: "เช็คชื่อผ่าน QR Code (+1 แต้มความดี)" });
      const updated = await storage.updateUserMerits(userId, 1);
      const { password: _, ...safeUser } = updated!;
      res.json({
        message: `เช็คชื่อสำเร็จ! ได้รับ 1 แต้มความดี (รวม ${updated!.merits} แต้ม)`,
        user: safeUser,
        type: "checkin",
      });
    } else {
      await storage.createActivity(userId, { type: "stamp", description: "รับแต้มขยะผ่าน QR Code (+1 แต้มขยะ)" });
      const updated = await storage.updateUserTrashPoints(userId, 1);
      const { password: _, ...safeUser } = updated!;
      const stampMsg = updated!.trashPoints % 10 === 0 ? " 🎉 ครบ 10 แต้ม ได้รับ 1 แสตมป์!" : "";
      res.json({
        message: `รับแต้มขยะสำเร็จ! ได้รับ 1 แต้มขยะ (รวม ${updated!.trashPoints} แต้ม)${stampMsg}`,
        user: safeUser,
        type: "stamp",
      });
    }
  });

  app.get("/api/activities/:userId", async (req, res) => {
    const acts = await storage.getActivities(req.params.userId);
    res.json(acts);
  });

  app.post("/api/activities/:userId", async (req, res) => {
    try {
      log(`POST /api/activities/${req.params.userId} - Body: ${JSON.stringify(req.body)}`);
      const result = insertActivitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
      }
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
      
      const act = await storage.createActivity(req.params.userId, result.data);
      if (result.data.type === "goodness" || result.data.type === "checkin") {
        await storage.updateUserMerits(req.params.userId, 1);
      } else if (result.data.type === "stamp") {
        await storage.updateUserTrashPoints(req.params.userId, 1);
      }
      
      const updatedUser = await storage.getUser(req.params.userId);
      const { password: _, ...safeUser } = updatedUser!;
      log(`Activity created successfully for ${req.params.userId}`);
      res.status(201).json({ activity: act, user: safeUser });
    } catch (error: any) {
      log(`Error creating activity: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reports/:userId", async (req, res) => {
    try {
      log(`POST /api/reports/${req.params.userId} - Body: ${JSON.stringify(req.body)}`);
      const result = insertReportSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง: " + result.error.message });
      }
      const rpt = await storage.createReport(req.params.userId, result.data);
      log(`Report created successfully for ${req.params.userId}`);
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
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID ไม่ถูกต้อง" });
    }
    const success = await storage.deleteUser(id);
    if (!success) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });

  app.get("/api/admin/activities", requireAdmin, async (_req, res) => {
    const acts = await storage.getAllActivities();
    res.json(acts);
  });

  app.patch("/api/admin/activities/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID ไม่ถูกต้อง" });
    }
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const act = await storage.updateActivityStatus(id, status);
    if (!act) return res.status(404).json({ message: "ไม่พบกิจกรรม" });
    res.json(act);
  });

  app.get("/api/admin/reports", requireAdmin, async (_req, res) => {
    const rpts = await storage.getAllReports();
    res.json(rpts);
  });

  app.patch("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID ไม่ถูกต้อง" });
    }
    const { status } = req.body;
    if (!["resolved", "rejected", "in_progress"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const rpt = await storage.updateReportStatus(id, status);
    if (!rpt) return res.status(404).json({ message: "ไม่พบรายงาน" });
    res.json(rpt);
  });

  app.get("/api/system/settings", async (_req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.patch("/api/system/settings", requireAdmin, async (req, res) => {
    try {
      log(`PATCH /api/system/settings - Body: ${JSON.stringify(req.body)}`);
      // Validate that at least one field is being updated
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No data provided for update" });
      }
      const settings = await storage.updateSystemSettings(req.body);
      log(`Settings updated successfully in MemStorage: ${JSON.stringify(settings)}`);
      res.json(settings);
    } catch (error: any) {
      log(`Error updating settings: ${error.message}`);
      console.error("Full error updating settings:", error);
      res.status(500).json({ message: error.message });
    }
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
      res.json({ message: "ลบข้อมูลทั้งหมดเรียบร้อย" });
    } catch (error: any) {
      log(`Error clearing all data: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
