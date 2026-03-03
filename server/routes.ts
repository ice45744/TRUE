import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertActivitySchema, insertReportSchema, insertAnnouncementSchema } from "@shared/schema";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ message: "ไม่ได้เข้าสู่ระบบ" });
  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
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
    const { type } = req.body;
    if (type !== "checkin" && type !== "stamp") {
      return res.status(400).json({ message: "ประเภท QR ไม่ถูกต้อง" });
    }
    const qr = storage.createQrToken(type);
    res.json({ token: qr.token, type: qr.type });
  });

  app.post("/api/qr/scan", async (req, res) => {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }
    const qr = storage.getQrToken(token);
    if (!qr) {
      return res.status(404).json({ message: "QR Code ไม่ถูกต้องหรือหมดอายุ" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    const success = storage.markQrUsed(token, userId);
    if (!success) {
      return res.status(409).json({ message: "คุณได้สแกน QR Code นี้ไปแล้ว" });
    }
    const desc = qr.type === "checkin" ? "เช็คชื่อผ่าน QR Code" : "รับแสตมป์ขยะผ่าน QR Code";
    await storage.createActivity(userId, { type: qr.type, description: desc });
    if (qr.type === "checkin") {
      await storage.updateUserMerits(userId, 1);
    } else {
      await storage.updateUserStamps(userId, 1);
    }
    const updatedUser = await storage.getUser(userId);
    const { password: _, ...safeUser } = updatedUser!;
    res.json({
      message: qr.type === "checkin" ? "เช็คชื่อสำเร็จ! ได้รับ 1 แต้มความดี" : "รับแสตมป์สำเร็จ! ได้รับ 1 แสตมป์ขยะ",
      user: safeUser,
      type: qr.type,
    });
  });

  app.get("/api/activities/:userId", async (req, res) => {
    const acts = await storage.getActivities(req.params.userId);
    res.json(acts);
  });

  app.post("/api/activities/:userId", async (req, res) => {
    const result = insertActivitySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    const act = await storage.createActivity(req.params.userId, result.data);
    if (result.data.type === "goodness" || result.data.type === "checkin") {
      await storage.updateUserMerits(req.params.userId, 1);
    } else if (result.data.type === "stamp") {
      await storage.updateUserStamps(req.params.userId, 1);
    }
    const updatedUser = await storage.getUser(req.params.userId);
    const { password: _, ...safeUser } = updatedUser!;
    res.status(201).json({ activity: act, user: safeUser });
  });

  app.get("/api/reports/:userId", async (req, res) => {
    const rpts = await storage.getReports(req.params.userId);
    res.json(rpts);
  });

  app.post("/api/reports/:userId", async (req, res) => {
    const result = insertReportSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }
    const rpt = await storage.createReport(req.params.userId, result.data);
    res.status(201).json(rpt);
  });

  // ===== ADMIN ROUTES =====
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    const safeUsers = users.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const success = await storage.deleteUser(req.params.id);
    if (!success) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  });

  app.get("/api/admin/activities", requireAdmin, async (_req, res) => {
    const acts = await storage.getAllActivities();
    res.json(acts);
  });

  app.patch("/api/admin/activities/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const act = await storage.updateActivityStatus(req.params.id, status);
    if (!act) return res.status(404).json({ message: "ไม่พบกิจกรรม" });
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

  return httpServer;
}
