import React from "react";
import { Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { Badge, Button, Card, Input, Label, Select, Table, TBody, TD, TH, THead, TR } from "@/lib/ui";

type Role = "Employee" | "Manager" | "Finance";
type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  manager_id: number | null;
  is_active: boolean;
};

const ROLES: Role[] = ["Employee", "Manager", "Finance"];
const msg = (e: unknown) => (e instanceof ApiError ? e.detail : "Something went wrong");

function ManagerSelect(props: {
  users: AdminUser[];
  excludeId?: number;
  value: string;
  onChange: (v: string) => void;
  testid: string;
}) {
  return (
    <Select
      data-testid={props.testid}
      aria-label="Manager"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      <option value="">No manager</option>
      {props.users
        .filter((u) => u.is_active && u.id !== props.excludeId)
        .map((u) => (
          <option key={u.id} value={String(u.id)}>
            {u.name}
          </option>
        ))}
    </Select>
  );
}

function CreateForm({ users, onDone }: { users: AdminUser[]; onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("Employee");
  const [manager, setManager] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [error, setError] = React.useState("");
  const create = useMutation({
    mutationFn: () =>
      apiFetch<AdminUser>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          role,
          manager_id: manager ? Number(manager) : null,
          ...(password ? { initial_password: password } : {}),
        }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      setManager("");
      setRole("Employee");
      onDone();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) setEmailError(e.detail);
      else setError(msg(e));
    },
  });
  return (
    <Card className="p-5">
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setEmailError("");
          setError("");
          create.mutate();
        }}
      >
        <h2 className="font-semibold">Create user</h2>
        <Label htmlFor="new-name">Name</Label>
        <Input id="new-name" data-testid="new-name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Label htmlFor="new-email">Email</Label>
        <Input
          id="new-email"
          data-testid="new-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && (
          <p role="alert" data-testid="email-error" className="text-sm text-red-600">
            {emailError}
          </p>
        )}
        <Label htmlFor="new-role">Role</Label>
        <Select
          id="new-role"
          data-testid="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={ROLES.map((r) => ({ value: r, label: r }))}
        />
        <Label>Manager (optional)</Label>
        <ManagerSelect users={users} value={manager} onChange={setManager} testid="new-manager" />
        <Label htmlFor="new-password">Initial password (optional)</Label>
        <Input
          id="new-password"
          data-testid="new-password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-sm text-slate-500">
          Leave the password empty and we email the user a reset link.
        </p>
        {error && (
          <p role="alert" data-testid="create-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" data-testid="create-submit" disabled={create.isPending}>
          Create user
        </Button>
      </form>
    </Card>
  );
}

function EditForm({
  target,
  users,
  onDone,
}: {
  target: AdminUser;
  users: AdminUser[];
  onDone: () => void;
}) {
  const [name, setName] = React.useState(target.name);
  const [role, setRole] = React.useState<Role>(target.role);
  const [manager, setManager] = React.useState(target.manager_id ? String(target.manager_id) : "");
  const [error, setError] = React.useState("");
  const save = useMutation({
    mutationFn: () =>
      apiFetch<AdminUser>(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, role, manager_id: manager ? Number(manager) : null }),
      }),
    onSuccess: onDone,
    onError: (e) => setError(msg(e)),
  });
  return (
    <Card className="p-5">
      <form
        className="grid gap-3"
        data-testid="edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          save.mutate();
        }}
      >
        <h2 className="font-semibold">Edit {target.name}</h2>
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" data-testid="edit-name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Label htmlFor="edit-role">Role</Label>
        <Select
          id="edit-role"
          data-testid="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={ROLES.map((r) => ({ value: r, label: r }))}
        />
        <Label>Manager</Label>
        <ManagerSelect
          users={users}
          excludeId={target.id}
          value={manager}
          onChange={setManager}
          testid="edit-manager"
        />
        <p className="text-sm text-slate-500">Pending claims follow the current manager.</p>
        {error && (
          <p role="alert" data-testid="edit-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" data-testid="save" disabled={save.isPending}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function UsersAdmin() {
  const me = useCurrentUser();
  const [editing, setEditing] = React.useState<AdminUser | null>(null);
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [rowError, setRowError] = React.useState("");
  const list = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<AdminUser[]>("/api/users"),
    enabled: me?.role === "Finance",
    retry: false,
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => apiFetch<AdminUser>(`/api/users/${id}/deactivate`, { method: "POST" }),
    onSuccess: () => {
      setConfirmId(null);
      return list.refetch();
    },
    onError: (e) => {
      setConfirmId(null);
      setRowError(msg(e));
    },
  });

  if (me?.role !== "Finance") return <Navigate to="/dashboard" replace />;
  if (list.error instanceof ApiError && list.error.status === 403)
    return (
      <p role="alert" data-testid="access-denied" className="p-6">
        Access denied
      </p>
    );
  const users = list.data ?? [];
  const nameOf = (id: number | null) => users.find((u) => u.id === id)?.name ?? "";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6">
      <h1 className="text-2xl font-bold">Users</h1>
      {list.isLoading && <p role="status">Loading…</p>}
      {list.isError && !list.isLoading && <p role="alert">{msg(list.error)}</p>}
      {rowError && (
        <p role="alert" data-testid="row-error" className="text-sm text-red-600">
          {rowError}
        </p>
      )}
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Manager</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id} data-testid={`user-row-${u.id}`}>
              <TD>{u.name}</TD>
              <TD>{u.email}</TD>
              <TD>{u.role}</TD>
              <TD>{nameOf(u.manager_id)}</TD>
              <TD>
                <Badge variant={u.is_active ? "success" : "default"}>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
              </TD>
              <TD>
                {u.is_active &&
                  (confirmId === u.id ? (
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid={`confirm-deactivate-${u.id}`}
                        disabled={deactivate.isPending}
                        onClick={() => {
                          setRowError("");
                          deactivate.mutate(u.id);
                        }}
                      >
                        Confirm
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmId(null)}>
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        data-testid={`edit-${u.id}`}
                        onClick={() => setEditing(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid={`deactivate-${u.id}`}
                        disabled={u.id === me.id}
                        onClick={() => setConfirmId(u.id)}
                      >
                        Deactivate
                      </Button>
                    </span>
                  ))}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {editing && (
        <EditForm
          key={editing.id}
          target={editing}
          users={users}
          onDone={() => {
            setEditing(null);
            void list.refetch();
          }}
        />
      )}
      <CreateForm users={users} onDone={() => void list.refetch()} />
    </div>
  );
}

export default function Screen() {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <UsersAdmin />
    </QueryClientProvider>
  );
}
