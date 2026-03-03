import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertActivitySchema, insertReportSchema, insertAnnouncementSchema } from "@shared/schema";

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

  return httpServer;
}
