import * as React from "react";

import { SESSION_EXPIRED_EVENT, apiFetch, clearSessionToken, getSessionToken } from "@/lib/api";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "employee" | "manager" | "finance";
  manager_id: number | null;
  is_active: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  expired: boolean;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(() => getSessionToken() !== null);
  const [expired, setExpired] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    if (getSessionToken()) {
      apiFetch<User>("/api/auth/me")
        .then((u) => live && setUserState(u))
        .catch(() => {
          if (live) clearSessionToken();
        })
        .finally(() => live && setLoading(false));
    }
    const onExpired = () => {
      setUserState(null);
      setExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      live = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      loading,
      expired,
      setUser: (u) => {
        setExpired(false);
        setUserState(u);
      },
      signOut: async () => {
        try {
          await apiFetch<void>("/api/auth/logout", { method: "POST" });
        } catch {
          // The token is dropped locally either way.
        }
        clearSessionToken();
        setExpired(false);
        setUserState(null);
      },
    }),
    [user, loading, expired],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
