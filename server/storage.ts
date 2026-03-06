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
if (!getApps().length) {
  try {
        // In a real app, you'd use a service account from env secrets
        // For now, we'll use a placeholder or check if env exists
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            let saContent = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            // Handle cases where the JSON might be wrapped in quotes
            if ((saContent.startsWith("'") && saContent.endsWith("'")) || 
                (saContent.startsWith('"') && saContent.endsWith('"'))) {
              saContent = saContent.slice(1, -1);
            }
            
            const serviceAccount = JSON.parse(saContent);
            
            if (serviceAccount.private_key) {
              // Standard fix for Firebase private keys in environment variables
              let key = serviceAccount.private_key;
              if (typeof key === 'string') {
                // Replace escaped \n with actual newlines
                key = key.replace(/\\n/g, '\n');
                
                // Ensure it has headers and footers, and normalize internal spacing
                const header = "-----BEGIN PRIVATE KEY-----";
                const footer = "-----END PRIVATE KEY-----";
                
                let body = key;
                if (body.includes(header)) body = body.split(header)[1];
                if (body.includes(footer)) body = body.split(footer)[0];
                
                // Remove all whitespace and existing newlines from the base64 body
                body = body.replace(/\s+/g, '');
                
                // Re-wrap body to 64 chars per line as required by many PEM parsers
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
              console.log("Firebase Admin Initialized successfully for project:", serviceAccount.project_id);
            }
          } catch (parseError: any) {
            // Only log a small part of the error to avoid leaking secrets but enough to debug
            console.error("Firebase Initialization Error: Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.");
            console.error("Parse Error Detail:", parseError.message || parseError);
          }
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
    if (db) {
      try {
        const snapshot = await db.collection("users").get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.users.has(doc.id)) {
            this.users.set(doc.id, {
              id: doc.id,
              studentId: data.studentId || "",
              name: data.name || "",
              password: data.password || "1234",
              schoolCode: data.schoolCode || null,
              role: data.role || "student",
              merits: data.merits || 0,
              trashPoints: data.trashPoints || 0,
              stamps: data.stamps || 0,
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetAllUsers Error:", e);
      }
    }
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

    if (db) {
      try {
        await db.collection("users").doc(id).set({
          ...user,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Firebase CreateUser Error:", e);
      }
    }
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (db) {
      try {
        await db.collection("users").doc(id).delete();
      } catch (e) {
        console.error("Firebase DeleteUser Error:", e);
      }
    }
    return deleted;
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
    if (db) {
      try {
        const snapshot = await db.collection("announcements").orderBy("createdAt", "desc").get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.announcements.has(doc.id)) {
            this.announcements.set(doc.id, {
              id: doc.id,
              title: data.title,
              content: data.content,
              authorName: data.authorName,
              createdAt: new Date(data.createdAt),
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetAnnouncements Error:", e);
      }
    }
    return Array.from(this.announcements.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const mem = this.announcements.get(id);
    if (mem) return mem;

    if (db) {
      try {
        const doc = await db.collection("announcements").doc(id).get();
        if (doc.exists) {
          const data = doc.data() as any;
          const ann = {
            id: doc.id,
            title: data.title,
            content: data.content,
            authorName: data.authorName,
            createdAt: new Date(data.createdAt),
          };
          this.announcements.set(id, ann);
          return ann;
        }
      } catch (e) {
        console.error("Firebase GetAnnouncement Error:", e);
      }
    }
    return undefined;
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

    if (db) {
      try {
        await db.collection("announcements").doc(id).set({
          ...ann,
          createdAt: ann.createdAt.toISOString()
        });
      } catch (e) {
        console.error("Firebase CreateAnnouncement Error:", e);
      }
    }
    return ann;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const deleted = this.announcements.delete(id);
    if (db) {
      try {
        await db.collection("announcements").doc(id).delete();
      } catch (e) {
        console.error("Firebase DeleteAnnouncement Error:", e);
      }
    }
    return deleted;
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
    if (db) {
      try {
        const snapshot = await db.collection("activities").where("userId", "==", userId).get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.activities.has(doc.id)) {
            this.activities.set(doc.id, {
              ...data,
              id: doc.id,
              createdAt: new Date(data.createdAt)
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetActivities Error:", e);
      }
    }
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllActivities(): Promise<Activity[]> {
    if (db) {
      try {
        const snapshot = await db.collection("activities").get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.activities.has(doc.id)) {
            this.activities.set(doc.id, {
              ...data,
              id: doc.id,
              createdAt: new Date(data.createdAt)
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetAllActivities Error:", e);
      }
    }
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

    // Sync to Firebase if available
    if (db) {
      try {
        await db.collection("activities").doc(id).set({
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

    if (db) {
      try {
        await db.collection("activities").doc(id).update({ status });
      } catch (e) {
        console.error("Firebase UpdateActivity Error:", e);
      }
    }
    return updated;
  }

  async getReports(userId: string): Promise<Report[]> {
    if (db) {
      try {
        const snapshot = await db.collection("reports").where("userId", "==", userId).get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.reports.has(doc.id)) {
            this.reports.set(doc.id, {
              ...data,
              id: doc.id,
              createdAt: new Date(data.createdAt)
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetReports Error:", e);
      }
    }
    return Array.from(this.reports.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllReports(): Promise<Report[]> {
    if (db) {
      try {
        const snapshot = await db.collection("reports").get();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          if (!this.reports.has(doc.id)) {
            this.reports.set(doc.id, {
              ...data,
              id: doc.id,
              createdAt: new Date(data.createdAt)
            });
          }
        });
      } catch (e) {
        console.error("Firebase GetAllReports Error:", e);
      }
    }
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReport(userId: string, r: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      userId,
      category: r.category,
      details: r.details,
      imageUrl: r.imageUrl ?? null,
      imageLink: r.imageLink ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.reports.set(id, report);

    if (db) {
      try {
        await db.collection("reports").doc(id).set({
          ...report,
          createdAt: report.createdAt.toISOString()
        });
      } catch (e) {
        console.error("Firebase CreateReport Error:", e);
      }
    }
    return report;
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const rpt = this.reports.get(id);
    if (!rpt) return undefined;
    const updated = { ...rpt, status };
    this.reports.set(id, updated);

    if (db) {
      try {
        await db.collection("reports").doc(id).update({ status });
      } catch (e) {
        console.error("Firebase UpdateReport Error:", e);
      }
    }
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
    console.log("MemStorage: Updating settings with:", settings);
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
        console.log("MemStorage: Syncing settings to Firebase with ID 'system' in collection 'settings'...");
        // Use set with merge to ensure we don't overwrite other fields if they exist
        await db.collection("settings").doc("system").set({
          maintenanceMode: updatedSettings.maintenanceMode,
          maintenanceMessage: updatedSettings.maintenanceMessage,
          maintenanceUntil: updatedSettings.maintenanceUntil instanceof Date 
            ? updatedSettings.maintenanceUntil.toISOString() 
            : updatedSettings.maintenanceUntil,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log("MemStorage: Firebase sync successful");
      } catch (e) {
        console.error("MemStorage: Firebase Sync Settings Error:", e);
        // We don't throw here to ensure MemStorage at least stays updated
      }
    }
    
    return this.systemSettings;
  }
}

export const storage = new MemStorage();
