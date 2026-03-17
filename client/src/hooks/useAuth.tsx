import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  studentId: string;
  name: string;
  schoolCode: string | null;
  role: string;
  merits: number;
  trashPoints: number;
  stamps: number;
  avatarUrl?: string | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app startup
    const saved = localStorage.getItem("st_kaona_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setUser(user);
      } catch (e) {
        localStorage.removeItem("st_kaona_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (studentId: string, password: string) => {
    // Use backend authentication
    const res = await apiRequest("POST", "/api/auth/login", {
      studentId,
      password,
    });
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem("st_kaona_user", JSON.stringify(data.user));
  };

  const register = async (formData: { studentId: string; name: string; password: string; schoolCode?: string }) => {
    // Use backend registration
    const res = await apiRequest("POST", "/api/auth/register", {
      studentId: formData.studentId,
      name: formData.name,
      password: formData.password,
      schoolCode: formData.schoolCode,
    });
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem("st_kaona_user", JSON.stringify(data.user));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("st_kaona_user");
  };

  const updateUser = (updated: AuthUser) => {
    setUser(updated);
    localStorage.setItem("st_kaona_user", JSON.stringify(updated));
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
