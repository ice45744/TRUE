import {
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type Activity, type InsertActivity,
  type Report, type InsertReport,
  type SystemSettings, type InsertSystemSettings,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // In a real app, you'd use a service account from env secrets
    // For now, we'll use a placeholder or check if env exists
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

const db = getApps().length ? getFirestore() : null;

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

  createQrToken(type: "checkin" | "stamp", expiryMinutes?: number | null): QrToken;
  getQrToken(token: string): QrToken | undefined;
  markQrUsed(token: string, userId: string): boolean;
  getCheckinQr(): QrToken | undefined;

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
  private permanentCheckinToken: string | null = null;

  constructor() {
    this.seed();
  }

  private seed() {
    const user1Id = randomUUID();
    const user1: User = {
      id: user1Id,
      studentId: "19823",
      name: "Kittipot Ice",
      password: "1234",
      schoolCode: "ST001",
      role: "student",
      merits: 0,
      trashPoints: 0,
      stamps: 0,
    };
    this.users.set(user1Id, user1);

    const user2Id = randomUUID();
    const user2: User = {
      id: user2Id,
      studentId: "12345",
      name: "สมชาย ใจดี",
      password: "1234",
      schoolCode: "ST001",
      role: "student",
      merits: 3,
      trashPoints: 2,
      stamps: 0,
    };
    this.users.set(user2Id, user2);

    const user3Id = randomUUID();
    const user3: User = {
      id: user3Id,
      studentId: "11111",
      name: "สมหญิง รักเรียน",
      password: "1234",
      schoolCode: "ST001",
      role: "student",
      merits: 7,
      trashPoints: 5,
      stamps: 1,
    };
    this.users.set(user3Id, user3);

    const ann1: Announcement = {
      id: randomUUID(),
      title: "ขอเชิญร่วมกิจกรรมวันเด็กแห่งชาติ",
      content: "สภานักเรียนขอเชิญนักเรียนทุกคนร่วมกิจกรรมวันเด็กแห่งชาติ ในวันเสาร์ที่ 11 มกราคม 2568 ณ อาคารอเนกประสงค์ มีกิจกรรมมากมาย พร้อมของรางวัลสำหรับนักเรียนที่เข้าร่วม",
      authorName: "สภานักเรียน",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    };
    const ann2: Announcement = {
      id: randomUUID(),
      title: "ประกาศผลนักเรียนแต้มความดีประจำเดือน",
      content: "สภานักเรียนขอแสดงความยินดีกับนักเรียนที่ได้รับแต้มความดีสูงสุดประจำเดือนมกราคม",
      authorName: "สภานักเรียน",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    };
    this.announcements.set(ann1.id, ann1);
    this.announcements.set(ann2.id, ann2);

    const act1Id = randomUUID();
    this.activities.set(act1Id, {
      id: act1Id, userId: user2Id, type: "goodness", description: "ช่วยครูยกของ",
      imageUrl: null, status: "pending", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });
    const act2Id = randomUUID();
    this.activities.set(act2Id, {
      id: act2Id, userId: user3Id, type: "checkin", description: "เช็คชื่อผ่าน QR Code",
      imageUrl: null, status: "approved", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const rpt1Id = randomUUID();
    this.reports.set(rpt1Id, {
      id: rpt1Id, userId: user2Id, category: "ความสะอาดและสิ่งแวดล้อม",
      details: "ถังขยะหน้าอาคาร 3 เต็มมาก ไม่มีคนมาเก็บ", imageUrl: null, imageLink: null,
      status: "pending", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const memUser = this.users.get(id);
    if (memUser) return memUser;
    
    console.log("Attempting to fetch user from Firebase:", id);
    // Fallback to Firebase if not in memory (useful after restart)
    if (db) {
      try {
        const doc = await db.collection("users").doc(id).get();
        if (doc.exists) {
          const data = doc.data() as any;
          const user: User = {
            id: id,
            studentId: data.studentId || "",
            name: data.name || "",
            password: data.password || "1234",
            schoolCode: data.schoolCode || null,
            role: data.role || "student",
            merits: data.merits || 0,
            trashPoints: data.trashPoints || 0,
            stamps: data.stamps || 0,
          };
          this.users.set(id, user); // Cache in memory
          return user;
        }
      } catch (e) {
        console.error("Firebase GetUser Error:", e);
      }
    }
    return undefined;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.studentId === studentId);
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
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateUserMerits(id: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, merits: user.merits + amount };
    this.users.set(id, updated);

    // Sync to Firebase
    if (db) {
      try {
        await db.collection("users").doc(id).update({
          merits: updated.merits,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {
        console.error("Firebase Sync Merits Error:", e);
      }
    }

    return updated;
  }

  async updateUserTrashPoints(id: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
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
          stamps: updated.stamps,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {
        console.error("Firebase Sync TrashPoints Error:", e);
      }
    }

    return updated;
  }

  async updateUserStamps(id: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, stamps: user.stamps + amount };
    this.users.set(id, updated);
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
    const ann: Announcement = {
      id: randomUUID(),
      title: a.title,
      content: a.content,
      authorName: a.authorName ?? "สภานักเรียน",
      createdAt: new Date(),
    };
    this.announcements.set(ann.id, ann);
    return ann;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.announcements.delete(id);
  }

  createQrToken(type: "checkin" | "stamp", expiryMinutes?: number | null): QrToken {
    if (type === "checkin") {
      if (this.permanentCheckinToken) {
        const existing = this.qrTokens.get(this.permanentCheckinToken);
        if (existing) return existing;
      }
      const token = `st-checkin-${randomUUID().slice(0, 8)}`;
      const qr: QrToken = { token, type, createdAt: new Date(), expiresAt: null, usedBy: new Set() };
      this.qrTokens.set(token, qr);
      this.permanentCheckinToken = token;
      return qr;
    }

    const token = `st-stamp-${randomUUID().slice(0, 8)}`;
    const mins = expiryMinutes ?? 5;
    const expiresAt = new Date(Date.now() + mins * 60 * 1000);
    const qr: QrToken = { token, type, createdAt: new Date(), expiresAt, usedBy: new Set() };
    this.qrTokens.set(token, qr);
    return qr;
  }

  getQrToken(token: string): QrToken | undefined {
    const qr = this.qrTokens.get(token);
    if (!qr) return undefined;
    if (qr.expiresAt && new Date() > qr.expiresAt) {
      this.qrTokens.delete(token);
      return undefined;
    }
    return qr;
  }

  getCheckinQr(): QrToken | undefined {
    if (!this.permanentCheckinToken) return undefined;
    return this.qrTokens.get(this.permanentCheckinToken);
  }

  markQrUsed(token: string, userId: string): boolean {
    const qr = this.qrTokens.get(token);
    if (!qr) return false;
    if (qr.usedBy.has(userId)) return false;
    qr.usedBy.add(userId);
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
    const act: Activity = {
      id: randomUUID(),
      userId,
      type: a.type,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.activities.set(act.id, act);

    // Sync to Firebase if available
    if (db) {
      try {
        await db.collection("activities").doc(act.id).set({
          ...act,
          createdAt: act.createdAt.toISOString()
        });
        
        // Update user merits/trash in Firebase too
        const user = await this.getUser(userId);
        if (user) {
          await db.collection("users").doc(userId).set({
            ...user,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }
      } catch (e) {
        console.error("Firebase Sync Error:", e);
      }
    }

    return act;
  }

  async updateActivityStatus(id: string, status: string): Promise<Activity | undefined> {
    const act = this.activities.get(id);
    if (!act) return undefined;
    const updated = { ...act, status };
    this.activities.set(id, updated);
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
    const report: Report = {
      id: randomUUID(),
      userId,
      category: r.category,
      details: r.details,
      imageUrl: r.imageUrl ?? null,
      imageLink: r.imageLink ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.reports.set(report.id, report);
    return report;
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const rpt = this.reports.get(id);
    if (!rpt) return undefined;
    const updated = { ...rpt, status };
    this.reports.set(id, updated);
    return updated;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    // If memory has default, try fetching from Firebase
    if (this.systemSettings.id === "default" && db) {
      try {
        const doc = await db.collection("settings").doc("system").get();
        if (doc.exists) {
          const data = doc.data() as any;
          this.systemSettings = {
            ...data,
            maintenanceUntil: data.maintenanceUntil ? new Date(data.maintenanceUntil) : null
          };
        }
      } catch (e) {
        console.error("Firebase GetSettings Error:", e);
      }
    }
    return this.systemSettings;
  }

  async updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings> {
    const updatedSettings = {
      ...this.systemSettings,
      ...settings,
    };
    
    // Ensure maintenanceUntil is a Date object or null
    if (settings.maintenanceUntil !== undefined) {
      updatedSettings.maintenanceUntil = settings.maintenanceUntil ? new Date(settings.maintenanceUntil) : null;
    }
    
    this.systemSettings = updatedSettings;
    
    // Sync to Firebase
    if (db) {
      try {
        await db.collection("settings").doc("system").set({
          ...updatedSettings,
          maintenanceUntil: updatedSettings.maintenanceUntil instanceof Date 
            ? updatedSettings.maintenanceUntil.toISOString() 
            : updatedSettings.maintenanceUntil,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {
        console.error("Firebase Sync Settings Error:", e);
      }
    }
    
    return this.systemSettings;
  }
}

export const storage = new MemStorage();
