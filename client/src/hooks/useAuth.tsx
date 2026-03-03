import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  studentId: string;
  name: string;
  schoolCode: string | null;
  role: string;
  merits: number;
  stamps: number;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (studentId: string, password: string) => Promise<void>;
  register: (data: { studentId: string; name: string; password: string; schoolCode?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "st_kaona_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (studentId: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { studentId, password });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  };

  const register = async (formData: { studentId: string; name: string; password: string; schoolCode?: string }) => {
    const res = await apiRequest("POST", "/api/auth/register", formData);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "ลงทะเบียนไม่สำเร็จ");
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (updated: AuthUser) => {
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
