// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import AssistanceSettings from "./AssistanceSettings.svelte";
import type { DeletionPreview } from "./api.js";

const preview: DeletionPreview = Object.freeze({
  version: 1,
  scope: Object.freeze({ kind: "account" }),
  digest: `sha256:${"a".repeat(64)}`,
  hardDelete: Object.freeze([{ kind: "run", count: 2, objectIds: Object.freeze(["private-a", "private-b"]), label: "Two private runs are permanently deleted" }]),
  tombstone: Object.freeze([{ kind: "shared_run", count: 1, objectIds: Object.freeze(["shared-a"]), label: "Study game remains read-only for collaborators" }]),
  revoke: Object.freeze([{ kind: "anonymous_link", count: 3, objectIds: Object.freeze(["one", "two", "three"]), label: "Anonymous links stop working" }]),
  retainedPublished: Object.freeze([{ kind: "publication", count: 1, objectIds: Object.freeze(["pack-a"]), label: "Published pack remains immutable" }]),
  backupNotice: "Live data is removed immediately; backup retention is deployment-managed.",
});

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

function setInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => document.body.replaceChildren());

describe("account lifecycle panel", () => {
  it("guides export and categorized deletion through password-confirmed callbacks", async () => {
    const onExport = vi.fn(async () => {});
    const onDelete = vi.fn(async () => {});
    const loadDeletionPreview = vi.fn(async () => preview);
    const component = mount(AssistanceSettings, { target: target(), props: {
      learner: { id: "learner-a", handle: "alice", createdAt: "2026-08-23T00:00:00.000Z" },
      onSignOut: vi.fn(), onExport, onDelete, loadDeletionPreview,
    } });
    await tick();

    const passwordInputs = [...document.querySelectorAll<HTMLInputElement>('input[type="password"]')];
    expect(passwordInputs).toHaveLength(1);
    setInput(passwordInputs[0]!, "export-password");
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(onExport).toHaveBeenCalledWith("export-password"));
    await vi.waitFor(() => expect(passwordInputs[0]!.value).toBe(""));
    expect(document.querySelector('[role="status"]')?.textContent).toContain("download has started");

    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Review deletion effects"))!.click();
    await vi.waitFor(() => expect(loadDeletionPreview).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(document.body.textContent).toContain("Deletion effects"));
    const text = document.body.textContent ?? "";
    for (const heading of ["Permanently deleted", "Kept read-only for collaborators", "Access revoked", "Published work retained"]) expect(text).toContain(heading);
    expect(text).toContain(preview.backupNotice);

    const deletePassword = [...document.querySelectorAll<HTMLInputElement>('input[type="password"]')].at(-1)!;
    setInput(deletePassword, "delete-password");
    const deleteButton = [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((button) => button.textContent?.includes("Delete account"))!;
    deleteButton.click();
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalledWith("delete-password", preview.digest));
    await vi.waitFor(() => expect(deletePassword.value).toBe(""));
    await unmount(component);
  });

  it("clears an export password after failure and keeps deletion preview recoverable", async () => {
    const onExport = vi.fn(async () => { throw new Error("Export temporarily unavailable"); });
    const onDelete = vi.fn(async () => { throw new Error("Deletion preview became stale"); });
    const component = mount(AssistanceSettings, { target: target(), props: {
      learner: { id: "learner-a", handle: "alice", createdAt: "2026-08-23T00:00:00.000Z" },
      onSignOut: vi.fn(), onExport, onDelete, loadDeletionPreview: async () => preview,
    } });
    await tick();
    const exportPassword = document.querySelector<HTMLInputElement>('input[type="password"]')!;
    setInput(exportPassword, "not-retained");
    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(exportPassword.value).toBe(""));
    expect(document.querySelector('[role="status"]')?.textContent).toContain("temporarily unavailable");

    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Review deletion effects"))!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Deletion effects"));
    const deletePassword = [...document.querySelectorAll<HTMLInputElement>('input[type="password"]')].at(-1)!;
    setInput(deletePassword, "still-present-for-retry");
    [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((button) => button.textContent?.includes("Delete account"))!.click();
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("became stale"));
    expect(document.body.textContent).toContain("Deletion effects");
    expect(deletePassword.value).toBe("still-present-for-retry");
    await unmount(component);
  });
});
