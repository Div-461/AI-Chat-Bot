import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import type { GoogleUser } from "../types/auth";

interface AuthContextValue {
  user:              GoogleUser | null;
  login:             (credentialResponse: { credential?: string }) => void;
  loginWithGoogle:   (user: GoogleUser) => void;
  logout:            () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      const stored = sessionStorage.getItem("google_user");
      if (!stored) return null;

      const parsed = JSON.parse(stored) as GoogleUser;
      const isExpired = parsed.exp ? parsed.exp * 1000 <= Date.now() : false;

      if (isExpired) {
        sessionStorage.removeItem("google_user");
        return null;
      }

      return parsed;
    } catch {
      sessionStorage.removeItem("google_user");
      return null;
    }
  });

  const login = useCallback(
    (credentialResponse: { credential?: string }) => {
      if (!credentialResponse.credential) return;

      const decoded = jwtDecode<GoogleUser>(credentialResponse.credential);
      setUser(decoded);
      sessionStorage.setItem("google_user", JSON.stringify(decoded));
    },
    []
  );

  const loginWithGoogle = useCallback((nextUser: GoogleUser) => {
    setUser(nextUser);
    sessionStorage.setItem("google_user", JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    sessionStorage.removeItem("google_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
