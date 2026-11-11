import React from "react";
import { Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { Badge, Button, Card, Input, Label, Table, TBody, TD, TH, THead, TR } from "@/lib/ui";

type Category = { id: number; name: string; limit_gbp: string | null; is_active: boolean };

const DUPLICATE = "A category with that name already exists";
const LIMIT_ERROR = "Enter an amount in pounds greater than 0 with at most 2 decimals";
const msg = (e: unknown) =>
  e instanceof ApiError ? (e.status === 403 ? "Access denied" : e.detail) : "Something went wrong";
const validLimit = (v: string) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0;
const gbp = (v: string | null) => (v === null ? "No limit" : `£${Number(v).toFixed(2)}`);

function Row({ c, onSaved }: { c: Category; onSaved: () => void }) {
  const [name, setName] = React.useState(c.name);
  const [limit, setLimit] = React.useState(c.limit_gbp ?? "");
  const [nameError, setNameError] = React.useState("");
  const [limitError, setLimitError] = React.useState("");
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Category>(`/api/categories/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (saved) => {
      setName(saved.name);
      setLimit(saved.limit_gbp ?? "");
      onSaved();
    },
  });
  function run(body: Record<string, unknown>, field: "name" | "limit") {
    const setErr = field === "name" ? setNameError : setLimitError;
    setNameError("");
    setLimitError("");
    patch.mutate(body, {
      onError: (e) => setErr(e instanceof ApiError && e.status === 409 ? DUPLICATE : msg(e)),
    });
  }
  return (
    <TR data-testid={`row-${c.id}`}>
      <TD>
        <div className="flex gap-2">
          <Input
            aria-label={`Name of ${c.name}`}
            data-testid={`name-${c.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            data-testid={`save-name-${c.id}`}
            disabled={patch.isPending || !name.trim() || name.trim() === c.name}
            onClick={() => run({ name: name.trim() }, "name")}
          >
            Rename
          </Button>
        </div>
        {nameError && (
          <p role="alert" data-testid={`name-error-${c.id}`} className="text-sm text-red-600">
            {nameError}
          </p>
        )}
      </TD>
      <TD>
        <p data-testid={`limit-text-${c.id}`}>{gbp(c.limit_gbp)}</p>
        <div className="flex gap-2">
          <Input
            aria-label={`Limit in GBP for ${c.name}`}
            data-testid={`limit-${c.id}`}
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            data-testid={`save-limit-${c.id}`}
            disabled={patch.isPending}
            onClick={() => {
              if (!validLimit(limit.trim())) {
                setNameError("");
                setLimitError(LIMIT_ERROR);
                return;
              }
              run({ limit_gbp: limit.trim() }, "limit");
            }}
          >
            Set limit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            data-testid={`clear-limit-${c.id}`}
            disabled={patch.isPending || c.limit_gbp === null}
            onClick={() => run({ limit_gbp: null }, "limit")}
          >
            Clear limit
          </Button>
        </div>
        {limitError && (
          <p role="alert" data-testid={`limit-error-${c.id}`} className="text-sm text-red-600">
            {limitError}
          </p>
        )}
      </TD>
      <TD>
        <Badge variant={c.is_active ? "success" : "default"}>
          {c.is_active ? "Active" : "Retired"}
        </Badge>
      </TD>
      <TD>
        <Button
          size="sm"
          variant={c.is_active ? "danger" : "secondary"}
          data-testid={`toggle-${c.id}`}
          disabled={patch.isPending}
          onClick={() => run({ is_active: !c.is_active }, "limit")}
        >
          {c.is_active ? "Retire" : "Reactivate"}
        </Button>
      </TD>
    </TR>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [limit, setLimit] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [limitError, setLimitError] = React.useState("");
  const create = useMutation({
    mutationFn: () =>
      apiFetch<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), limit_gbp: limit.trim() || null }),
      }),
    onSuccess: () => {
      setName("");
      setLimit("");
      onDone();
    },
    onError: (e) => setNameError(e instanceof ApiError && e.status === 409 ? DUPLICATE : msg(e)),
  });
  return (
    <Card className="p-5">
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setNameError("");
          setLimitError("");
          if (limit.trim() && !validLimit(limit.trim())) {
            setLimitError(LIMIT_ERROR);
            return;
          }
          create.mutate();
        }}
      >
        <h2 className="font-semibold">Add category</h2>
        <Label htmlFor="new-name">Name</Label>
        <Input
          id="new-name"
          data-testid="new-name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {nameError && (
          <p role="alert" data-testid="name-error" className="text-sm text-red-600">
            {nameError}
          </p>
        )}
        <Label htmlFor="new-limit">Per-line limit in GBP (optional)</Label>
        <Input
          id="new-limit"
          data-testid="new-limit"
          inputMode="decimal"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        {limitError && (
          <p role="alert" data-testid="limit-error" className="text-sm text-red-600">
            {limitError}
          </p>
        )}
        <Button type="submit" data-testid="create-submit" disabled={create.isPending}>
          Add category
        </Button>
      </form>
    </Card>
  );
}

function CategoriesAdmin() {
  const me = useCurrentUser();
  const list = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/api/categories?include_retired=true"),
    enabled: me?.role === "Finance",
    retry: false,
  });
  if (me?.role !== "Finance") return <Navigate to="/dashboard" replace />;
  if (list.error instanceof ApiError && list.error.status === 403)
    return (
      <p role="alert" data-testid="access-denied" className="p-6">
        Access denied
      </p>
    );
  const refetch = () => void list.refetch();
  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      {list.isLoading && <p role="status">Loading…</p>}
      {list.isError && <p role="alert">{msg(list.error)}</p>}
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Limit (GBP)</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </TR>
        </THead>
        <TBody>
          {(list.data ?? []).map((c) => (
            <Row key={`${c.id}-${c.name}-${c.limit_gbp}-${c.is_active}`} c={c} onSaved={refetch} />
          ))}
        </TBody>
      </Table>
      <CreateForm onDone={refetch} />
    </div>
  );
}

export default function Screen() {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <CategoriesAdmin />
    </QueryClientProvider>
  );
}
