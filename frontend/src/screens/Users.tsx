import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  Input,
  Label,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/lib/ui";

export type Role = "employee" | "manager" | "finance";
export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  manager_id: number | null;
  is_active: boolean;
};

const ROLES = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "finance", label: "Finance" },
];

function message(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to do that";
    return err.detail || "Something went wrong";
  }
  return "Something went wrong";
}

function ManagerSelect({
  id,
  users,
  value,
  onChange,
  excludeId,
}: {
  id: string;
  users: User[];
  value: string;
  onChange: (v: string) => void;
  excludeId?: number;
}) {
  return (
    <Select id={id} data-testid={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No manager</option>
      {users
        .filter((u) => u.is_active && u.id !== excludeId)
        .map((u) => (
          <option key={u.id} value={String(u.id)}>
            {u.name}
          </option>
        ))}
    </Select>
  );
}

function CreateForm({ users }: { users: User[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [manager, setManager] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const create = useMutation({
    mutationFn: () =>
      apiFetch<User>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          role,
          manager_id: manager ? Number(manager) : null,
          password,
        }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setRole("employee");
      setManager("");
      setPassword("");
      setError("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(message(err)),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create user</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            create.mutate();
          }}
        >
          <div>
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              data-testid="new-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              data-testid="new-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-role">Role</Label>
            <Select
              id="new-role"
              data-testid="new-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              options={ROLES}
            />
          </div>
          <div>
            <Label htmlFor="new-manager">Manager</Label>
            <ManagerSelect id="new-manager" users={users} value={manager} onChange={setManager} />
          </div>
          <div>
            <Label htmlFor="new-password">Initial password</Label>
            <Input
              id="new-password"
              data-testid="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" data-testid="create-user" disabled={create.isPending}>
              Create user
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 md:col-span-2">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function EditRow({ user, users, onDone }: { user: User; users: User[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [manager, setManager] = useState(user.manager_id ? String(user.manager_id) : "");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () =>
      apiFetch<User>(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, role, manager_id: manager ? Number(manager) : null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
    onError: (err) => setError(message(err)),
  });
  return (
    <TR>
      <TD colSpan={6}>
        <form
          aria-label={`Edit form for ${user.name}`}
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            save.mutate();
          }}
        >
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              data-testid="edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <Select
              id="edit-role"
              data-testid="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              options={ROLES}
            />
          </div>
          <div>
            <Label htmlFor="edit-manager">Manager</Label>
            <ManagerSelect
              id="edit-manager"
              users={users}
              value={manager}
              onChange={setManager}
              excludeId={user.id}
            />
          </div>
          <Button type="submit" data-testid="save-user" disabled={save.isPending}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          {error && (
            <p role="alert" className="w-full text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </TD>
    </TR>
  );
}

export default function Screen() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const list = useQuery({ queryKey: ["users"], queryFn: () => apiFetch<User[]>("/api/users") });
  const deactivate = useMutation({
    mutationFn: (id: number) => apiFetch<User>(`/api/users/${id}/deactivate`, { method: "POST" }),
    onSuccess: () => {
      setConfirmId(null);
      setActionError("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      setConfirmId(null);
      setActionError(message(err));
    },
  });
  const users = list.data ?? [];
  const nameOf = (id: number | null) => users.find((u) => u.id === id)?.name ?? "—";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <CreateForm users={users} />
      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}
      {list.isPending ? (
        <p role="status">Loading users…</p>
      ) : list.isError ? (
        <p role="alert">{message(list.error)}</p>
      ) : users.length === 0 ? (
        <Empty title="No users yet" description="Create the first user above." />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table aria-label="Users">
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
                {users.flatMap((u) => {
                  const row = (
                    <TR key={u.id}>
                      <TD>{u.name}</TD>
                      <TD>{u.email}</TD>
                      <TD className="capitalize">{u.role}</TD>
                      <TD>{nameOf(u.manager_id)}</TD>
                      <TD>
                        <Badge variant={u.is_active ? "success" : "default"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            aria-label={`Edit ${u.name}`}
                            onClick={() => setEditingId(u.id)}
                          >
                            Edit
                          </Button>
                          {u.is_active &&
                            (confirmId === u.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  aria-label={`Confirm deactivate ${u.name}`}
                                  onClick={() => deactivate.mutate(u.id)}
                                >
                                  Confirm deactivate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setConfirmId(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="danger"
                                aria-label={`Deactivate ${u.name}`}
                                onClick={() => setConfirmId(u.id)}
                              >
                                Deactivate
                              </Button>
                            ))}
                        </div>
                      </TD>
                    </TR>
                  );
                  return editingId === u.id
                    ? [
                        row,
                        <EditRow
                          key={`e${u.id}`}
                          user={u}
                          users={users}
                          onDone={() => setEditingId(null)}
                        />,
                      ]
                    : [row];
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
