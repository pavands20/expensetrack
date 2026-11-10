/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { apiFetch, clearSessionToken, getSessionToken, setUnauthorizedHandler } from "@/lib/api";

export type Role = "Employee" | "Manager" | "Finance";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  manager_id: number | null;
  manager_name: string | null;
  is_active: boolean;
};

type AuthValue = {
  user: User | null;
  role: Role | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthValue>({
  user: null,
  role: null,
  setUser: () => {},
  signOut: async () => {},
});

export function useAuth(): AuthValue {
  return React.useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      navigate("/sign-in", { replace: true, state: { expired: true } });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  React.useEffect(() => {
    if (!getSessionToken() || user || failed) return;
    apiFetch<User>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        clearSessionToken();
        setFailed(true);
      });
  }, [user, failed]);

  const signOut = React.useCallback(async () => {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" });
    } catch {
      // Sign out locally even if the server call fails.
    }
    clearSessionToken();
    setUser(null);
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  const value = React.useMemo(
    () => ({ user, role: user?.role ?? null, setUser, signOut }),
    [user, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!getSessionToken()) return <Navigate to="/sign-in" replace />;
  if (user) return <>{children}</>;
  return <p role="status">Loading…</p>;
}
