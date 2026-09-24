// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import AccountImportPanel from "./AccountImportPanel.svelte";
import AccountInventoryPanel from "./AccountInventoryPanel.svelte";
import AssistanceSettings from "./AssistanceSettings.svelte";
import { ACCOUNT_DATA_CLASS_LABELS, deletionFate, exportFate } from "./account-inventory-copy.js";
import { ApiError, type AccountExportProgress, type AccountImportReceipt, type AccountInventory } from "./api.js";

/** The server's twelve non-installation classes (apps/server/src/account-import.test.ts pins the same list). */
const TWELVE = [
  "learner_identity", "security", "owned_runs", "run_access", "marks", "progress",
  "repertoires", "drafts", "publications", "live_social", "behavioral_profiles", "device_local_preferences",
];

const inventory: AccountInventory = {
  version: 1,
  classes: [
    { dataClass: "owned_runs", count: 3, stores: [
      { store: "drill_runs", exportDisposition: "project", deletionDisposition: "classify_run", count: 3 },
      { store: "evidence_jobs", exportDisposition: "exclude", deletionDisposition: "classify_run", count: null },
    ] },
    { dataClass: "security", count: 0, stores: [{ store: "learner_sessions", exportDisposition: "exclude", deletionDisposition: "hard_delete", count: null }] },
    { dataClass: "publications", count: 1, stores: [{ store: "registered_packs", exportDisposition: "project", deletionDisposition: "retain", count: 1 }] },
  ],
};

function receipt(overrides: Partial<AccountImportReceipt> = {}): AccountImportReceipt {
  return {
    version: 1, mode: "preview", bundleDigest: `sha256:${"a".repeat(64)}`, bundleFormatVersion: 1, sourceStorageVersion: 28,
    restored: [{ table: "drill_runs", count: 2 }, { table: "attempts", count: 1 }],
    rederived: ["learner_position_stats"],
    notRestored: [{ kind: "rating_record", count: 3, reason: "Ratings are measured by an installation." }],
    conflicts: [],
    ...overrides,
  };
}

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

function chooseFile(text: string, name = "tabiya-account-alice.json"): void {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, "files", { configurable: true, value: [new File([text], name, { type: "application/json" })] });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => document.body.replaceChildren());

describe("account inventory copy", () => {
  it("names exactly the server's twelve non-installation classes", () => {
    expect(Object.keys(ACCOUNT_DATA_CLASS_LABELS)).toEqual(TWELVE);
  });

  it("derives both fates from store dispositions", () => {
    expect(exportFate(inventory.classes[0]!)).toBe("In your download, except operational records");
    expect(exportFate(inventory.classes[1]!)).toBe("Not in your download");
    expect(deletionFate(inventory.classes[2]!)).toContain("published versions stay available");
  });
});

describe("What Tabiya has recorded", () => {
  it("renders one row per class with counts and fates, and retries a failed load", async () => {
    let fail = true;
    const loadInventory = vi.fn(async () => { if (fail) throw new Error("offline"); return inventory; });
    const component = mount(AccountInventoryPanel, { target: target(), props: { loadInventory } });
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("could not be loaded"));
    fail = false;
    [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("Try loading again"))!.click();
    await vi.waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(3));
    const owned = document.querySelector('[data-data-class="owned_runs"]')!;
    expect(owned.textContent).toContain("Your games and rehearsals");
    expect(owned.textContent).toContain("3");
    expect(document.querySelector('[data-data-class="security"]')!.textContent).toContain("Not counted");
    unmount(component);
  });
});

describe("account import panel", () => {
  it("previews a chosen file, then commits only with a password", async () => {
    const previewImport = vi.fn(async () => receipt());
    const commitImport = vi.fn(async () => receipt({ mode: "committed" }));
    const onImported = vi.fn();
    const component = mount(AccountImportPanel, { target: target(), props: { previewImport, commitImport, onImported } });
    await tick();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    chooseFile(JSON.stringify({ format: "tabiya-account-export" }));
    await vi.waitFor(() => expect(document.querySelector("[data-import-preview]")).not.toBeNull());
    expect(previewImport).toHaveBeenCalledWith({ format: "tabiya-account-export" });
    const text = document.body.textContent ?? "";
    expect(text).toContain("2 runs");
    expect(text).toContain("1 attempt");
    expect(text).toContain("Ratings are measured by an installation.");
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Re-enter your password"));
    expect(commitImport).not.toHaveBeenCalled();
    setInput(document.querySelector<HTMLInputElement>('input[type="password"]')!, "secret password");
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(commitImport).toHaveBeenCalledWith("secret password", { format: "tabiya-account-export" }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Imported 2 runs"));
    expect(onImported).toHaveBeenCalledOnce();
    unmount(component);
  });

  it("refuses a colliding file without offering a commit, and explains typed refusals", async () => {
    const conflicts = Array.from({ length: 7 }, (_, index) => `run:r-${index}`);
    const previewImport = vi.fn(async () => receipt({ conflicts }));
    const commitImport = vi.fn(async () => receipt());
    const component = mount(AccountImportPanel, { target: target(), props: { previewImport, commitImport } });
    chooseFile("{}");
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("7 records in this file already exist"));
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(document.querySelectorAll(".conflicts li")).toHaveLength(5);
    expect(document.body.textContent).toContain("and 2 more.");

    previewImport.mockRejectedValueOnce(new ApiError(422, "ACCOUNT_IMPORT_UNSUPPORTED_VERSION", "newer"));
    chooseFile("{}");
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("newer Tabiya"));
    chooseFile("not json");
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("not a Tabiya account download"));
    expect(commitImport).not.toHaveBeenCalled();
    unmount(component);
  });

  it("refuses an oversized file before reading it", async () => {
    const previewImport = vi.fn(async () => receipt());
    const component = mount(AccountImportPanel, { target: target(), props: { previewImport, commitImport: vi.fn(), maxBytes: 4 } });
    chooseFile("{\"too\":\"large\"}");
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("limited to"));
    expect(previewImport).not.toHaveBeenCalled();
    unmount(component);
  });
});

describe("account download progress", () => {
  it("shows received and total bytes while the archive downloads", async () => {
    let report!: (progress: AccountExportProgress) => void;
    let finish!: () => void;
    const onExport = vi.fn((_password: string, onProgress?: (progress: AccountExportProgress) => void) => new Promise<void>((resolve) => { report = onProgress!; finish = resolve; }));
    const component = mount(AssistanceSettings, { target: target(), props: {
      learner: { id: "learner-a", handle: "alice", createdAt: "2026-08-23T00:00:00.000Z" },
      onSignOut: vi.fn(), onExport, onDelete: vi.fn(),
    } });
    await tick();
    setInput(document.querySelector<HTMLInputElement>('input[type="password"]')!, "pw");
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(onExport).toHaveBeenCalledOnce());
    report({ receivedBytes: 2048, totalBytes: 4096 });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Downloaded 2.0 KB of 4.0 KB"));
    const bar = document.querySelector<HTMLProgressElement>("progress.export-progress")!;
    expect(bar.getAttribute("value")).toBe("2048");
    expect(bar.getAttribute("max")).toBe("4096");
    finish();
    await vi.waitFor(() => expect(document.querySelector("progress.export-progress")).toBeNull());
    expect(document.body.textContent).toContain("download has started");
    unmount(component);
  });
});
