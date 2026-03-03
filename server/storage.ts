import {
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type Activity, type InsertActivity,
  type Report, type InsertReport,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface QrToken {
  token: string;
  type: "checkin" | "stamp";
  createdAt: Date;
  usedBy: Set<string>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  updateUserMerits(id: string, amount: number): Promise<User | undefined>;
  updateUserStamps(id: string, amount: number): Promise<User | undefined>;

  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(a: InsertAnnouncement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;

  createQrToken(type: "checkin" | "stamp"): QrToken;
  getQrToken(token: string): QrToken | undefined;
  markQrUsed(token: string, userId: string): boolean;

  getActivities(userId: string): Promise<Activity[]>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(userId: string, a: InsertActivity): Promise<Activity>;
  updateActivityStatus(id: string, status: string): Promise<Activity | undefined>;

  getReports(userId: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  createReport(userId: string, r: InsertReport): Promise<Report>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private announcements: Map<string, Announcement> = new Map();
  private activities: Map<string, Activity> = new Map();
  private reports: Map<string, Report> = new Map();
  private qrTokens: Map<string, QrToken> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      studentId: "admin",
      name: "ผู้ดูแลระบบ",
      password: "admin1234",
      schoolCode: "ST001",
      role: "admin",
      merits: 0,
      stamps: 0,
    };
    this.users.set(adminId, admin);

    const user1Id = randomUUID();
    const user1: User = {
      id: user1Id,
      studentId: "19823",
      name: "Kittipot Ice",
      password: "1234",
      schoolCode: "ST001",
      role: "student",
      merits: 0,
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
      stamps: 2,
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
      stamps: 5,
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
    return this.users.get(id);
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.studentId === studentId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      studentId: insertUser.studentId,
      name: insertUser.name,
      password: insertUser.password,
      schoolCode: insertUser.schoolCode ?? null,
      role: "student",
      merits: 0,
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

  createQrToken(type: "checkin" | "stamp"): QrToken {
    const token = `st-${type}-${randomUUID().slice(0, 8)}`;
    const qr: QrToken = { token, type, createdAt: new Date(), usedBy: new Set() };
    this.qrTokens.set(token, qr);
    return qr;
  }

  getQrToken(token: string): QrToken | undefined {
    return this.qrTokens.get(token);
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
}

export const storage = new MemStorage();
