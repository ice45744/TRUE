import {
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type Activity, type InsertActivity,
  type Report, type InsertReport,
  type SystemSettings, type InsertSystemSettings,
} from "../shared/schema.js";
import { randomUUID } from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
let db: any = null;
if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    console.log(`[Firebase Init] FIREBASE_SERVICE_ACCOUNT env var: ${serviceAccountJson ? "SET" : "NOT SET"}`);
    if (serviceAccountJson) {
      let saContent = serviceAccountJson.trim();
      if ((saContent.startsWith("'") && saContent.endsWith("'")) || 
          (saContent.startsWith('"') && saContent.endsWith('"'))) {
        saContent = saContent.slice(1, -1);
      }
      
      const serviceAccount = JSON.parse(saContent);
      if (serviceAccount.private_key) {
        let key = serviceAccount.private_key;
        if (typeof key === 'string') {
          key = key.replace(/\\n/g, '\n');
          const header = "-----BEGIN PRIVATE KEY-----";
          const footer = "-----END PRIVATE KEY-----";
          let body = key;
          if (body.includes(header)) body = body.split(header)[1];
          if (body.includes(footer)) body = body.split(footer)[0];
          body = body.replace(/\s+/g, '');
          const chunks = body.match(/.{1,64}/g) || [];
          if (chunks.length > 0) {
            serviceAccount.private_key = `${header}\n${chunks.join('\n')}\n${footer}\n`;
          }
        }
      }

      if (serviceAccount.project_id && serviceAccount.private_key) {
        initializeApp({
          credential: cert(serviceAccount)
        });
        db = getFirestore();
        console.log("✓ Firebase Admin SDK initialized successfully");
      }
    } else {
      console.log("ℹ Firebase service account not configured - using in-memory storage only");
    }
  } catch (e) {
    console.error("Firebase initialization warning:", e);
  }
}

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

  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private announcements: Map<string, Announcement> = new Map();
  private activities: Map<string, Activity> = new Map();
  private reports: Map<string, Report> = new Map();
  private qrTokens: Map<string, QrToken> = new Map();
  private systemSettings: SystemSettings = {
    id: "default",
    maintenanceMode: 0,
    maintenanceMessage: "กรุณารอสักครู่ขณะนี้เซิร์ฟเวอร์เว็บไซต์กำลังปรับปรุง",
    maintenanceUntil: null,
  };

  constructor() {
    // Mock database seeding disabled
    // this.seed();
  }

  async getUser(id: string): Promise<User | undefined> {
    const mem = this.users.get(id);
    if (mem) {
      console.log(`MemStorage: Found user ${id} in memory`);
      return mem;
    }
    console.log(`MemStorage: User ${id} not found in memory`);
    return undefined;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.studentId === studentId) {
        console.log(`MemStorage: Found user by studentId ${studentId}`);
        return user;
      }
    }
    console.log(`MemStorage: User with studentId ${studentId} not found`);
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const ADMIN_CODE = "สภานักเรียนปี2569/1_2";
    const isAdmin = insertUser.schoolCode === ADMIN_CODE;
    const user: User = {
      id,
      studentId: insertUser.studentId,
      name: insertUser.name,
      password: insertUser.password,
      schoolCode: insertUser.schoolCode ?? null,
      role: isAdmin ? "admin" : "student",
      merits: 0,
      trashPoints: 0,
      stamps: 0,
    };

    this.users.set(id, user);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("users").doc(id).set(user);
        console.log(`Firebase Sync: Saved user ${id}`);
      } catch (e) {
        console.error(`Firebase Sync Error (user ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Created user ${id} (studentId: ${insertUser.studentId}, role: ${user.role})`);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) {
      console.log(`MemStorage: Deleted user ${id}`);
    }
    return deleted;
  }

  async updateUserMerits(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const updated = { ...user, merits: user.merits + amount };
    this.users.set(id, updated);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("users").doc(id).update({ merits: updated.merits });
        console.log(`Firebase Sync: Updated user ${id} merits to ${updated.merits}`);
      } catch (e) {
        console.error(`Firebase Sync Error (user ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Updated merits for user ${id}: ${updated.merits}`);
    return updated;
  }

  async updateUserTrashPoints(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newTrash = user.trashPoints + amount;
    const oldStampsFromTrash = Math.floor(user.trashPoints / 10);
    const newStampsFromTrash = Math.floor(newTrash / 10);
    const stampGain = newStampsFromTrash - oldStampsFromTrash;
    const updated = {
      ...user,
      trashPoints: newTrash,
      stamps: user.stamps + stampGain,
    };
    this.users.set(id, updated);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("users").doc(id).update({ 
          trashPoints: updated.trashPoints,
          stamps: updated.stamps 
        });
        console.log(`Firebase Sync: Updated user ${id} trash=${updated.trashPoints}, stamps=${updated.stamps}`);
      } catch (e) {
        console.error(`Firebase Sync Error (user ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Updated trash/stamps for user ${id}: trash=${updated.trashPoints}, stamps=${updated.stamps}`);
    return updated;
  }

  async updateUserStamps(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const updated = { ...user, stamps: user.stamps + amount };
    this.users.set(id, updated);
    console.log(`MemStorage: Updated stamps for user ${id}: ${updated.stamps}`);
    return updated;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(a: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const ann: Announcement = {
      id,
      title: a.title,
      content: a.content,
      authorName: a.authorName ?? "สภานักเรียน",
      createdAt: new Date(),
    };
    this.announcements.set(id, ann);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("announcements").doc(id).set({
          ...ann,
          createdAt: ann.createdAt.toISOString()
        });
        console.log(`Firebase Sync: Saved announcement ${id}`);
      } catch (e) {
        console.error(`Firebase Sync Error (announcement ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Created announcement ${id}`);
    return ann;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const deleted = this.announcements.delete(id);
    if (deleted) {
      console.log(`MemStorage: Deleted announcement ${id}`);
    }
    return deleted;
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
      console.log(`MemStorage: Created checkin QR token: ${token}`);
      return qr;
    }

    const token = `st-stamp-${randomUUID().slice(0, 8)}`;
    const mins = expiryMinutes ?? 5;
    const expiresAt = new Date(Date.now() + mins * 60 * 1000);
    const qr: QrToken = { token, type, createdAt: new Date(), expiresAt, usedBy: new Set() };
    this.qrTokens.set(token, qr);
    console.log(`MemStorage: Created stamp QR token: ${token} (expires in ${mins} mins)`);
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
    console.log(`MemStorage: Marked QR token ${token} as used by ${userId}`);
    return true;
  }

  async getActivities(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(userId: string, a: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const act: Activity = {
      id,
      userId,
      type: a.type,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.activities.set(id, act);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("activities").doc(id).set({
          ...act,
          createdAt: act.createdAt.toISOString()
        });
        console.log(`Firebase Sync: Saved activity ${id}`);
      } catch (e) {
        console.error(`Firebase Sync Error (activity ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Created activity ${id} for user ${userId}`);
    return act;
  }

  async updateActivityStatus(id: string, status: string): Promise<Activity | undefined> {
    const act = this.activities.get(id);
    if (!act) return undefined;
    const updated = { ...act, status };
    this.activities.set(id, updated);
    console.log(`MemStorage: Updated activity ${id} status to ${status}`);
    return updated;
  }

  async getReports(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReport(userId: string, r: InsertReport): Promise<Report> {
    const id = randomUUID();
    const rep: Report = {
      id,
      userId,
      category: r.category,
      details: r.details,
      imageUrl: r.imageUrl ?? null,
      imageLink: r.imageLink ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.reports.set(id, rep);
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("reports").doc(id).set({
          ...rep,
          createdAt: rep.createdAt.toISOString()
        });
        console.log(`Firebase Sync: Saved report ${id}`);
      } catch (e) {
        console.error(`Firebase Sync Error (report ${id}):`, e);
      }
    }
    
    console.log(`MemStorage: Created report ${id} for user ${userId}`);
    return rep;
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const rep = this.reports.get(id);
    if (!rep) return undefined;
    const updated = { ...rep, status };
    this.reports.set(id, updated);
    console.log(`MemStorage: Updated report ${id} status to ${status}`);
    return updated;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings> {
    this.systemSettings = { ...this.systemSettings, ...settings };
    console.log(`MemStorage: Updated system settings`);
    return this.systemSettings;
  }
}

export const storage = new MemStorage();
