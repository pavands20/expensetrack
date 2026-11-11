import React from "react";
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import { apiFetch, clearSessionToken, setUnauthorizedHandler } from "@/lib/api";
import { RequireAuth } from "@/lib/auth";
import { Icons } from "@/lib/icons";
import ResetPassword from "@/screens/ResetPassword";
import SignIn from "@/screens/SignIn";
import Dashboard from "@/screens/Dashboard";
import Claim from "@/screens/Claim";
import Help from "@/screens/Help";
import Users from "@/screens/Users";
import { useCurrentUser } from "@/lib/auth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-[var(--brand-radius)] px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-[var(--brand-hover)] text-[var(--brand-fg)]" : "text-[var(--brand-fg-muted)]",
  ].join(" ");

// The app's menu, drawn around every screen except the ones routed outside it below.
function AppShellLayout() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  async function signOut() {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" });
    } catch {
      // Still clear the token locally if the server call fails.
    }
    clearSessionToken();
    navigate("/sign-in", { replace: true });
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--brand-surface)",
          borderColor: "var(--brand-border)",
        }}
      >
        <div className="flex items-center gap-6 px-6 py-2">
          <p
            className="shrink-0 text-sm font-semibold"
            style={{ fontFamily: "var(--brand-font-heading)" }}
          >
            {"ExpenseTrack"}
          </p>
          <nav aria-label="App menu" className="flex flex-wrap items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <Icons.Home size={16} />
              {"My claims"}
            </NavLink>
            <NavLink to="/help" className={navLinkClass}>
              <Icons.Menu size={16} />
              {"User guide"}
            </NavLink>
            {currentUser?.role === "Finance" && (
              <NavLink to="/admin/users" className={navLinkClass}>
                <Icons.Users size={16} />
                {"Users"}
              </NavLink>
            )}
          </nav>
          <button
            type="button"
            data-testid="sign-out"
            onClick={signOut}
            className="ml-auto text-sm font-medium"
          >
            {"Sign out"}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setUnauthorizedHandler(() => navigate("/sign-in", { replace: true, state: { expired: true } }));
    return () => setUnauthorizedHandler(null);
  }, [navigate]);
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/claim" element={<Claim />} />
          <Route path="/help" element={<Help />} />
          <Route path="/admin/users" element={<Users />} />
        </Route>
      </Route>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  );
}
