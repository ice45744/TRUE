import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginStudentId, setLoginStudentId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSchoolCode, setRegSchoolCode] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setLocation("/");
  }, [user]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStudentId || !loginPassword) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }
    setLoginLoading(true);
    try {
      await login(loginStudentId, loginPassword);
    } catch (err: any) {
      toast({ title: "เข้าสู่ระบบไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (regName.length < 2) errors.name = "กรุณากรอกชื่อ-นามสกุล";
    if (regStudentId.length < 4) errors.studentId = "กรุณากรอกรหัสนักเรียน (อย่างน้อย 4 ตัว)";
    if (regPassword.length < 4) errors.password = "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegLoading(true);
    try {
      await register({ name: regName, studentId: regStudentId, password: regPassword, schoolCode: regSchoolCode || undefined });
    } catch (err: any) {
      toast({ title: "ลงทะเบียนไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setRegLoading(false);
    }
  };

  const inputClass = "block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #EEF3FB 0%, #E8EFFA 50%, #DDE9F8 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}>
            <TrendingUp size={38} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">S.T.ก้าวหน้า</h1>
          <p className="text-sm text-gray-500 mt-1">ระบบดิจิทัล สภานักเรียน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6" style={{ boxShadow: "0 4px 32px rgba(37,99,235,0.10)" }}>
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              data-testid="tab-login"
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "login" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
              }`}>
              เข้าสู่ระบบ
            </button>
            <button
              data-testid="tab-register"
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "register" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
              }`}>
              ลงทะเบียนใหม่
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสนักเรียน</label>
                <input
                  data-testid="input-studentId"
                  type="text"
                  placeholder="เช่น 12345"
                  className={inputClass}
                  autoComplete="username"
                  value={loginStudentId}
                  onChange={e => setLoginStudentId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสผ่าน</label>
                <input
                  data-testid="input-password"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)} />
              </div>
              <Button
                data-testid="button-login"
                type="submit"
                size="lg"
                className="w-full rounded-xl mt-2 h-12 text-base font-semibold"
                style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }}
                disabled={loginLoading}>
                {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  data-testid="input-name"
                  type="text"
                  placeholder="ด.ช. ก้าวหน้า เรียนดี"
                  className={inputClass}
                  autoComplete="name"
                  value={regName}
                  onChange={e => setRegName(e.target.value)} />
                {regErrors.name && <p className="text-xs text-red-500 mt-1">{regErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสนักเรียน</label>
                <input
                  data-testid="input-reg-studentId"
                  type="text"
                  placeholder="12345"
                  className={inputClass}
                  autoComplete="username"
                  value={regStudentId}
                  onChange={e => setRegStudentId(e.target.value)} />
                {regErrors.studentId && <p className="text-xs text-red-500 mt-1">{regErrors.studentId}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสผ่าน</label>
                <input
                  data-testid="input-reg-password"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)} />
                {regErrors.password && <p className="text-xs text-red-500 mt-1">{regErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสสำหรับสภานักเรียน (ถ้ามี)</label>
                <input
                  data-testid="input-schoolCode"
                  type="text"
                  placeholder="เว้นว่างได้"
                  className={inputClass}
                  autoComplete="off"
                  value={regSchoolCode}
                  onChange={e => setRegSchoolCode(e.target.value)} />
              </div>
              <Button
                data-testid="button-register"
                type="submit"
                size="lg"
                className="w-full rounded-xl mt-2 h-12 text-base font-semibold bg-gray-900"
                disabled={regLoading}>
                {regLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียนเข้าใช้งาน"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">S.T. Digital System v1.0.0<br />พัฒนาโดยสภานักเรียนโรงเรียน</p>
      </div>
    </div>
  );
}
