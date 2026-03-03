import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hash, Lock, User, Shield, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  studentId: z.string().min(1, "กรุณากรอกรหัสนักเรียน"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

const registerSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  studentId: z.string().min(4, "กรุณากรอกรหัสนักเรียน"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
  schoolCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { studentId: "", password: "" } });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", studentId: "", password: "", schoolCode: "" } });
  useEffect(() => {
    if (user) setLocation("/");
  }, [user]);

  const onLogin = async (data: LoginForm) => {
    try {
      await login(data.studentId, data.password);
    } catch (err: any) {
      toast({ title: "เข้าสู่ระบบไม่สำเร็จ", description: err.message, variant: "destructive" });
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await register(data);
    } catch (err: any) {
      toast({ title: "ลงทะเบียนไม่สำเร็จ", description: err.message, variant: "destructive" });
    }
  };

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
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "login" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
              }`}>
              เข้าสู่ระบบ
            </button>
            <button
              data-testid="tab-register"
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "register" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
              }`}>
              ลงทะเบียนใหม่
            </button>
          </div>

          {tab === "login" ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">รหัสนักเรียน</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-studentId"
                          placeholder="เช่น 12345"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">รหัสผ่าน</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button
                  data-testid="button-login"
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl mt-2 h-12 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }}
                  disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField control={registerForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">ชื่อ-นามสกุล</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-name"
                          placeholder="ด.ช. ก้าวหน้า เรียนดี"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">รหัสนักเรียน</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-reg-studentId"
                          placeholder="12345"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">รหัสผ่าน</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-reg-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="schoolCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">รหัสสำหรับสภานักเรียน (ถ้ามี)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          data-testid="input-schoolCode"
                          placeholder="เว้นว่างได้"
                          className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11"
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button
                  data-testid="button-register"
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl mt-2 h-12 text-base font-semibold bg-gray-900"
                  disabled={registerForm.formState.isSubmitting}>
                  {registerForm.formState.isSubmitting ? "กำลังลงทะเบียน..." : "ลงทะเบียนเข้าใช้งาน"}
                </Button>
              </form>
            </Form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">S.T. Digital System v1.0.0<br />พัฒนาโดยสภานักเรียนโรงเรียน</p>
      </div>
    </div>
  );
}
