import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, getSessionToken, setSessionToken } from "@/lib/api";
import ResetPassword from "./ResetPassword";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));

const CONFIRMATION = "If that email belongs to an account, a reset link has been sent.";

function mount(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/sign-in" element={<p>Sign in page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function setPasswords(pw: string) {
  await userEvent.type(screen.getByTestId("password"), pw);
  await userEvent.type(screen.getByTestId("confirm"), pw);
  await userEvent.click(screen.getByTestId("submit"));
}

describe("ResetPassword", () => {
  beforeEach(() => {
    calls.length = 0;
    localStorage.clear();
  });

  it("[AC-024] shows the confirmation after a successful request", async () => {
    impl = async () => ({ message: CONFIRMATION });
    mount("/reset-password");
    await userEvent.type(screen.getByTestId("email"), "a@x.io");
    await userEvent.click(screen.getByTestId("submit"));
    expect(await screen.findByTestId("message")).toHaveTextContent(CONFIRMATION);
  });

  it("[AC-024] shows the same confirmation when the API call fails", async () => {
    impl = async () => {
      throw new ApiError(500, "boom");
    };
    mount("/reset-password");
    await userEvent.type(screen.getByTestId("email"), "a@x.io");
    await userEvent.click(screen.getByTestId("submit"));
    expect(await screen.findByTestId("message")).toHaveTextContent(CONFIRMATION);
  });

  it("[AC-025] [AC-027] confirms, shows success with Sign in link and clears the session", async () => {
    setSessionToken("old");
    impl = async () => undefined;
    mount("/reset-password?token=abc");
    await setPasswords("longenough1");
    expect(await screen.findByTestId("message")).toHaveTextContent("Your password has been reset.");
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(1);
    expect(calls[0][0]).toBe("/api/auth/password-reset/confirm");
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({
      token: "abc",
      new_password: "longenough1",
    });
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-026] a 400 shows the used/expired message and a link to the request form", async () => {
    impl = async () => {
      throw new ApiError(400, "Reset link is invalid or has expired");
    };
    mount("/reset-password?token=abc");
    await setPasswords("longenough1");
    expect(await screen.findByTestId("error")).toHaveTextContent(
      "This reset link has already been used or has expired. Request a new one.",
    );
    const link = screen.getByRole("link", { name: "Request a new link" });
    expect(link).toHaveAttribute("href", "/reset-password");
    await userEvent.click(link);
    expect(await screen.findByTestId("email")).toBeInTheDocument();
  });
});
