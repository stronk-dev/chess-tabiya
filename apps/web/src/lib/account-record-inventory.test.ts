// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import AssistanceSettings from "./AssistanceSettings.svelte";
import type { DeletionEffect, DeletionPreview } from "./api.js";
import { RECORDED_DATA_CLASSES, RECORDED_DATA_KINDS, recordedDataRows } from "./account-record-inventory.js";

const effect = (kind: string, count: number, label = `${kind} label`): DeletionEffect => ({ kind, count, objectIds: Array.from({ length: count }, (_, index) => `${kind}-${index}`), label });

function preview(parts: Partial<Pick<DeletionPreview, "hardDelete" | "tombstone" | "revoke" | "retainedPublished">>): DeletionPreview {
  return { version: 1, scope: { kind: "account" }, digest: `sha256:${"b".repeat(64)}`, hardDelete: [], tombstone: [], revoke: [], retainedPublished: [], backupNotice: "Backups are deployment-managed.", ...parts };
}

afterEach(() => document.body.replaceChildren());

describe("What Tabiya has recorded (IMP-a12, IMP-a14, IMP-a17)", () => {
  it("covers exactly the server's deletion-effect kinds, so a new data class forces a disclosure row", () => {
    const source = readFileSync(join(process.cwd(), "apps/server/src/account-data.ts"), "utf8");
    const union = /export type DeletionEffectKind =([^;]+);/u.exec(source)?.[1] ?? "";
    const serverKinds = [...union.matchAll(/"([a-z_]+)"/gu)].map((match) => match[1]).sort();
    expect(serverKinds.length).toBeGreaterThanOrEqual(12);
    expect([...RECORDED_DATA_KINDS].sort()).toEqual(serverKinds);
  });

  it("sums live counts per class across every deletion outcome and states an uncounted class instead of zero", () => {
    const rows = recordedDataRows(preview({
      hardDelete: [effect("run", 1, "A is permanently deleted"), effect("run", 1, "B is permanently deleted"), effect("progress", 7), effect("behavioral_profile", 4), effect("account", 1)],
      tombstone: [effect("shared_run", 1), effect("classroom", 1)],
      revoke: [effect("anonymous_link", 3)],
      retainedPublished: [effect("publication", 1), effect("publication", 1)],
    }));
    const count = (kind: string) => rows.find((row) => row.kind === kind)?.count;
    expect(rows.map((row) => row.kind)).toEqual([...RECORDED_DATA_KINDS]);
    expect(count("run")).toBe(2);
    expect(count("publication")).toBe(2);
    expect(count("anonymous_link")).toBe(3);
    expect(count("mark")).toBe(0);
    expect(count("live_session")).toBeUndefined();
  });

  it("names the behavioural record's contents, including abandoned and voided games", () => {
    const behavioural = RECORDED_DATA_CLASSES.behavioral_profile;
    for (const phrase of ["ratings", "rated game", "abandoned", "voided", "reason", "standings", "play measurements"]) expect(behavioural.holds.toLowerCase()).toContain(phrase);
  });

  it("projects storage facts only: row copy is fixed and never varies with what the records contain", () => {
    const small = recordedDataRows(preview({ hardDelete: [effect("behavioral_profile", 1, "one game")] }));
    const large = recordedDataRows(preview({ hardDelete: [effect("behavioral_profile", 900, "abandons losing endgames")] }));
    const copy = (rows: ReturnType<typeof recordedDataRows>) => rows.map(({ noun, holds, inDownload, onDeletion }) => ({ noun, holds, inDownload, onDeletion }));
    expect(copy(large)).toEqual(copy(small));
    const text = JSON.stringify(RECORDED_DATA_CLASSES).toLowerCase();
    for (const narration of ["you tend", "you often", "your style", "weakness", "you are a ", "you struggle", "tends to"]) expect(text).not.toContain(narration);
  });

  it("keeps a server kind this table does not describe visible under the server's own label", () => {
    const rows = recordedDataRows(preview({ hardDelete: [effect("future_class", 2, "Future records are permanently deleted")] }));
    expect(rows.at(-1)).toMatchObject({ kind: "future_class", count: 2, holds: "Future records are permanently deleted" });
  });

  it("states presence at every moment keeping starts, as the documented data-tier rule lists (IMP-a27)", () => {
    const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
    const docs = read("docs/identity-and-authorization.md");
    const sources = ["apps/web/src/App.svelte", "apps/web/src/lib/RatingScreen.svelte", "apps/web/src/lib/ReviewMapScreen.svelte"].map(read).join("\n");
    const section = docs.slice(docs.indexOf("## Data presence is stated when keeping starts"));
    const ids = [...section.matchAll(/`([a-z]+(?:-[a-z]+)+)(?:-<id>)?`/gu)].map((match) => match[1]!).filter((id) => /disclosure|retention|lifetime/u.test(id));
    expect(ids).toEqual(["registration-data-disclosure", "rated-game-data-disclosure", "import-storage-disclosure", "classroom-retention", "pack-publication-retention", "shape-publication-retention", "review-share-lifetime"]);
    for (const id of ids) expect(sources, id).toMatch(new RegExp(`id=(?:"|\\{\`)${id}`, "u"));
  });

  it("renders the standing section on the account screen without approaching deletion", async () => {
    const onDelete = vi.fn();
    const component = mount(AssistanceSettings, { target: document.body.appendChild(document.createElement("div")), props: {
      learner: { id: "learner-a", handle: "alice", createdAt: "2026-08-23T00:00:00.000Z" },
      onSignOut: vi.fn(), onExport: vi.fn(), onDelete,
      loadDeletionPreview: async () => preview({ hardDelete: [effect("behavioral_profile", 5), effect("account", 1)] }),
    } });
    await tick();
    await vi.waitFor(() => expect(document.querySelector("#recorded-data-title")?.textContent).toBe("What Tabiya has recorded"));
    const rows = [...document.querySelectorAll<HTMLElement>("[data-recorded-kind]")];
    expect(rows.map((row) => row.dataset.recordedKind)).toEqual([...RECORDED_DATA_KINDS]);
    const behavioural = document.querySelector<HTMLElement>('[data-recorded-kind="behavioral_profile"]')!;
    expect(behavioural.textContent).toContain("Rating and play record");
    expect(behavioural.textContent).toContain("5 records");
    expect(behavioural.textContent).toContain("If you delete your account");
    expect(document.querySelector('[data-recorded-kind="live_session"]')?.textContent).toContain("Not counted in this summary");
    expect(onDelete).not.toHaveBeenCalled();
    await unmount(component);
  });
});
