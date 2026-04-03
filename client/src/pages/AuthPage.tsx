import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { GraduationCap, Eye, EyeOff, User, Lock, IdCard, ShieldCheck, Sparkles } from "lucide-react";

function FloatingParticles() {
  const particles = [
    { size: 6, x: "8%", y: "12%", delay: 0, dur: 5, color: "rgba(79,142,247,0.25)" },
    { size: 4, x: "85%", y: "8%", delay: 1.2, dur: 4, color: "rgba(124,58,237,0.20)" },
    { size: 8, x: "15%", y: "45%", delay: 0.6, dur: 6, color: "rgba(79,142,247,0.15)" },
    { size: 5, x: "90%", y: "35%", delay: 2, dur: 4.5, color: "rgba(168,85,247,0.18)" },
    { size: 3, x: "50%", y: "5%", delay: 0.8, dur: 3.5, color: "rgba(79,142,247,0.22)" },
    { size: 7, x: "75%", y: "65%", delay: 1.5, dur: 5.5, color: "rgba(59,130,246,0.12)" },
    { size: 4, x: "25%", y: "80%", delay: 0.3, dur: 4, color: "rgba(124,58,237,0.15)" },
    { size: 5, x: "60%", y: "88%", delay: 2.5, dur: 5, color: "rgba(79,142,247,0.18)" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            width: p.size, height: p.size,
            left: p.x, top: p.y,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function MorphBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute animate-morph"
        style={{
          width: 280, height: 280,
          top: "-8%", right: "-12%",
          background: "linear-gradient(135deg, rgba(79,142,247,0.18), rgba(124,58,237,0.12))",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute animate-morph"
        style={{
          width: 200, height: 200,
          bottom: "5%", left: "-8%",
          background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.15))",
          filter: "blur(50px)",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute animate-morph"
        style={{
          width: 120, height: 120,
          top: "40%", left: "60%",
          background: "linear-gradient(135deg, rgba(79,142,247,0.10), rgba(236,72,153,0.08))",
          filter: "blur(35px)",
          animationDelay: "2s",
        }}
      />
    </div>
  );
}

function AnimatedLogo() {
  return (
    <div className="relative flex flex-col items-center animate-bounce-in">
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse-glow"
          style={{
            background: "linear-gradient(135deg, #4F8EF7 0%, #7C3AED 50%, #EC4899 100%)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 4s ease infinite, pulse-glow 2.5s ease-in-out infinite",
          }}
        >
          <GraduationCap className="w-10 h-10 text-white drop-shadow-lg" />
        </div>
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-pop-in stagger-3"
          style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-14 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(79,142,247,0.25), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      </div>
      <h1
        className="mt-4 text-3xl font-extrabold tracking-tight animate-fade-in-up stagger-2"
        style={{
          background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #7C3AED 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 6s ease infinite",
        }}
      >
        S.T.ก้าวหน้า
      </h1>
      <p className="text-sm text-gray-500 mt-1 animate-fade-in-up stagger-3 font-medium">
        ระบบดิจิทัล สภานักเรียน
      </p>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginStudentId, setLoginStudentId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regName, setRegName] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSchoolCode, setRegSchoolCode] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formShake, setFormShake] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user]);

  const triggerShake = () => {
    setFormShake(true);
    setTimeout(() => setFormShake(false), 500);
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStudentId || !loginPassword) {
      triggerShake();
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }
    setLoginLoading(true);
    try {
      setSuccessPulse(true);
      await login(loginStudentId, loginPassword);
    } catch (err: any) {
      setSuccessPulse(false);
      triggerShake();
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
    if (Object.keys(errors).length > 0) {
      triggerShake();
      return;
    }
    setRegLoading(true);
    try {
      setSuccessPulse(true);
      await register({ name: regName, studentId: regStudentId, password: regPassword, schoolCode: regSchoolCode || undefined });
    } catch (err: any) {
      setSuccessPulse(false);
      triggerShake();
      toast({ title: "ลงทะเบียนไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setRegLoading(false);
    }
  };

  const renderInput = (
    id: string,
    label: string,
    icon: React.ReactNode,
    type: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: string,
    error?: string,
    showPwd?: boolean,
    togglePwd?: () => void,
    testId?: string,
  ) => {
    const inputId = `auth-${id}`;
    return (
      <div className="auth-input-wrapper">
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
        <div
          className={`relative flex items-center rounded-xl border-2 transition-colors duration-200 ${
            focusedField === id
              ? "border-blue-400 bg-white shadow-[0_0_0_3px_rgba(79,142,247,0.1)]"
              : "border-gray-200 bg-gray-50/80"
          }`}
        >
          <span className={`pl-3.5 transition-colors duration-200 ${focusedField === id ? "text-blue-500" : "text-gray-400"}`} aria-hidden="true">
            {icon}
          </span>
          <input
            id={inputId}
            data-testid={testId}
            type={togglePwd ? (showPwd ? "text" : "password") : type}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-3 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
            autoComplete={autoComplete}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocusedField(id)}
            onBlur={() => setFocusedField(null)}
          />
          {togglePwd && (
            <button
              type="button"
              className="pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={togglePwd}
              aria-label={showPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              aria-pressed={showPwd}
            >
              {showPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5 animate-slide-down flex items-center gap-1" role="alert">{error}</p>}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #F0F4FF 0%, #E8EEFF 30%, #F5F0FF 60%, #EEF3FB 100%)",
      }}
    >
      <MorphBlobs />
      <FloatingParticles />

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-7">
          <AnimatedLogo />
        </div>

        <div
          className={`relative rounded-3xl p-6 animate-fade-in-up stagger-3 ${formShake ? "animate-shake" : ""}`}
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: successPulse
              ? "0 8px 40px rgba(79,142,247,0.25), 0 0 0 2px rgba(79,142,247,0.15)"
              : "0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid rgba(255,255,255,0.6)",
            transition: "box-shadow 0.4s ease",
          }}
        >
          <div className="flex bg-gray-100/80 rounded-2xl p-1 mb-6 relative" style={{ backdropFilter: "blur(8px)" }}>
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm tab-indicator"
              style={{
                width: "calc(50% - 4px)",
                left: tab === "login" ? "4px" : "calc(50%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            />
            <button
              data-testid="tab-login"
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 relative z-10 ${
                tab === "login" ? "text-gray-800" : "text-gray-400"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              data-testid="tab-register"
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 relative z-10 ${
                tab === "register" ? "text-gray-800" : "text-gray-400"
              }`}
            >
              ลงทะเบียนใหม่
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={onLogin} className="space-y-4 animate-fade-in" key="login-form">
              <div className="animate-fade-in-up stagger-1">
                {renderInput(
                  "login-id", "รหัสนักเรียน",
                  <IdCard className="w-4.5 h-4.5" />,
                  "text", "เช่น 12345",
                  loginStudentId, setLoginStudentId, "username",
                  undefined, undefined, undefined, "input-studentId"
                )}
              </div>
              <div className="animate-fade-in-up stagger-2">
                {renderInput(
                  "login-pwd", "รหัสผ่าน",
                  <Lock className="w-4.5 h-4.5" />,
                  "password", "กรอกรหัสผ่าน",
                  loginPassword, setLoginPassword, "current-password",
                  undefined, showLoginPwd, () => setShowLoginPwd(!showLoginPwd), "input-password"
                )}
              </div>
              <div className="animate-fade-in-up stagger-3 pt-1">
                <Button
                  data-testid="button-login"
                  type="submit"
                  size="lg"
                  className="w-full rounded-2xl h-13 text-base font-bold relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #4F8EF7 0%, #6366F1 50%, #7C3AED 100%)",
                    backgroundSize: "200% 200%",
                    animation: loginLoading ? "gradient-shift 2s ease infinite" : "none",
                  }}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      เข้าสู่ระบบ
                    </span>
                  )}
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                    }}
                  />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-3.5 animate-fade-in" key="register-form">
              <div className="animate-fade-in-up stagger-1">
                {renderInput(
                  "reg-name", "ชื่อ-นามสกุล",
                  <User className="w-4.5 h-4.5" />,
                  "text", "ด.ช. ก้าวหน้า เรียนดี",
                  regName, setRegName, "name",
                  regErrors.name, undefined, undefined, "input-name"
                )}
              </div>
              <div className="animate-fade-in-up stagger-2">
                {renderInput(
                  "reg-id", "รหัสนักเรียน",
                  <IdCard className="w-4.5 h-4.5" />,
                  "text", "12345",
                  regStudentId, setRegStudentId, "username",
                  regErrors.studentId, undefined, undefined, "input-reg-studentId"
                )}
              </div>
              <div className="animate-fade-in-up stagger-3">
                {renderInput(
                  "reg-pwd", "รหัสผ่าน",
                  <Lock className="w-4.5 h-4.5" />,
                  "password", "อย่างน้อย 4 ตัวอักษร",
                  regPassword, setRegPassword, "new-password",
                  regErrors.password, showRegPwd, () => setShowRegPwd(!showRegPwd), "input-reg-password"
                )}
              </div>
              <div className="animate-fade-in-up stagger-4">
                {renderInput(
                  "reg-code", "รหัสสำหรับสภานักเรียน (ถ้ามี)",
                  <ShieldCheck className="w-4.5 h-4.5" />,
                  "text", "เว้นว่างได้",
                  regSchoolCode, setRegSchoolCode, "off",
                  undefined, undefined, undefined, "input-schoolCode"
                )}
              </div>
              <div className="animate-fade-in-up stagger-5 pt-1">
                <Button
                  data-testid="button-register"
                  type="submit"
                  size="lg"
                  className="w-full rounded-2xl h-13 text-base font-bold relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #1E293B 100%)",
                    backgroundSize: "200% 200%",
                    animation: regLoading ? "gradient-shift 2s ease infinite" : "none",
                  }}
                  disabled={regLoading}
                >
                  {regLoading ? (
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังลงทะเบียน...
                    </span>
                  ) : "ลงทะเบียนเข้าใช้งาน"}
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)",
                    }}
                  />
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in stagger-5 font-medium">
          S.T. Digital System v1.0.0<br />
          <span className="text-gray-300">พัฒนาโดยสภานักเรียนโรงเรียน</span>
        </p>
      </div>
    </div>
  );
}
