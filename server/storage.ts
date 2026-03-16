import {
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type Activity, type InsertActivity,
  type Report, type InsertReport,
  type SystemSettings, type InsertSystemSettings,
  type Reward, type InsertReward,
  type Redemption,
  users, announcements, activities, reports, systemSettings, rewards, redemptions,
} from "../shared/schema.js";
import { randomUUID } from "crypto";
import { db } from "./db.js";
import { eq, and, lte, isNotNull, or } from "drizzle-orm";

export interface QrToken {
  token: string;
  type: "checkin" | "stamp";
  createdAt: Date;
  expiresAt: Date | null;
  usedBy: Set<string>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  updateUserMerits(id: string, amount: number): Promise<User | undefined>;
  updateUserTrashPoints(id: string, amount: number): Promise<User | undefined>;
  updateUserStamps(id: string, amount: number): Promise<User | undefined>;
  clearAllData(): Promise<void>;

  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(a: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;

  createQrToken(type: "checkin" | "stamp", expiryMinutes?: number | null): Promise<QrToken>;
  getQrToken(token: string): Promise<QrToken | undefined>;
  markQrUsed(token: string, userId: string): Promise<boolean>;
  getCheckinQr(): Promise<QrToken | undefined>;

  getActivities(userId: string): Promise<Activity[]>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(userId: string, a: InsertActivity): Promise<Activity>;
  updateActivityStatus(id: string, status: string): Promise<Activity | undefined>;

  getReports(userId: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  createReport(userId: string, r: InsertReport): Promise<Report>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;

  cleanupExpiredItems(): Promise<{ deletedActivities: number; deletedReports: number }>;

  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings>;

  getRewards(): Promise<Reward[]>;
  createReward(r: InsertReward): Promise<Reward>;
  deleteReward(id: string): Promise<boolean>;
  updateRewardStock(id: string, delta: number): Promise<Reward | undefined>;

  getRedemptions(userId: string): Promise<Redemption[]>;
  getAllRedemptions(): Promise<(Redemption & { userName: string; studentId: string })[]>;
  createRedemption(userId: string, rewardId: string): Promise<{ ok: boolean; message: string; user?: User; redemption?: Redemption }>;
}

const ADMIN_CODE = "สภานักเรียนปี2569/1_2";
const DEFAULT_SETTINGS_ID = "default";

export class DbStorage implements IStorage {
  private qrTokens: Map<string, QrToken> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const isAdmin = insertUser.schoolCode === ADMIN_CODE;
    const [user] = await db.insert(users).values({
      id,
      studentId: insertUser.studentId,
      name: insertUser.name,
      password: insertUser.password,
      schoolCode: insertUser.schoolCode ?? null,
      role: isAdmin ? "admin" : "student",
      merits: 0,
      trashPoints: 0,
      stamps: 0,
    }).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateUserMerits(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const [updated] = await db.update(users)
      .set({ merits: user.merits + amount })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserTrashPoints(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newTrash = user.trashPoints + amount;
    const oldStampsFromTrash = Math.floor(user.trashPoints / 10);
    const newStampsFromTrash = Math.floor(newTrash / 10);
    const stampGain = newStampsFromTrash - oldStampsFromTrash;
    const [updated] = await db.update(users)
      .set({ trashPoints: newTrash, stamps: user.stamps + stampGain })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserStamps(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const [updated] = await db.update(users)
      .set({ stamps: user.stamps + amount })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async clearAllData(): Promise<void> {
    await db.delete(reports);
    await db.delete(activities);
    await db.delete(announcements);
    await db.delete(users);
    await db.delete(systemSettings);
    this.qrTokens.clear();
    console.log("DbStorage: Cleared all data");
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const rows = await db.select().from(announcements);
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [ann] = await db.select().from(announcements).where(eq(announcements.id, id));
    return ann;
  }

  async createAnnouncement(a: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const [ann] = await db.insert(announcements).values({
      id,
      title: a.title,
      content: a.content,
      authorName: a.authorName ?? "สภานักเรียน",
      imageUrl: a.imageUrl ?? null,
    }).returning();
    return ann;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getQrToken(token: string): Promise<QrToken | undefined> {
    const qr = this.qrTokens.get(token);
    if (qr && qr.expiresAt && new Date() > qr.expiresAt) {
      this.qrTokens.delete(token);
      return undefined;
    }
    return qr;
  }

  async createQrToken(type: "checkin" | "stamp", expiryMinutes?: number | null): Promise<QrToken> {
    if (type === "checkin") {
      const existing = await this.getCheckinQr();
      if (existing) return existing;
      const token = `st-checkin-${randomUUID().slice(0, 8)}`;
      const qr: QrToken = { token, type, createdAt: new Date(), expiresAt: null, usedBy: new Set() };
      this.qrTokens.set(token, qr);
      return qr;
    }
    const token = `st-stamp-${randomUUID().slice(0, 8)}`;
    const mins = expiryMinutes ?? 5;
    const expiresAt = new Date(Date.now() + mins * 60 * 1000);
    const qr: QrToken = { token, type, createdAt: new Date(), expiresAt, usedBy: new Set() };
    this.qrTokens.set(token, qr);
    return qr;
  }

  async getCheckinQr(): Promise<QrToken | undefined> {
    for (const qr of this.qrTokens.values()) {
      if (qr.type === "checkin" && (!qr.expiresAt || new Date() <= qr.expiresAt)) {
        return qr;
      }
    }
    return undefined;
  }

  async markQrUsed(token: string, userId: string): Promise<boolean> {
    const qr = await this.getQrToken(token);
    if (!qr) return false;
    if (qr.usedBy.has(userId)) return false;
    qr.usedBy.add(userId);
    return true;
  }

  async getActivities(userId: string): Promise<Activity[]> {
    const rows = await db.select().from(activities).where(eq(activities.userId, userId));
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllActivities(): Promise<Activity[]> {
    const rows = await db.select().from(activities);
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(userId: string, a: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const [act] = await db.insert(activities).values({
      id,
      userId,
      type: a.type,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      status: "pending",
    }).returning();
    return act;
  }

  async updateActivityStatus(id: string, status: string): Promise<Activity | undefined> {
    const isResolved = status === "approved" || status === "rejected";
    const [updated] = await db.update(activities)
      .set({ status, resolvedAt: isResolved ? new Date() : null })
      .where(eq(activities.id, id))
      .returning();
    return updated;
  }

  async getReports(userId: string): Promise<Report[]> {
    const rows = await db.select().from(reports).where(eq(reports.userId, userId));
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllReports(): Promise<Report[]> {
    const rows = await db.select().from(reports);
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReport(userId: string, r: InsertReport): Promise<Report> {
    const id = randomUUID();
    const [rep] = await db.insert(reports).values({
      id,
      userId,
      category: r.category,
      details: r.details,
      imageUrl: r.imageUrl ?? null,
      imageLink: r.imageLink ?? null,
      status: "pending",
    }).returning();
    return rep;
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const isResolved = status === "resolved" || status === "rejected";
    const [updated] = await db.update(reports)
      .set({ status, resolvedAt: isResolved ? new Date() : null })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  }

  async cleanupExpiredItems(): Promise<{ deletedActivities: number; deletedReports: number }> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deletedActRows = await db.delete(activities)
      .where(
        and(
          isNotNull(activities.resolvedAt),
          lte(activities.resolvedAt, cutoff),
          or(
            eq(activities.status, "approved"),
            eq(activities.status, "rejected"),
          )
        )
      )
      .returning();

    const deletedRptRows = await db.delete(reports)
      .where(
        and(
          isNotNull(reports.resolvedAt),
          lte(reports.resolvedAt, cutoff),
          or(
            eq(reports.status, "resolved"),
            eq(reports.status, "rejected"),
          )
        )
      )
      .returning();

    return {
      deletedActivities: deletedActRows.length,
      deletedReports: deletedRptRows.length,
    };
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const [row] = await db.select().from(systemSettings).where(eq(systemSettings.id, DEFAULT_SETTINGS_ID));
    if (row) return row;
    const [created] = await db.insert(systemSettings).values({
      id: DEFAULT_SETTINGS_ID,
      maintenanceMode: 0,
      maintenanceMessage: "กรุณารอสักครู่ขณะนี้เซิร์ฟเวอร์เว็บไซต์กำลังปรับปรุง",
      maintenanceUntil: null,
    }).returning();
    return created;
  }

  async updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings> {
    await this.getSystemSettings();
    const [updated] = await db.update(systemSettings)
      .set(settings)
      .where(eq(systemSettings.id, DEFAULT_SETTINGS_ID))
      .returning();
    return updated;
  }

  async getRewards(): Promise<Reward[]> {
    const rows = await db.select().from(rewards);
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReward(r: InsertReward): Promise<Reward> {
    const id = randomUUID();
    const [reward] = await db.insert(rewards).values({
      id,
      title: r.title,
      description: r.description ?? "",
      stampCost: r.stampCost,
      stock: r.stock ?? -1,
      imageUrl: r.imageUrl ?? null,
    }).returning();
    return reward;
  }

  async deleteReward(id: string): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateRewardStock(id: string, delta: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    if (!reward) return undefined;
    if (reward.stock === -1) return reward;
    const newStock = reward.stock + delta;
    const [updated] = await db.update(rewards)
      .set({ stock: newStock })
      .where(eq(rewards.id, id))
      .returning();
    return updated;
  }

  async getRedemptions(userId: string): Promise<Redemption[]> {
    const rows = await db.select().from(redemptions).where(eq(redemptions.userId, userId));
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllRedemptions(): Promise<(Redemption & { userName: string; studentId: string })[]> {
    const rows = await db.select().from(redemptions);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const result = rows.map(r => {
      const u = userMap.get(r.userId);
      return { ...r, userName: u?.name ?? "ไม่ทราบ", studentId: u?.studentId ?? "-" };
    });
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRedemption(userId: string, rewardId: string): Promise<{ ok: boolean; message: string; user?: User; redemption?: Redemption }> {
    const user = await this.getUser(userId);
    if (!user) return { ok: false, message: "ไม่พบผู้ใช้" };

    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward) return { ok: false, message: "ไม่พบของรางวัล" };

    if (reward.stock === 0) return { ok: false, message: "ของรางวัลหมดแล้ว" };
    if (user.trashPoints < reward.stampCost) return { ok: false, message: `แต้มขยะไม่พอ (ต้องการ ${reward.stampCost} แต้มขยะ)` };

    const id = randomUUID();
    const [red] = await db.insert(redemptions).values({
      id,
      userId,
      rewardId,
      rewardTitle: reward.title,
    }).returning();

    if (reward.stock > 0) {
      await db.update(rewards).set({ stock: reward.stock - 1 }).where(eq(rewards.id, rewardId));
    }

    const [updatedUser] = await db.update(users)
      .set({ trashPoints: user.trashPoints - reward.stampCost })
      .where(eq(users.id, userId))
      .returning();

    return { ok: true, message: `แลกรับ "${reward.title}" สำเร็จ!`, user: updatedUser, redemption: red };
  }
}

export const storage = new DbStorage();
