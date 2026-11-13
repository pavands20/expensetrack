import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Help from "./Help";

function mount() {
  render(
    <MemoryRouter initialEntries={["/help"]}>
      <Routes>
        <Route path="/help" element={<Help />} />
        <Route path="/claim" element={<p>New claim page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function open(name: RegExp) {
  await userEvent.click(screen.getByRole("button", { name }));
}

describe("Help guide", () => {
  it("[AC-101] lists every guide section and shows claim creation first", () => {
    mount();
    for (const n of [
      /Creating and submitting a claim/,
      /Uploading receipts/,
      /What each role can do/,
      /Approval routing/,
      /Not supported/,
    ])
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Creating and submitting a claim" })).toBeVisible();
    expect(screen.getByText(/Submit only works/)).toBeInTheDocument();
  });

  it("[AC-101] receipts section covers uploading receipts", async () => {
    mount();
    await open(/Uploading receipts/);
    expect(screen.getByRole("heading", { name: "Uploading receipts" })).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG and PDF, up to 5 MB/)).toBeInTheDocument();
  });

  it("[AC-101] roles section covers Employee, Manager and Finance tasks", async () => {
    mount();
    await open(/What each role can do/);
    expect(screen.getByText("Employee", { selector: "dt" })).toBeInTheDocument();
    expect(screen.getByText(/Approves or rejects a submitted claim/)).toBeInTheDocument();
    const fin = screen.getByText(/Approves or rejects claims that have passed the manager stage/);
    expect(fin).toHaveTextContent(/manages categories/);
    expect(fin).toHaveTextContent(/exports approved claims as CSV/);
    expect(fin).toHaveTextContent(/creates and deactivates accounts/);
  });

  it("[AC-102] approval routing explains self approval, no manager and Finance own claim", async () => {
    mount();
    await open(/Approval routing/);
    expect(screen.getByText(/Nobody can approve or reject their own claim/)).toBeInTheDocument();
    expect(
      screen.getByText(/No assigned manager: your claim skips the manager stage/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only a different Finance user can decide your claim/),
    ).toBeInTheDocument();
  });

  it("[AC-101] states unsupported features", async () => {
    mount();
    await open(/Not supported/);
    for (const t of ["Currency conversion.", "Mileage.", "Card feeds.", "Accounting integrations."])
      expect(screen.getByText(t)).toBeInTheDocument();
  });

  it("[AC-101] Start a new claim navigates to the claim screen", async () => {
    mount();
    await userEvent.click(screen.getByRole("button", { name: /Start a new claim/ }));
    expect(await screen.findByText("New claim page")).toBeInTheDocument();
  });
});
