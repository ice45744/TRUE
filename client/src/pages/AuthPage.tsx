import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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

  const inputClass = "block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 focus:bg-white";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #EEF3FB 0%, #E8EFFA 50%, #DDE9F8 100%)" }}>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-8 w-3 h-3 rounded-full bg-blue-300/30 animate-float" />
        <div className="absolute top-24 right-12 w-2 h-2 rounded-full bg-indigo-400/20 animate-float stagger-2" />
        <div className="absolute top-40 left-20 w-4 h-4 rounded-full bg-blue-200/25 animate-float stagger-4" />
        <div className="absolute bottom-40 right-16 w-3 h-3 rounded-full bg-purple-300/20 animate-float stagger-3" />
        <div className="absolute bottom-24 left-10 w-2 h-2 rounded-full bg-blue-400/15 animate-float stagger-5" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">S.T.ก้าวหน้า</h1>
          <p className="text-sm text-gray-500 mt-1">ระบบดิจิทัล สภานักเรียน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up stagger-2" style={{ boxShadow: "0 4px 32px rgba(37,99,235,0.10)" }}>
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 relative">
            <div className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm tab-indicator"
              style={{ width: "calc(50% - 4px)", left: tab === "login" ? "4px" : "calc(50%)" }} />
            <button
              data-testid="tab-login"
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 ${
                tab === "login" ? "text-gray-800" : "text-gray-500"
              }`}>
              เข้าสู่ระบบ
            </button>
            <button
              data-testid="tab-register"
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 ${
                tab === "register" ? "text-gray-800" : "text-gray-500"
              }`}>
              ลงทะเบียนใหม่
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={onLogin} className="space-y-4 animate-fade-in">
              <div className="animate-fade-in-up stagger-1">
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
              <div className="animate-fade-in-up stagger-2">
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
              <div className="animate-fade-in-up stagger-3">
                <Button
                  data-testid="button-login"
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl mt-2 h-12 text-base font-semibold relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }}
                  disabled={loginLoading}>
                  {loginLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : "เข้าสู่ระบบ"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-4 animate-fade-in">
              <div className="animate-fade-in-up stagger-1">
                <label className="block text-sm text-gray-700 font-medium mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  data-testid="input-name"
                  type="text"
                  placeholder="ด.ช. ก้าวหน้า เรียนดี"
                  className={inputClass}
                  autoComplete="name"
                  value={regName}
                  onChange={e => setRegName(e.target.value)} />
                {regErrors.name && <p className="text-xs text-red-500 mt-1 animate-slide-down">{regErrors.name}</p>}
              </div>
              <div className="animate-fade-in-up stagger-2">
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสนักเรียน</label>
                <input
                  data-testid="input-reg-studentId"
                  type="text"
                  placeholder="12345"
                  className={inputClass}
                  autoComplete="username"
                  value={regStudentId}
                  onChange={e => setRegStudentId(e.target.value)} />
                {regErrors.studentId && <p className="text-xs text-red-500 mt-1 animate-slide-down">{regErrors.studentId}</p>}
              </div>
              <div className="animate-fade-in-up stagger-3">
                <label className="block text-sm text-gray-700 font-medium mb-1.5">รหัสผ่าน</label>
                <input
                  data-testid="input-reg-password"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)} />
                {regErrors.password && <p className="text-xs text-red-500 mt-1 animate-slide-down">{regErrors.password}</p>}
              </div>
              <div className="animate-fade-in-up stagger-4">
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
              <div className="animate-fade-in-up stagger-5">
                <Button
                  data-testid="button-register"
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl mt-2 h-12 text-base font-semibold bg-gray-900"
                  disabled={regLoading}>
                  {regLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังลงทะเบียน...
                    </span>
                  ) : "ลงทะเบียนเข้าใช้งาน"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in stagger-4">S.T. Digital System v1.0.0<br />พัฒนาโดยสภานักเรียนโรงเรียน</p>
      </div>
    </div>
  );
}
