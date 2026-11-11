import * as React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { apiFetch, getSessionToken } from "@/lib/api";

export type CurrentUser = { id: number; name: string; email: string; role: string };

const UserContext = React.createContext<CurrentUser | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): CurrentUser | null {
  return React.useContext(UserContext);
}

// Guards the app shell routes: needs a token, and GET /api/auth/me must succeed.
export function RequireAuth() {
  const hasToken = Boolean(getSessionToken());
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!hasToken) return;
    let live = true;
    apiFetch<CurrentUser>("/api/auth/me")
      .then((u) => live && setUser({ id: u.id, name: u.name, email: u.email, role: u.role }))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [hasToken]);

  if (failed) return <Navigate to="/sign-in" replace state={{ expired: true }} />;
  if (!hasToken) return <Navigate to="/sign-in" replace />;
  if (!user) return <p role="status">Loading…</p>;
  return (
    <UserContext.Provider value={user}>
      <Outlet />
    </UserContext.Provider>
  );
}
