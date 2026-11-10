import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import { SESSION_EXPIRED_EVENT, apiFetch, clearSessionToken, getSessionToken } from "@/lib/api";
import { Icons } from "@/lib/icons";
import SignIn from "@/screens/SignIn";
import Dashboard from "@/screens/Dashboard";
import Claim from "@/screens/Claim";
import Help from "@/screens/Help";
import Users, { type User } from "@/screens/Users";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-[var(--brand-radius)] px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-[var(--brand-hover)] text-[var(--brand-fg)]" : "text-[var(--brand-fg-muted)]",
  ].join(" ");

const fetchMe = () => apiFetch<User>("/api/auth/me");

// The app's menu, drawn around every screen except the ones routed outside it below.
function AppShellLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasToken = Boolean(getSessionToken());
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe, enabled: hasToken });

  useEffect(() => {
    const onExpired = () => {
      qc.clear();
      navigate("/sign-in", { replace: true });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [qc, navigate]);

  async function signOut() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Sign out regardless of the outcome.
    }
    clearSessionToken();
    qc.clear();
    navigate("/sign-in", { replace: true });
  }

  if (!hasToken || me.isError) return <Navigate to="/sign-in" replace />;
  if (!me.data) {
    return (
      <p role="status" className="p-6">
        Loading…
      </p>
    );
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
            {me.data.role === "finance" && (
              <NavLink to="/admin/users" className={navLinkClass}>
                <Icons.Users size={16} />
                {"Users"}
              </NavLink>
            )}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="ml-auto text-sm font-medium text-[var(--brand-fg-muted)]"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function FinanceOnly() {
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  if (!me.data) return null;
  return me.data.role === "finance" ? <Users /> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="/help" element={<Help />} />
        <Route path="/admin/users" element={<FinanceOnly />} />
      </Route>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  );
}

export default function App() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
