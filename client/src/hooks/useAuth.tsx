import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface AuthUser {
  id: string;
  studentId: string;
  name: string;
  schoolCode: string | null;
  role: string;
  merits: number;
  trashPoints: number;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as AuthUser;
            setUser(userData);
            localStorage.setItem("st_kaona_user", JSON.stringify(userData));
          } else {
            setUser(null);
            localStorage.removeItem("st_kaona_user");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
          localStorage.removeItem("st_kaona_user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("st_kaona_user");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (studentId: string, password: string) => {
    // Firebase uses email, so we've mapped studentId to a pseudo-email
    const email = `${studentId}@school.com`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as AuthUser;
      setUser(userData);
      localStorage.setItem("st_kaona_user", JSON.stringify(userData));
      
      // Sync with backend
      try {
        await apiRequest("POST", "/api/auth/sync");
      } catch (e) {
        console.warn("Backend sync failed (non-critical):", e);
      }
    }
  };

  const register = async (formData: { studentId: string; name: string; password: string; schoolCode?: string }) => {
    const email = `${formData.studentId}@school.com`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
    
    const ADMIN_CODE = "สภานักเรียนปี2569/1_2";
    const isAdmin = formData.schoolCode === ADMIN_CODE;
    
    const newUser: AuthUser = {
      id: userCredential.user.uid,
      studentId: formData.studentId,
      name: formData.name,
      schoolCode: formData.schoolCode ?? null,
      role: isAdmin ? "admin" : "student",
      merits: 0,
      trashPoints: 0,
      stamps: 0,
    };

    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    await updateProfile(userCredential.user, { displayName: formData.name });
    setUser(newUser);
    localStorage.setItem("st_kaona_user", JSON.stringify(newUser));
    
    // Sync with backend
    try {
      await apiRequest("POST", "/api/auth/sync");
    } catch (e) {
      console.warn("Backend sync failed (non-critical):", e);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = async (updated: AuthUser) => {
    if (user) {
      await updateDoc(doc(db, "users", user.id), { ...updated });
      setUser(updated);
    }
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
