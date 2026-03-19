// ============================================================
//  Discord Webhook Config — แก้ไข URL ได้ที่นี่เท่านั้น
// ============================================================
export const WEBHOOKS = {
  REPORTS:       "https://discord.com/api/webhooks/1466822966867132460/OnSF_IeBbhIj7WahZkX-JSnzXWfOEL0j9n6YXwpSPxYD525vGrSn2fFWTyCf0ROMKs3k",
  ANNOUNCEMENTS: "https://discord.com/api/webhooks/1466822348358422671/B9-tLA3AMnfReZ-88GKnkQFFQTCFfpcPha4glXFPanCBfCJfs3KGQlQiXf_ZM1mxjeqZ",
  REGISTRATIONS: "https://discord.com/api/webhooks/1466822976207847556/NizRwGIGkL3EqyQEAKDrnl4H_f6UiGKvj1sqwKCWpm30HWcIg0OQ0Bvgf2VZrVq0cdue",
  ADMIN:         "https://discord.com/api/webhooks/1467136460506271863/McED-tyn4MGH53q1smhHqDf2phVOL9xK3KYUU6IGVeMPvvF6skpIEAt5Y9qPbhkbYHiy",
  REDEMPTIONS:   "https://discord.com/api/webhooks/1467911314536927363/TvoSxnqi71xqhcYzPrmGmSX1HKj89CBvJr5VvkAYTz3mPfBohTKQUFU_gqI9Pgo0pXYF",
  QR_CHECKIN:    "https://discord.com/api/webhooks/1477690051155460369/ouXwyUpSNyQCoDG8LDAwJNC4sHAiFhe5i_1eeACplqcKVSpVyJs5fCYCWrpQ-Dwwklux",
} as const;

// ============================================================
//  Colors
// ============================================================
const COLOR = {
  GREEN:  0x22C55E,
  BLUE:   0x3B82F6,
  YELLOW: 0xEAB308,
  ORANGE: 0xF97316,
  RED:    0xEF4444,
  PURPLE: 0x8B5CF6,
  CYAN:   0x06B6D4,
  GRAY:   0x6B7280,
} as const;

// ============================================================
//  Helpers
// ============================================================
function thaiTime(): string {
  return new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface Embed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

async function send(webhookUrl: string, embed: Embed): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ ...embed, timestamp: new Date().toISOString() }] }),
    });
  } catch {
    // ไม่ block main flow หาก Discord ไม่ตอบ
  }
}

// ============================================================
//  1. Report status change
// ============================================================
const REPORT_STATUS_LABEL: Record<string, string> = {
  pending:     "⏳ รอดำเนินการ",
  in_progress: "🔄 กำลังดำเนินการ",
  resolved:    "✅ ดำเนินการเสร็จแล้ว",
  rejected:    "❌ ปฏิเสธ",
};
const REPORT_STATUS_COLOR: Record<string, number> = {
  pending:     COLOR.YELLOW,
  in_progress: COLOR.BLUE,
  resolved:    COLOR.GREEN,
  rejected:    COLOR.RED,
};

