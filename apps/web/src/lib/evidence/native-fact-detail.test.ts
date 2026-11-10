// @vitest-environment happy-dom
// D4188: original selected-item membership and real emitted handler retirement.
import { afterEach, expect, it } from "vitest";
import { tick } from "svelte";
import { localSemanticEventClosure } from "../../../../../packages/runtime/src/semantic-evidence.js";
import { recordedSequenceWindowFixture } from "../../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { PRIMARY_EVIDENCE_MANIFEST, evidenceForConsumer, parsePresentationReceipt, presentEvidenceItems, serializePresentedEvidence, presentedSentence } from "@chess-tabiya/runtime";
import { createComponentTestScope } from "../component-test-lifecycle.js";
import PresentedEvidence from "./PresentedEvidence.svelte";
import TextStatementView from "./components/TextStatementView.svelte";
const scope = createComponentTestScope();
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); });
function items(module: "postcommit_nudge" | "review_map") {
  const run = recordedSequenceWindowFixture({ fen: "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", moves: ["b2c3"] });
  const evidence = localSemanticEventClosure(run.nodes[0]!.fen, "b2c3", run.nodes[1]!.fen).events.map(event => event.evidence)
    .filter(value => value.projection.id === "derived.activity.event.file_access_revealed");
  expect(evidence).toHaveLength(1);
  return parsePresentationReceipt(serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 2 }, evidence))));
}
const button = (root: Element, label = "Inspect this fact") => [...root.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === label)!;
const report = (root: Element) => root.querySelector('[aria-label="Fact details"]');
function emitted(node: HTMLButtonElement, type: "click" | "keydown") {
  const found = Object.getOwnPropertySymbols(node).flatMap(symbol => {
    const value = symbol.description === "events" ? Reflect.get(node, symbol) : null;
    return value !== null && typeof value === "object" && typeof value[type] === "function" ? [value[type]] : [];
  });
  expect(found).toHaveLength(1);
  return (root: Element) => {
    const connected = node.isConnected; if (!connected) root.append(node);
    const event = type === "click" ? new MouseEvent(type, { bubbles: true }) : new KeyboardEvent(type, { key: "Escape", bubbles: true });
    Object.defineProperty(event, "currentTarget", { value: node }); found[0]!.call(node, event);
    if (!connected) node.remove();
  };
}
for (const module of ["postcommit_nudge", "review_map"] as const) {
  for (const change of ["selected packet", "same-byte scope", "generation", "help/access", "unmount"] as const) {
    it(`${module} retires genuinely current closed Open after ${change}`, async () => {
      const selected = items(module), root = document.createElement("div"); document.body.append(root);
      const view = scope.createClassComponent({ component: PresentedEvidence, target: root, props: { items: selected, detailsScope: {}, detailsActive: true, detailsGeneration: 0 } });
      await tick(); const oldOpen = emitted(button(root), "click");
      // No intervening open/close/epoch change: this is the currently usable closed-state handler.
      if (change === "selected packet") view.$set({ items: items(module) });
      else if (change === "same-byte scope") view.$set({ detailsScope: {} });
      else if (change === "generation") view.$set({ detailsGeneration: 1 });
      else if (change === "help/access") { view.$set({ detailsActive: false }); await tick(); view.$set({ detailsActive: true }); }
      else await scope.cleanup();
      await tick(); oldOpen(root); await tick(); expect(report(root)).toBeNull();
      if (change !== "unmount") { button(root).click(); await tick(); expect(report(root)).not.toBeNull(); }
    });
    it(`${module} stale Close/Escape cannot dismiss or steal focus from replacement after ${change}`, async () => {
      const selected = items(module), root = document.createElement("div"); document.body.append(root);
      const view = scope.createClassComponent({ component: PresentedEvidence, target: root, props: { items: selected, detailsScope: {}, detailsActive: true, detailsGeneration: 0 } });
      await tick(); button(root).click(); await tick();
      const previous = button(root, "Close fact details"), oldClose = emitted(previous, "click"), oldEscape = emitted(previous, "keydown");
      if (change === "selected packet") view.$set({ items: items(module) });
      else if (change === "same-byte scope") view.$set({ detailsScope: {} });
      else if (change === "generation") view.$set({ detailsGeneration: 1 });
      else if (change === "help/access") { view.$set({ detailsActive: false }); await tick(); view.$set({ detailsActive: true }); }
      else await scope.cleanup();
      await tick(); expect(report(root)).toBeNull();
      if (change === "unmount") { oldClose(root); oldEscape(root); await tick(); expect(report(root)).toBeNull(); return; }
      button(root).click(); await tick(); const current = report(root)!;
      const sentinel = document.createElement("button"); document.body.append(sentinel); sentinel.focus();
      oldClose(root); oldEscape(root); await tick(); await tick();
      expect(report(root)).toBe(current); expect(document.activeElement).toBe(sentinel);
      // The current Escape still works and restores its own current toggle.
      button(root, "Close fact details").focus();
      button(root, "Close fact details").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await tick(); await tick(); expect(report(root)).toBeNull(); expect(document.activeElement).toBe(button(root));
    });
  }
  it(`${module} cannot borrow a foreign original item or removed selected membership`, async () => {
    const selected = items(module), foreign = items(module)[0]!, owner = selected[0]!;
    expect(foreign).not.toBe(owner); expect(foreign).toEqual(owner);
    if (owner.component.id !== "fact_statement") throw new Error("Expected native fact");
    const root = document.createElement("div"); document.body.append(root);
    const view = scope.createClassComponent({ component: TextStatementView, target: root, props: {
      component: owner.component, sentence: presentedSentence(owner), owner, selectedItems: [foreign] as readonly typeof owner[], detailsScope: {}, detailsActive: true,
    } });
    await tick(); expect(button(root)).toBeUndefined();
    view.$set({ selectedItems: selected }); await tick(); const oldOpen = emitted(button(root), "click");
    view.$set({ selectedItems: [] }); await tick(); expect(button(root)).toBeUndefined();
    oldOpen(root); await tick(); expect(report(root)).toBeNull();
  });
}
