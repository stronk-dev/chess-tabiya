// @vitest-environment happy-dom
// Same sealed item and actual Svelte controls; geometry/native input is a separate gate.
import { afterEach, describe, expect, it } from "vitest";
import { tick } from "svelte";
import { PRIMARY_EVIDENCE_MANIFEST, evidenceForConsumer, presentEvidenceItems, parsePresentationReceipt, serializePresentedEvidence, presentedSentence, presentedGradeMeasurementReport } from "@chess-tabiya/runtime";
import { invokeEvidenceValueRoute } from "../../../../../packages/runtime/src/internal/evidence-value-routes.js";
import { recordedGradeFixture } from "../../../../../packages/runtime/src/testing/recorded-grade-fixture.js";
import { createComponentTestScope } from "../component-test-lifecycle.js";
import PresentedEvidence from "./PresentedEvidence.svelte";

const scope = createComponentTestScope();
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); });
function fixture(black = false, version = "19") {
  const f = recordedGradeFixture({ black, timing: "post_commit", before: "cp 0", after: "cp 200", budget: { version } });
  const grade = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: f.source });
  if (grade.kind !== "available" || grade.value.length !== 1) throw Error("Expected original grade");
  const receipt = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, grade.value)));
  const items = parsePresentationReceipt(JSON.parse(JSON.stringify(receipt)));
  const root = document.createElement("div"); document.body.append(root);
  const view = scope.createClassComponent({ component: PresentedEvidence, target: root, props: { items, detailsScope: {}, detailsActive: true, detailsGeneration: 0 } });
  return { ...f, root, view, items, receipt };
}
const opener = (root: HTMLElement) => [...root.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "How measured")!;
const report = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-label="Measurement details"]');
const close = (root: HTMLElement) => [...root.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Close measurement details")!;
// Invoke the emitted original handler, reconnected, so a delegated detached click cannot falsely pass.
function retained(control: HTMLButtonElement) {
  const handlers = Object.getOwnPropertySymbols(control).flatMap(symbol => {
    const value: unknown = symbol.description === "events" ? Reflect.get(control, symbol) : null;
    return typeof value === "object" && value !== null && "click" in value && typeof value.click === "function" ? [value.click] : [];
  });
  expect(handlers).toHaveLength(1);
  const handler = handlers[0]!;
  return (root: HTMLElement) => {
    root.append(control);
    const event = new MouseEvent("click", { bubbles: true }); Object.defineProperty(event, "currentTarget", { value: control });
    handler.call(control, event);
  };
}

describe("D3767/D4064 same-item measurement disclosure", () => {
  it.each([false, true])("default is concise; explicit report keeps canonical full bytes, mirrored=%s", async black => {
    const f = fixture(black); await tick();
    const full = presentedGradeMeasurementReport(f.items[0]!);
    if (full?.kind !== "available") throw Error("Expected complete report");
    expect(f.root.textContent).toContain(presentedSentence(f.items[0]!));
    expect(f.root.textContent).not.toContain(full.sentence); expect(report(f.root)).toBeNull();
    expect(opener(f.root).getAttribute("aria-expanded")).toBe("false");
    opener(f.root).focus(); opener(f.root).click(); await tick();
    expect(report(f.root)?.querySelector("p")?.textContent).toBe(full.sentence);
    expect(report(f.root)?.id).toBe(opener(f.root).getAttribute("aria-controls"));
    expect(opener(f.root).getAttribute("aria-expanded")).toBe("true");
    close(f.root).focus(); close(f.root).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await tick(); await tick();
    expect(report(f.root)).toBeNull(); expect(document.activeElement).toBe(opener(f.root));
  });
  it.each(["same-byte packet", "region generation", "inactive then active", "close then reopen"])("rejects original Open and Close after %s", async change => {
    const f = fixture(); await tick();
    const oldOpen = retained(opener(f.root)); opener(f.root).click(); await tick();
    const oldClose = retained(close(f.root));
    if (change === "same-byte packet") f.view.$set({ detailsScope: {} });
    else if (change === "region generation") f.view.$set({ detailsGeneration: 1 });
    else if (change === "inactive then active") { f.view.$set({ detailsActive: false }); await tick(); f.view.$set({ detailsActive: true }); }
    else close(f.root).click();
    await tick(); expect(report(f.root)).toBeNull();
    oldOpen(f.root); await tick(); expect(report(f.root)).toBeNull();
    // The reinserted node might be the same DOM opener. Use its CURRENT handler via .click().
    opener(f.root).click(); await tick(); expect(report(f.root)).not.toBeNull();
    oldClose(f.root); await tick(); expect(report(f.root)).not.toBeNull();
  });
  it("does not offer a report outside an active owning seat, and retires retained controls on unmount", async () => {
    const f = fixture(); await tick(); const oldOpen = retained(opener(f.root));
    f.view.$set({ detailsActive: false }); await tick(); expect(opener(f.root)).toBeUndefined();
    oldOpen(f.root); await tick(); expect(report(f.root)).toBeNull();
    await scope.cleanup(); oldOpen(f.root); await tick(); expect(report(f.root)).toBeNull();
  });
  it("states the manual limit for a genuine oversized closed operand, with no partial full report", async () => {
    const f = fixture(false, Array.from({ length: 430 }, () => "synthetic").join(" ")); await tick();
    expect(presentedGradeMeasurementReport(f.items[0]!)).toMatchObject({ kind: "limited", limit: 400 });
    opener(f.root).click(); await tick();
    expect(report(f.root)?.querySelector("p")?.textContent).toBe("Measurement details exceed this view's limit.");
    expect(f.root.textContent).not.toContain("synthetic synthetic");
  });
});