export async function notifyReportStatus(opts: {
  reportId: string;
  category: string;
  details: string;
  studentName: string;
  studentId: string;
  newStatus: string;
  adminName: string;
  adminStudentId: string;
}) {
  await send(WEBHOOKS.REPORTS, {
    title: `📋 อัปเดตสถานะรายงานปัญหา`,
    color: REPORT_STATUS_COLOR[opts.newStatus] ?? COLOR.GRAY,
    fields: [
      { name: "หมวดหมู่", value: opts.category, inline: true },
      { name: "สถานะใหม่", value: REPORT_STATUS_LABEL[opts.newStatus] ?? opts.newStatus, inline: true },
      { name: "รายละเอียด", value: opts.details.slice(0, 200) },
      { name: "ผู้รายงาน", value: `${opts.studentName} (${opts.studentId})`, inline: true },
      { name: "Admin ที่ดำเนินการ", value: `${opts.adminName} (${opts.adminStudentId})`, inline: true },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

// ============================================================
//  2. Announcement
// ============================================================
export async function notifyAnnouncementCreated(opts: {
  title: string;
  content: string;
  authorName: string;
  adminName: string;
  adminStudentId: string;
}) {
  await send(WEBHOOKS.ANNOUNCEMENTS, {
    title: "📢 ประกาศใหม่",
    color: COLOR.PURPLE,
    fields: [
      { name: "หัวข้อ", value: opts.title },
      { name: "เนื้อหา", value: opts.content.slice(0, 300) },
      { name: "ผู้เขียน", value: opts.authorName, inline: true },
      { name: "Admin", value: `${opts.adminName} (${opts.adminStudentId})`, inline: true },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

export async function notifyAnnouncementDeleted(opts: {
  title: string;
  adminName: string;
  adminStudentId: string;
}) {
  await send(WEBHOOKS.ANNOUNCEMENTS, {
    title: "🗑️ ลบประกาศ",
    color: COLOR.RED,
    fields: [
      { name: "หัวข้อที่ถูกลบ", value: opts.title },
      { name: "Admin", value: `${opts.adminName} (${opts.adminStudentId})` },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

// ============================================================
//  3. New registration
// ============================================================
export async function notifyNewRegistration(opts: {
  name: string;
  studentId: string;
  schoolCode?: string | null;
}) {
  await send(WEBHOOKS.REGISTRATIONS, {
    title: "🎉 สมาชิกใหม่ลงทะเบียน",
    color: COLOR.CYAN,
    fields: [
      { name: "ชื่อ", value: opts.name, inline: true },
      { name: "รหัสนักเรียน", value: opts.studentId, inline: true },
      { name: "รหัสโรงเรียน", value: opts.schoolCode || "-", inline: true },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

// ============================================================
//  4. Admin actions (generic — ทุก action ของ admin)
// ============================================================
export async function notifyAdminAction(opts: {
  action: string;
  detail: string;
  adminName: string;
  adminStudentId: string;
  color?: number;
}) {
  await send(WEBHOOKS.ADMIN, {
    title: `🛡️ Admin: ${opts.action}`,
    color: opts.color ?? COLOR.ORANGE,
    fields: [
      { name: "รายละเอียด", value: opts.detail },
      { name: "ผู้ดำเนินการ", value: `${opts.adminName} (${opts.adminStudentId})` },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

// ============================================================
//  5. Reward redemption
// ============================================================
export async function notifyRedemption(opts: {
  studentName: string;
  studentId: string;
  rewardTitle: string;
  stampCost: number;
  remainingPoints: number;
}) {
  await send(WEBHOOKS.REDEMPTIONS, {
    title: "🎁 แลกรับของรางวัล",
    color: COLOR.GREEN,
    fields: [
      { name: "นักเรียน", value: `${opts.studentName} (${opts.studentId})`, inline: true },
      { name: "ของรางวัล", value: opts.rewardTitle, inline: true },
      { name: "แต้มที่ใช้", value: `♻ ${opts.stampCost}`, inline: true },
      { name: "แต้มคงเหลือ", value: `♻ ${opts.remainingPoints}`, inline: true },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}

// ============================================================
//  6. QR Checkin scan
// ============================================================
export async function notifyQrCheckin(opts: {
  studentName: string;
  studentId: string;
  totalMerits: number;
}) {
  await send(WEBHOOKS.QR_CHECKIN, {
    title: "✅ เช็คชื่อผ่าน QR Code",
    color: COLOR.YELLOW,
    fields: [
      { name: "นักเรียน", value: `${opts.studentName} (${opts.studentId})`, inline: true },
      { name: "แต้มความดีสะสม", value: `⭐ ${opts.totalMerits} แต้ม`, inline: true },
    ],
    footer: { text: `เวลา: ${thaiTime()}` },
  });
}
