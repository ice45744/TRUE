import autocannon from "autocannon";

const BASE = "http://localhost:5000";
const ADMIN_ID = "f9dce848-8c6c-4c4a-98f7-7658aa9258b5";

// ─── helpers ─────────────────────────────────────────────────────────────────
const line = (char = "─", len = 60) => char.repeat(len);
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);

function color(text, code) { return `\x1b[${code}m${text}\x1b[0m`; }
const green  = t => color(t, "32");
const yellow = t => color(t, "33");
const red    = t => color(t, "31");
const cyan   = t => color(t, "36");
const bold   = t => color(t, "1");

function grade(p99ms, errPct) {
  if (errPct > 5)  return red("FAIL ✗");
  if (p99ms < 100) return green("ดีเยี่ยม ★★★");
  if (p99ms < 300) return green("ดี ★★");
  if (p99ms < 800) return yellow("พอใช้ ★");
  return red("ช้า ✗");
}

async function run(label, opts, concurrency = 20, duration = 8) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url: BASE,
      connections: concurrency,
      duration,
      ...opts,
    }, (err, result) => {
      resolve({ label, result, err });
    });
    autocannon.track(instance, { renderProgressBar: false });
  });
}

// ─── test suite ──────────────────────────────────────────────────────────────
const TESTS = [
  // ── Public ──
  {
    label: "GET  /api/system/settings        (Public)",
    concurrency: 50, duration: 8,
    opts: { method: "GET", path: "/api/system/settings" },
  },
  {
    label: "GET  /api/announcements          (Public)",
    concurrency: 50, duration: 8,
    opts: { method: "GET", path: "/api/announcements" },
  },

  // ── Auth ──
  {
    label: "POST /api/auth/login             (Login — wrong creds/401)",
    concurrency: 20, duration: 6,
    opts: {
      method: "POST", path: "/api/auth/login",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId: "99999", password: "wrong" }),
    },
  },

  // ── Student ──
  {
    label: "GET  /api/users/:id              (Student profile)",
    concurrency: 40, duration: 8,
    opts: {
      method: "GET", path: `/api/users/${ADMIN_ID}`,
      headers: { "x-user-id": ADMIN_ID },
    },
  },
  {
    label: "GET  /api/activities/:userId     (Activity list)",
    concurrency: 40, duration: 8,
    opts: {
      method: "GET", path: `/api/activities/${ADMIN_ID}`,
      headers: { "x-user-id": ADMIN_ID },
    },
  },
  {
    label: "GET  /api/announcements          (50 concurrent users)",
    concurrency: 50, duration: 8,
    opts: { method: "GET", path: "/api/announcements" },
  },

  // ── Admin ──
  {
    label: "GET  /api/admin/stats            (Admin dashboard)",
    concurrency: 20, duration: 8,
    opts: {
      method: "GET", path: "/api/admin/stats",
      headers: { "x-user-id": ADMIN_ID },
    },
  },
  {
    label: "GET  /api/admin/activities       (Admin activity list)",
    concurrency: 20, duration: 8,
    opts: {
      method: "GET", path: "/api/admin/activities",
      headers: { "x-user-id": ADMIN_ID },
    },
  },
  {
    label: "GET  /api/admin/users            (Admin user list)",
    concurrency: 20, duration: 8,
    opts: {
      method: "GET", path: "/api/admin/users",
      headers: { "x-user-id": ADMIN_ID },
    },
  },
  {
    label: "GET  /api/admin/reports          (Admin reports)",
    concurrency: 20, duration: 8,
    opts: {
      method: "GET", path: "/api/admin/reports",
      headers: { "x-user-id": ADMIN_ID },
    },
  },

  // ── DB Write ──
  {
    label: "PATCH /api/system/settings      (DB write — maintenance)",
    concurrency: 10, duration: 6,
    opts: {
      method: "PATCH", path: "/api/system/settings",
      headers: { "content-type": "application/json", "x-user-id": ADMIN_ID },
      body: JSON.stringify({ maintenanceMessage: "load test" }),
    },
  },

  // ── Stress Test ──
  {
    label: "STRESS /api/announcements       (100 concurrent)",
    concurrency: 100, duration: 10,
    opts: { method: "GET", path: "/api/announcements" },
  },
];

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + bold(line("═")));
  console.log(bold(cyan("  S.T. ก้าวหน้า — Load Test Report")));
  console.log(bold(cyan("  ทดสอบระบบด้วยผู้ใช้งานจำนวนมากพร้อมกัน")));
  console.log(bold(line("═")));
  console.log(`  Server : ${cyan(BASE)}`);
  console.log(`  เวลา   : ${cyan(new Date().toLocaleString("th-TH"))}`);
  console.log(bold(line("═")) + "\n");

  const results = [];

  for (const t of TESTS) {
    process.stdout.write(`  ⏳ กำลังทดสอบ: ${t.label} ... `);
    const { label, result, err } = await run(t.label, t.opts, t.concurrency, t.duration);
    if (err) {
      console.log(red("ERROR: " + err.message));
      continue;
    }
    const lat = result.latency;
    const req = result.requests;
    const errCount = result["2xx"] ? (result.requests.total - result["2xx"]) : 0;
    const errPct = result.requests.total > 0 ? (errCount / result.requests.total) * 100 : 0;
    console.log(grade(lat.p99, errPct));
    results.push({ label: t.label, concurrency: t.concurrency, result, errPct });
  }

  // ─── Summary Table ───────────────────────────────────────────────────────
  console.log("\n" + bold(line("═")));
  console.log(bold(cyan("  สรุปผลการทดสอบ")));
  console.log(bold(line("═")));

  const COL = [42, 5, 8, 8, 8, 8, 8, 7, 12];
  const HEADER = ["Endpoint", "Con", "Req/s", "Avg ms", "p50 ms", "p95 ms", "p99 ms", "Err%", "ผล"];

  console.log("  " + HEADER.map((h, i) => bold(lpad(h, COL[i]))).join(" "));
  console.log("  " + line("─"));

  let totalOk = 0, totalFail = 0;

  for (const { label, concurrency, result, errPct } of results) {
    const lat = result.latency;
    const rps = Math.round(result.requests.mean);
    const avg = Math.round(lat.mean);
    const p50 = lat.p50;
    const p95 = lat.p95;
    const p99 = lat.p99;
    const g = grade(p99, errPct);
    const isFail = errPct > 5 || p99 >= 800;
    isFail ? totalFail++ : totalOk++;

    const errStr = errPct > 0 ? red(errPct.toFixed(1) + "%") : green("0%");
    const p99Str = p99 >= 800 ? red(p99) : p99 >= 300 ? yellow(p99) : green(p99);

    console.log("  " + [
      pad(label.slice(0, 41), COL[0]),
      lpad(concurrency, COL[1]),
      lpad(rps, COL[2]),
      lpad(avg, COL[3]),
      lpad(p50, COL[4]),
      lpad(p95, COL[5]),
      p99Str.padStart(COL[6] + 10),
      errStr.padStart(COL[7] + 10),
      g,
    ].join(" "));
  }

  console.log("  " + line("─"));
  console.log(`\n  ผ่าน : ${green(totalOk + " รายการ")}   ไม่ผ่าน : ${totalFail > 0 ? red(totalFail + " รายการ") : green("0 รายการ")}`);

  // ─── Conclusion ──────────────────────────────────────────────────────────
  console.log("\n" + bold(line("─")));
  console.log(bold("  คำแนะนำ:"));
  for (const { label, result, errPct } of results) {
    const p99 = result.latency.p99;
    if (errPct > 5) console.log(red(`  ✗ ${label.trim()} — error rate สูง (${errPct.toFixed(1)}%)`));
    else if (p99 >= 800) console.log(yellow(`  ⚠ ${label.trim()} — latency p99 สูง (${p99}ms) ควรเพิ่ม cache`));
  }
  if (results.every(r => r.errPct <= 5 && r.result.latency.p99 < 800)) {
    console.log(green("  ✓ ระบบผ่านการทดสอบทุก endpoint — พร้อมรองรับผู้ใช้งานจริง"));
  }
  console.log(bold(line("─")) + "\n");
}

main().catch(console.error);
