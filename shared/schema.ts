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
});

export const loginSchema = z.object({
  studentId: z.string().min(1, "กรุณากรอกรหัสนักเรียน"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  authorName: true,
  imageUrl: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  imageUrl: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  category: true,
  details: true,
  imageUrl: true,
  imageLink: true,
});

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
