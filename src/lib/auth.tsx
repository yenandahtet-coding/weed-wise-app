import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export type User = { 
  id: string; 
  name: string; 
  email: string;
  preferredLanguage?: string;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: data.fullName || "User",
              preferredLanguage: data.preferredLanguage || "en",
            });
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: "User",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: "User",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    
    await setDoc(doc(db, "users", fbUser.uid), {
      fullName: name,
      email: email,
      preferredLanguage: "en",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
};
