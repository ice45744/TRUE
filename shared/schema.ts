import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  schoolCode: text("school_code"),
  role: text("role").notNull().default("student"),
  merits: integer("merits").notNull().default(0),
  trashPoints: integer("trash_points").notNull().default(0),
  stamps: integer("stamps").notNull().default(0),
  avatarUrl: text("avatar_url"),
});

export const announcements = pgTable("announcements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull().default("สภานักเรียน"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const reports = pgTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  category: text("category").notNull(),
  details: text("details").notNull(),
  imageUrl: text("image_url"),
  imageLink: text("image_link"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  studentId: true,
  name: true,
  password: true,
  schoolCode: true,
}).extend({
  studentId: z.string().min(4, "รหัสนักเรียนต้องมีอย่างน้อย 4 ตัวอักษร").max(20, "รหัสนักเรียนยาวเกินไป").regex(/^[a-zA-Z0-9ก-๙]+$/, "รหัสนักเรียนใช้ได้เฉพาะตัวเลขและตัวอักษร"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100, "ชื่อยาวเกินไป"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร").max(100, "รหัสผ่านยาวเกินไป"),
  schoolCode: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  studentId: z.string().min(1, "กรุณากรอกรหัสนักเรียน").max(20),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน").max(100),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  authorName: true,
  imageUrl: true,
}).extend({
  title: z.string().min(1, "กรุณากรอกหัวข้อ").max(200, "หัวข้อยาวเกินไป"),
  content: z.string().min(1, "กรุณากรอกเนื้อหา").max(5000, "เนื้อหายาวเกินไป"),
  authorName: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").nullable().optional(),
});

const ACTIVITY_TYPES = ["goodness", "checkin", "stamp"] as const;

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  imageUrl: true,
}).extend({
  type: z.enum(ACTIVITY_TYPES, { errorMap: () => ({ message: "ประเภทกิจกรรมไม่ถูกต้อง" }) }),
  description: z.string().min(1, "กรุณากรอกรายละเอียด").max(1000, "รายละเอียดยาวเกินไป"),
  imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").nullable().optional(),
});

const REPORT_CATEGORIES = ["สิ่งอำนวยความสะดวก", "ความปลอดภัย", "การเรียนการสอน", "สุขภาพ", "อื่นๆ"] as const;

export const insertReportSchema = createInsertSchema(reports).pick({
  category: true,
  details: true,
  imageUrl: true,
  imageLink: true,
}).extend({
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่").max(100),
  details: z.string().min(10, "กรุณากรอกรายละเอียดอย่างน้อย 10 ตัวอักษร").max(2000, "รายละเอียดยาวเกินไป"),
  imageUrl: z.string().url("URL รูปภาพไม่ถูกต้อง").nullable().optional(),
  imageLink: z.string().url("URL ลิงก์รูปไม่ถูกต้อง").nullable().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export const systemSettings = pgTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  maintenanceMode: integer("maintenance_mode").notNull().default(0),
  maintenanceMessage: text("maintenance_message").notNull().default("กรุณารอสักครู่ขณะนี้เซิร์ฟเวอร์เว็บไซต์กำลังปรับปรุง"),
  maintenanceUntil: timestamp("maintenance_until"),
  checkinQrToken: text("checkin_qr_token"),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).extend({
  maintenanceUntil: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().nullable()),
}).pick({
  maintenanceMode: true,
  maintenanceMessage: true,
  maintenanceUntil: true,
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export const rewards = pgTable("rewards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  stampCost: integer("stamp_cost").notNull(),
  stock: integer("stock").notNull().default(-1),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const redemptions = pgTable("redemptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  rewardId: varchar("reward_id", { length: 36 }).notNull(),
  rewardTitle: text("reward_title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  title: true,
  description: true,
  stampCost: true,
  stock: true,
  imageUrl: true,
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Redemption = typeof redemptions.$inferSelect;
