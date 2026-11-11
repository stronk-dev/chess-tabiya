import { FOUNDATION_INSPECTOR_CASES } from "../../../../packages/runtime/src/testing/foundation-inspector-fixture.js";
import { foundationDetailMembers, type FoundationDetailMember } from "../../../../packages/runtime/src/foundation-snapshot-detail.js";
import { parseInspectorDetailPayload } from "../../../../packages/runtime/src/inspector-detail.js";
// @vitest-environment happy-dom
// Independent actual SQLite/RunService → JSON → strict receiver → mounted browser proof.
// DOM behavior only, not native layout or a bypass of the default content bootstrap.
import { tick } from "svelte";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, type RequestedAssistanceV1 } from "@chess-tabiya/runtime";
import { INSPECTOR_SOURCE_TOPICS, type InspectorSourceRef } from "../../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_DETAIL_SOURCES } from "../../../../packages/runtime/src/inspector-source-topics.js";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { INSPECTOR_SOURCE_LABELS } from "./inspector-source-labels.js";
import InspectorSourceBrowser from "./InspectorSourceBrowser.svelte";
import { branchPath, commitMove, fork, rewind } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../../packages/runtime/src/evidence-contract.js";
import { modulePresentationBundleCost, presentedSentence } from "@chess-tabiya/runtime/client";
import { recordedSemanticWindowSource } from "../../../../packages/runtime/src/recorded-semantic-window.js";
import { RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "../../../../packages/runtime/src/recorded-sequence-window.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES } from "../../../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { recordedSequenceWindowFixture } from "../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { parseInspectorQueryPage } from "./inspector-query-response.js";
import { STRUCTURAL_EVENT_FAMILIES } from "../../../../packages/runtime/src/evidence-catalog.js";
import { collectInspectorLocalPosition, collectInspectorLocalEdge, type InspectorLocalProjection } from "../../../../packages/runtime/src/inspector-local-source.js";
import { inspectorFixtureEdges } from "../../../../packages/runtime/src/testing/inspector-presentation-fixture.js";
import { registeredShapeFixture } from "../../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { STRUCTURAL_CONVENTION_REFS } from "@chess-tabiya/schema/drill-pack";

import { inspectorBrowserFixture as fixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture, type Props, type Query } from "./inspector-source-browser.test-support.js";

const scope=createComponentTestScope();
const requested=(arrows?:"off"):RequestedAssistanceV1=>compileAssistanceRequest({contextHint:"position",preference:{kind:"explicit",preset:"analysis",overrides:arrows===undefined?{}:{arrows},moduleOverrides:{include:[],exclude:[]}}});
const json=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
afterEach(async()=>{await scope.cleanup();vi.restoreAllMocks();document.body.replaceChildren();await disposeInspectorBrowserFixtures();});
afterAll(async()=>{await terminateInspectorBrowserFixture();});
const button = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent?.trim() === text);
const labelControl = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLLabelElement>("label")].find(node => node.childNodes[0]?.textContent?.trim() === text)?.querySelector<HTMLInputElement | HTMLSelectElement>("input,select");
async function selectValue(select: HTMLSelectElement, value: string) {
  for (const option of select.options) {
    option.selected = option.textContent?.toLowerCase() === value;
    option.toggleAttribute("selected", option.selected);
  }
  expect([...select.options].filter(option => option.selected).map(option => option.textContent?.toLowerCase())).toEqual([value]);
  // happy-dom20 implements :checked for INPUT only; Svelte's actual select binding
  // reads :checked. Supply the real selected option for that one DOM selector.
  const original = select.querySelector.bind(select);
  const query = vi.spyOn(select, "querySelector").mockImplementation(selector => selector === ":checked"
    ? [...select.options].find(option => option.selected) ?? null : original(selector));
  select.dispatchEvent(new Event("change", { bubbles: true })); await tick(); query.mockRestore();
}
async function settled(root: HTMLElement) { await vi.waitFor(() => expect(root.textContent).not.toContain("Reading the requested evidence…")); await tick(); }
async function click(root: HTMLElement, text: string) { const found = button(root, text); expect(found, `No button ${text}`).toBeDefined(); found!.click(); await tick(); }
async function mountBrowser(props: Props) {
  const target = document.createElement("div"); document.body.append(target);
  const instance = scope.createClassComponent({ component: InspectorSourceBrowser, target, props });
  await tick(); await vi.waitFor(() => expect(target.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8));
  return { target, instance };
}
async function navigate(root: HTMLElement, projection: InspectorSourceRef) {
  const wanted = INSPECTOR_SOURCE_TOPICS.findIndex(row => row.projection === projection), text = INSPECTOR_SOURCE_LABELS[projection];
  for (let step = 0; step < Math.ceil(INSPECTOR_SOURCE_TOPICS.length / 8) && button(root.querySelector("nav")!, text) === undefined; step++) {
    const first = root.querySelector("nav li button")?.textContent;
    const firstIndex = INSPECTOR_SOURCE_TOPICS.findIndex(row => INSPECTOR_SOURCE_LABELS[row.projection] === first);
    await click(root, wanted < firstIndex ? "Previous sources" : "Next sources"); await settled(root);
  }
  expect(button(root.querySelector("nav")!, text)).toBeDefined();
}
async function choose(root: HTMLElement, projection: InspectorSourceRef) { await navigate(root, projection); await click(root, INSPECTOR_SOURCE_LABELS[projection]); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(accept => { resolve = accept; }); return { promise, resolve }; }

describe("independent genuine Inspector source browser", () => {
  for (const black of [false, true]) {
    it(`D4082 delivers current registered intervals through cookie REST and retires later endpoints, black=${black}`, async () => {
      const run = recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"] }, black, `shape3-browser-${black}`);
      const document = registeredShapeFixture("current-browser-pattern", black);
      const f = await fixture({ run, shapes: [document], authenticatedRest: true }), before = JSON.stringify(await f.savedRun());
      const onQuery = vi.fn(f.send), { target, instance } = await mountBrowser({ ...f.props, onQuery });
      const route = "theory.shapes.firing@3";
      await choose(target, route); await settled(target);
      expect(target.textContent).toContain("Matched authored pattern");
      await selectValue(labelControl(target, "Scope") as HTMLSelectElement, "this line up to this position");
      await click(target, "Read this source"); await settled(target);
      const request = onQuery.mock.calls.at(-1)![0], wire = await onQuery.mock.results.at(-1)!.value;
      const page = parseInspectorQueryPage(wire, { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
      if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Current shape failed real selected delivery");
      const path = branchPath(f.run, f.run.activeCursor.branchId);
      expect(page.items.map(item => item.component.id === "fact_statement" ? item.component.operand.operands : null)).toMatchObject([
        { entryId: document.id, firstNodeId: path[1]!.id, lastNodeId: path[2]!.id, openEnded: false },
        { entryId: document.id, firstNodeId: path[5]!.id, lastNodeId: path[5]!.id, openEnded: true },
      ]);
      expect(target.querySelectorAll('[data-presented]')).toHaveLength(2);
      expect(target.textContent).toContain("published by @mechanical-author");
      const earlier = await f.propsFor({ nodeId: path[3]!.id }); instance.$set({ ...earlier, onQuery }); await tick();
      expect(target.textContent).not.toContain("Matched authored pattern");
      await vi.waitFor(() => expect(target.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8));
      await choose(target, route); await settled(target);
      const negativeRequest = onQuery.mock.calls.at(-1)![0], negative = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
        { runId: f.run.id, request: negativeRequest, fen: earlier.fen, requestedDigest: earlier.requestedDigest, finalDigest: earlier.finalDigest });
      if (negative.kind !== "page" || negative.body.kind !== "source") throw Error("Current negative shape source was refused");
      expect(negative.body.outcome).toEqual({ kind: "no_witness" }); expect(negative.items).toEqual([]);
      expect(target.querySelectorAll('[data-presented]')).toHaveLength(0);
      expect((await f.httpStatuses()).every(status => status === 200)).toBe(true);
      expect((await f.stats()).providerCalls).toEqual([]); expect(JSON.stringify(await f.savedRun())).toBe(before);
    });

    it(`D4082 renders the explicit current outpost meaning from its actual collector, black=${black}`, async () => {
      const run = recordedSequenceWindowFixture({ fen: "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", moves: ["h1g1"] }, black, `shape3-current-ref-${black}`);
      const document = { ...registeredShapeFixture("current-outpost-browser", black), trigger: { kind: "feature" as const,
        feature: { kind: "outpost" as const, color: black ? "black" as const : "white" as const, square: black ? "e4" as const : "e5" as const,
          conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } } };
      const f = await fixture({ run, shapes: [document], authenticatedRest: true }), onQuery = vi.fn(f.send);
      const { target } = await mountBrowser({ ...f.props, onQuery }); await choose(target, "theory.shapes.firing@3"); await settled(target);
      expect(target.textContent).toContain("Matched authored pattern"); expect(target.textContent).toContain("Mechanical test occupancy");
      expect(target.querySelector('[role="alert"]')).toBeNull(); expect(target.querySelectorAll('[data-presented]')).toHaveLength(1);
      const request = onQuery.mock.calls.at(-1)![0], page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
        { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
      if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Current ref had no delivered match");
      expect(page.body.projection).toBe("theory.shapes.firing@3"); expect(page.body.outcome.collected).toBe(1);
      expect((await f.stats()).providerCalls).toEqual([]);
    });
  }

  it("D4082 distinguishes actual empty registry from missing source through the selected strict receiver", async () => {
    const statuses: unknown[] = [];
    for (const installed of [false, true]) {
      const f = await fixture({ authenticatedRest: true, ...(installed ? { shapes: [] } : {}) }), onQuery = vi.fn(f.send);
      const { target } = await mountBrowser({ ...f.props, onQuery }); await choose(target, "theory.shapes.firing@3"); await settled(target);
      const request = onQuery.mock.calls.at(-1)![0], page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
        { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
      if (page.kind !== "page" || page.body.kind !== "source") throw Error("Actual empty/absent source read refused");
      statuses.push(page.body.outcome); expect(page.items).toEqual([]); expect(target.querySelector('[role="alert"]')).toBeNull();
    }
    expect(statuses).toEqual([{ kind: "unavailable", reason: "authored_source_absent" }, { kind: "no_witness" }]);
  });

  for (const family of STRUCTURAL_EVENT_FAMILIES.filter(value => ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"].includes(value))) for (const black of [false, true]) {
    it(`D4060 selects and renders every original ${family} state through cookie REST, mirrored=${black}`, async () => {
      const route = `rules.structural.event.${family}@1` as InspectorLocalProjection & InspectorSourceRef;
      const seed = inspectorFixtureEdges().find(edge => collectInspectorLocalEdge(route, edge).values.length > 0);
      if (seed === undefined) throw Error(`No genuine positive edge for ${family}`);
      const setup = ["king_zone", "piece_count", "pawn_islands"].includes(family)
        ? { fen: "7k/p7/8/8/8/8/8/K7 w - - 0 1", moves: ["a1b1"] }
        : { fen: seed.beforeFen, moves: [seed.moveUci] };
      const initial = recordedSequenceWindowFixture(setup, black, `structural-browser-${family}-${black}`);
      const f = await fixture({ run: initial, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
      const path = branchPath(f.run, f.run.activeCursor.branchId), edge = { beforeFen: path[0]!.fen, moveUci: path[1]!.moveUci!, afterFen: path[1]!.fen };
      const original = collectInspectorLocalEdge(route, edge).values;
      expect(original.length).toBeGreaterThan(0);
      if (family === "piece_count") expect(original).toHaveLength(12);
      const onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
      await choose(target, route); await settled(target);
      const seen: string[] = [];
      for (;;) {
        const request = onQuery.mock.calls.at(-1)![0], wire = await onQuery.mock.results.at(-1)!.value;
        const page = parseInspectorQueryPage(wire, { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
        if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Original structural source failed selected UI delivery");
        const outcome = page.body.outcome;
        expect(outcome.collected).toBe(original.length);
        expect(page.body.context).toEqual({ kind: "incoming_edge" });
        expect(outcome.displayed).toBe(outcome.range.count); expect(outcome.deferred).toBe(0);
        expect(target.querySelectorAll('[data-presented]')).toHaveLength(page.items.length);
        expect(target.querySelector('[role="alert"]')).toBeNull();
        expect(target.textContent).not.toMatch(/rules\.|sha256:|undefined|NaN/u);
        for (const [index, item] of page.items.entries()) {
          expect(item.component.id).toBe("fact_statement");
          expect(target.querySelectorAll('[data-presented]')[index]!.textContent).toContain(presentedSentence(item));
          seen.push(item.evidenceRef!.evidenceDigest.slice(7));
          if (item.component.id !== "fact_statement") throw Error("Structural source added board paint");
          const payload = original[outcome.range.start + index]!.payload as { family: string; before: unknown; after: unknown; color: string };
          if (item.component.operand.rendererId === "inspector.structural_before_after@1") {
            expect(item.component.operand.operands).toMatchObject({ family, before: payload.before, after: payload.after });
            if (family === "king_zone" && item.component.operand.operands.before?.color === (black ? "black" : "white") && item.component.operand.operands.before.zone === "edge") {
              expect(item.component.operand.operands.before.squares).toEqual([black ? "a8" : "a1"]);
              expect(item.component.operand.operands.after!.squares).toEqual([black ? "b8" : "b1"]);
              expect(target.textContent).toContain(black ? "king on a8" : "king on a1");
              expect(target.textContent).toContain(black ? "king on b8" : "king on b1");
            }
          } else {
            expect(family).toBe("pawn_islands");
            expect(item.component.operand).toMatchObject({ rendererId: "inspector.pawn_islands_event@1", operands: { color: payload.color, before: payload.before, after: payload.after } });
          }
        }
        const cost = modulePresentationBundleCost(page.items);
        expect(cost.facts).toBeLessThanOrEqual(20); expect(cost.words).toBeLessThanOrEqual(400);
        expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
        if (outcome.range.next === null) break;
        await click(target, "Next observations"); await settled(target);
      }
      expect(seen).toEqual(original.map(value => evidenceValueReceipt(value).payloadDigest));
      expect((await f.stats()).providerCalls).toEqual([]);
      expect((await f.stats()).acquisitions.every(view => view !== null && typeof view === "object" && "kind" in view && view.kind === "source" && "projection" in view && view.projection === route)).toBe(true);
      expect(await f.httpStatuses()).toEqual(Array(onQuery.mock.calls.length).fill(200));
      expect(JSON.stringify(await f.savedRun())).toBe(saved);
    });
  }
  // D3792's original finite cohort: source existence cannot substitute for selected UI delivery.
  // Real cookie-authenticated REST executes in the existing Node worker; no collector, issuer,
  // page compiler, receiver or presentation component is mocked. This is DOM, not native geometry.
  // The worker's fast injected password derive tests session authorization, not password-KDF cost.
  it("retains exactly the original ten positive/negative recorded-window families in the actual topic image", () => {
    const canonical = (rows: typeof RECORDED_SEQUENCE_POSITIVES | typeof RECORDED_SEQUENCE_HARD_NEGATIVES) =>
      rows.filter(row => row.projection !== "derived.exchange.trade_completed").map(row => `${row.projection}@3`).sort();
    const routes = Object.keys(RECORDED_SEQUENCE_HORIZONS).sort();
    expect(routes).toHaveLength(10);
    expect(routes).toEqual(canonical(RECORDED_SEQUENCE_POSITIVES));
    expect(routes).toEqual(canonical(RECORDED_SEQUENCE_HARD_NEGATIVES));
    expect(INSPECTOR_SOURCE_TOPICS.filter(row => row.contexts.includes("recorded_window")).map(row => row.projection).sort()).toEqual(routes);
  });
  for (const route of Object.keys(RECORDED_SEQUENCE_HORIZONS) as RecordedSequenceRoute[]) {
    for (const emits of [true, false]) for (const black of [false, true]) for (const inherited of
      emits && ["derived.pawn.sequence.contact_timing@3", "derived.tactic.overload_exploitation_observed@3"].includes(route) ? [false, true] : [false]) {
      it(`delivers original ${route}, positive=${emits}, mirrored=${black}, inherited=${inherited}, through authenticated REST and selected browser`, async () => {
        const population = emits ? RECORDED_SEQUENCE_POSITIVES : RECORDED_SEQUENCE_HARD_NEGATIVES;
        const setup = population.find(value => `${value.projection}@3` === route)!;
        let initial = recordedSequenceWindowFixture(setup, black, `inspector-motif-${route}-${emits}-${black}-${inherited}`);
        if (inherited) {
          const original = branchPath(initial, initial.activeCursor.branchId), at = "2026-11-04T00:00:00.000Z";
          initial = fork(rewind(initial, original[1]!.id, at).run, original[1]!.id, { at }).run;
          for (const node of original.slice(2)) initial = commitMove(initial, node.moveUci!, { actor: node.actor!, at }).run;
          expect(branchPath(initial, initial.activeCursor.branchId)[1]!.branchId).not.toBe(initial.activeCursor.branchId);
        }
        const f = await fixture({ run: initial, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
        const source = recordedSemanticWindowSource({ run: f.run, branchId: f.run.activeCursor.branchId,
          throughNodeId: f.run.activeCursor.nodeId, projection: { id: setup.projection, version: 3 } });
        expect(source.kind).toBe("window_available");
        if (source.kind !== "window_available") throw Error("Original complete motif source refused");
        expect(source.events.length > 0).toBe(emits);
        const onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
        await choose(target, route); await settled(target);
        const call = onQuery.mock.calls.at(-1)!, wire = await onQuery.mock.results.at(-1)!.value;
        const received = parseInspectorQueryPage(wire, { runId: f.run.id, request: call[0], fen: f.props.fen,
          requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
        expect(received.kind).toBe("page"); if (received.kind !== "page") throw Error("Actual REST motif page refused");
        expect(received.body).toMatchObject({ kind: "source", projection: route, context: { kind: "recorded_window" } });
        if (received.body.kind !== "source") throw Error("Expected selected source page");
        expect(target.querySelector('[role="alert"]')).toBeNull();
        expect(target.textContent).not.toMatch(/sha256:|derived\.|rules\.|@3/u);
        expect(target.querySelectorAll('[data-presented]')).toHaveLength(received.items.length);
        if (!emits) {
          expect(received.body.outcome).toEqual({ kind: "no_witness" });
          expect(received.items).toEqual([]);
          expect(target.textContent).toContain("completed its check and found no matching observation");
        } else {
          const outcome = received.body.outcome;
          expect(outcome).toMatchObject({ kind: "available", collected: source.events.length, displayed: source.events.length, deferred: 0 });
          if (outcome.kind !== "available") throw Error("A genuine positive did not reach display");
          expect(outcome.range).toEqual({ start: 0, count: source.events.length, total: source.events.length, next: null });
          const expected = source.events.flatMap(event => ["move_path", "square_set"].map(component =>
            `${evidenceValueReceipt(event.evidence).payloadDigest}:${component}`)).sort();
          expect(received.items.map(item => `${item.evidenceRef!.evidenceDigest.slice(7)}:${item.component.id}`).sort()).toEqual(expected);
          const path = branchPath(f.run, f.run.activeCursor.branchId);
          for (const [index, item] of received.items.entries()) {
            expect(item.adapter).toEqual({ consumer: { id: "module.full_inspector", version: 2 }, projection: { id: setup.projection, version: 3 } });
            const rendered = target.querySelectorAll('[data-presented]')[index]!;
            if (item.component.id === "square_set") {
              expect(rendered.querySelector('.caption')?.textContent).toBe(presentedSentence(item));
              expect([...rendered.querySelectorAll('.chip')].map(chip => chip.textContent)).toEqual(item.component.operand.squares);
            } else if (item.component.id === "move_path") {
              const operand = item.component.operand, offset = path.length - 1 - operand.plies.length;
              expect(offset).toBeGreaterThanOrEqual(0);
              expect(operand.startFen).toBe(path[offset]!.fen);
              expect(operand.plies.map(ply => ply.uci)).toEqual(path.slice(offset + 1).map(node => node.moveUci));
              expect(operand.plies.map(ply => ply.san)).toEqual(path.slice(offset + 1).map(node => node.moveSan));
              expect(rendered.querySelector('.plies')?.getAttribute('aria-label')).toBe(presentedSentence(item));
              expect([...rendered.querySelectorAll('.san')].map(button => button.textContent)).toEqual(operand.plies.map(ply => ply.san));
            } else throw Error("Unexpected motif component");
          }
          const cost = modulePresentationBundleCost(received.items);
          for (const [unit, maximum] of Object.entries({ facts: 20, words: 400, marks: 20, arrows: 8 })) {
            expect(cost[unit as keyof typeof cost]).toBeLessThanOrEqual(maximum);
          }
        }
        expect(await f.stats()).toEqual({ acquisitions: [{ kind: "source", projection: route, context: { kind: "recorded_window" }, start: 0, collectionKey: null }], providerCalls: [] });
        const count = onQuery.mock.calls.length; await tick(); await tick(); expect(onQuery).toHaveBeenCalledTimes(count);
        expect(await f.httpStatuses()).toEqual(Array(count).fill(200));
        expect(JSON.stringify(await f.savedRun())).toBe(saved);
      });
    }
  }
  it.each([false, true])("keeps a later overload witness out of earlier root/interior demands (mirrored=%s)", async black => {
    const setup = RECORDED_SEQUENCE_POSITIVES.find(row => row.projection === "derived.tactic.overload_exploitation_observed")!;
    const f = await fixture({ run: recordedSequenceWindowFixture(setup, black), authenticatedRest: true });
    const saved = JSON.stringify(await f.savedRun()), path = branchPath(f.run, f.run.activeCursor.branchId);
    const onQuery = vi.fn(f.send), { target, instance } = await mountBrowser({ ...f.props, onQuery });
    const route = "derived.tactic.overload_exploitation_observed@3";
    await choose(target, route); await settled(target);
    expect(target.querySelectorAll('[data-presented]')).toHaveLength(2);
    for (const node of path.slice(0, 3)) {
      const next = await f.propsFor({ nodeId: node.id });
      instance.$set({ ...next, onQuery }); await tick(); await settled(target);
      expect(target.querySelectorAll('[data-presented]')).toHaveLength(0);
      const before = (await f.stats()).acquisitions.length;
      await choose(target, route); await settled(target);
      const request = onQuery.mock.calls.at(-1)![0], value = await onQuery.mock.results.at(-1)!.value;
      const result = parseInspectorQueryPage(value, { runId: f.run.id, request, fen: node.fen,
        requestedDigest: next.requestedDigest, finalDigest: next.finalDigest });
      expect(result).toMatchObject({ kind: "page", body: { kind: "source", projection: route,
        outcome: { kind: "missing_context", reason: "no_recorded_window" } }, items: [] });
      expect(target.textContent).toContain("continuation or second line needed for this source is not available here");
      expect(target.querySelectorAll('[data-presented]')).toHaveLength(0);
      expect((await f.stats()).acquisitions.length).toBe(before + 1);
    }
    expect((await f.stats()).providerCalls).toEqual([]);
    expect(JSON.stringify(await f.savedRun())).toBe(saved);
  });
  it("refuses an anonymous original-motif request before any collector work", async () => {
    const setup = RECORDED_SEQUENCE_POSITIVES.find(row => row.projection === "derived.tactic.deflection_observed")!;
    const f = await fixture({ run: recordedSequenceWindowFixture(setup), authenticatedRest: true });
    const request = { protocol: "inspector.query_page@1" as const, assistance: f.props.assistance,
      query: { branchId: f.props.branchId, nodeId: f.props.nodeId, decisionDigest: f.props.decisionDigest,
        view: { kind: "source" as const, projection: "derived.tactic.deflection_observed@3" as const, context: { kind: "recorded_window" as const }, start: 0, collectionKey: null } } };
    await f.sendAnonymous(request);
    expect(await f.httpStatuses()).toEqual([401]);
    expect(await f.stats()).toEqual({ acquisitions: [], providerCalls: [] });
  });
  it("opens only eight metadata topics and navigates all88 human labels without acquiring evidence", async () => {
    const f = await fixture(), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    expect(onQuery).toHaveBeenCalledTimes(1); expect(onQuery.mock.calls[0]![0].query.view).toEqual({ kind: "inventory", start: 0 });
    const seen: string[] = [];
    for (;;) {
      seen.push(...[...target.querySelectorAll("nav li button")].map(node => node.textContent!));
      if (button(target, "Next sources") === undefined) break;
      await click(target, "Next sources"); await settled(target);
    }
    expect(seen).toEqual(INSPECTOR_SOURCE_TOPICS.map(row => INSPECTOR_SOURCE_LABELS[row.projection]));
    expect(new Set(seen).size).toBe(89); expect(seen.every(text => !/@\d|sha256|_/u.test(text))).toBe(true);
    expect(await f.stats()).toEqual({ acquisitions: [], providerCalls: [] });
  });

  it("demands only the selected source, retains genuine output and does not refetch automatically", async () => {
    const f = await fixture(), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "rules.castling.reading.rights@1"); await settled(target);
    const stats = await f.stats(); expect(stats.acquisitions).toHaveLength(1); expect(stats.acquisitions[0]).toMatchObject({ kind: "source", projection: "rules.castling.reading.rights@1", context: { kind: "position" } });
    expect(target.querySelectorAll("[data-presented]").length).toBeGreaterThan(0);
    const count = onQuery.mock.calls.length; await tick(); await tick(); expect(onQuery).toHaveBeenCalledTimes(count);
    expect(stats.providerCalls).toEqual([]); expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(Object.values(INSPECTOR_DETAIL_SOURCES))("%s retains its genuine bounded-member door without source cropping", async projection => {
    const advanceCase = FOUNDATION_INSPECTOR_CASES.find(row => row[0] === "derived.pawn.consequence.backward_pawn_legal_advance@1")!;
    const f = await fixture(projection === advanceCase[0] ? { run: recordedSequenceWindowFixture({ fen: advanceCase[1], moves: [advanceCase[2]] }) } : {});
    const onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, projection); await settled(target);
    const door = [...target.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent?.startsWith("Read complete members of observation"));
    expect(door).toBeDefined(); door!.click(); await tick(); await settled(target);
    expect(onQuery.mock.calls.at(-1)![0].query.view).toMatchObject({ kind: "detail", projection, scope: { kind: "whole" }, start: 0 });
    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(target.textContent).toMatch(/Members|No members|complete member exceeds/u);
    await click(target, "Back to source"); await settled(target);
    expect(onQuery.mock.calls.at(-1)![0].query.view).toMatchObject({ kind: "source", projection, start: 0 });
  });

  it("requests square-control focus with the explicit side/mode/target and original source key", async () => {
    const f = await fixture(), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "rules.square.reading.control@1"); await settled(target);
    const square = labelControl(target, "Square")!, side = labelControl(target, "Side")!, mode = labelControl(target, "Control")!;
    square.value = "e4"; square.dispatchEvent(new Event("input", { bubbles: true })); await tick();
    await selectValue(side as HTMLSelectElement, "black");
    await selectValue(mode as HTMLSelectElement, "legal");
    await click(target, "Read control at the selected square"); await settled(target);
    expect(onQuery.mock.calls.at(-1)![0].query.view).toMatchObject({ kind: "detail", projection: "rules.square.reading.control@1", scope: { kind: "control_target", color: "black", mode: "legal", target: "e4" } });
    expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it("states an actual oversized control reading as deferred and exposes its original member door",async()=>{
    const f=await fixture(),onQuery=vi.fn(f.send),{target}=await mountBrowser({...f.props,onQuery});
    await choose(target,INSPECTOR_DETAIL_SOURCES.square_control);await settled(target);
    expect(target.textContent).toContain("too large to display whole here. It has not been cropped");
    expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
    expect(button(target,"Read complete members of observation 1")).toBeDefined();
    const count=onQuery.mock.calls.length;await tick();await tick();expect(onQuery).toHaveBeenCalledTimes(count);
  });

  it("does not fold two original equal saved packets into one visible occurrence", async () => {
    const f = await fixture({ reports: 2 }), { target } = await mountBrowser(f.props);
    await choose(target, "recorded.inspector.eval_packet@1"); await settled(target);
    expect(target.textContent).toContain("2 collected; 2 displayed");
    expect(target.querySelectorAll('[data-presented="fact_statement"]')).toHaveLength(2);
    const sentences = [...target.querySelectorAll('[data-presented="fact_statement"]')].map(node => node.textContent!);
    expect(new Set(sentences).size).toBe(2); expect(sentences.every(text => text.includes("20"))).toBe(true);
  });

  it("continues original report ordinals using the returned collection key without auto-fetching", async () => {
    const f = await fixture({ reports: 10 }), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "recorded.inspector.eval_packet@1"); await settled(target);
    expect(target.textContent).toContain("10 collected; 8 displayed");
    expect(target.querySelectorAll('[data-presented="fact_statement"]')).toHaveLength(8);
    const prior = onQuery.mock.calls.length;
    await tick(); expect(onQuery).toHaveBeenCalledTimes(prior);
    await click(target, "Next observations"); await settled(target);
    expect(onQuery.mock.calls.at(-1)![0].query.view).toMatchObject({ kind: "source", start: 8, collectionKey: expect.stringMatching(/^sha256:/u) });
    expect(target.textContent).toContain("10 collected; 2 displayed");
    expect(target.querySelectorAll('[data-presented="fact_statement"]')).toHaveLength(2);
    expect(button(target, "Next observations")).toBeUndefined(); expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it("keeps a whole ray reading intact and navigates complete detail members on demand", async () => {
    const f = await fixture(), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, INSPECTOR_DETAIL_SOURCES.rays); await settled(target);
    expect(target.textContent).toContain("1 collected; 1 displayed");
    await click(target, "Read complete members of observation 1"); await settled(target);
    expect(target.textContent).toMatch(/Members 1–8 of/u);
    const first = onQuery.mock.calls.at(-1)![0].query.view;
    expect(first.kind).toBe("detail");
    await click(target, "Next members"); await settled(target);
    expect(onQuery.mock.calls.at(-1)![0].query.view).toEqual({ ...first, start: 8 });
    expect(target.textContent).toContain("Members 9–14 of 14 selected"); expect(button(target, "Next members")).toBeUndefined(); expect(target.querySelector('[role="alert"]')).toBeNull();
    const calls = onQuery.mock.calls.length; await tick(); expect(onQuery).toHaveBeenCalledTimes(calls);
  });

  it.each(["protocol", "subject", "digest"] as const)("rejects an altered genuine %s response visibly without a retry loop", async fault => {
    const f = await fixture(), onQuery = vi.fn<Query>(async (body, signal) => {
      const value = await f.send(body, signal);
      if (body.query.view.kind !== "source") return value;
      const altered = json(value) as Record<string, unknown>;
      if (fault === "protocol") altered.protocol = "inspector.query_page@0";
      if (fault === "subject") altered.runId = "foreign-run";
      if (fault === "digest") altered.effectiveConfigDigest = `sha256:${"0".repeat(64)}`;
      return altered;
    });
    const { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "rules.castling.reading.rights@1"); await settled(target);
    expect(target.querySelector('[role="alert"]')?.textContent).toContain("could not be verified");
    expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
    expect(button(target, "Retry this request")).toBeDefined(); const calls = onQuery.mock.calls.length; await tick(); expect(onQuery).toHaveBeenCalledTimes(calls);
  });

  it.each(["source", "context", "horizon"] as const)("a changed %s retires the original pending response before it can render", async change => {
    const f = await fixture({ mate: change === "horizon" }), held = deferred<unknown>();
    let original: unknown, oldSignal: AbortSignal | undefined;
    const onQuery = vi.fn<Query>(async (body, signal) => {
      const response = await f.send(body, signal);
      if (body.query.view.kind === "source" && oldSignal === undefined) { original = response; oldSignal = signal; return held.promise; }
      return response;
    });
    const { target } = await mountBrowser({ ...f.props, onQuery });
    const projection = change === "horizon" ? "rules.tactic.consequence.forced_mate_after_move@1" : change === "context" ? "theory.shapes.firing@3" : "rules.tactic.reading.loose_piece@1";
    await choose(target, projection); await vi.waitFor(() => expect(oldSignal).toBeDefined());
    if (change === "source") await choose(target, "rules.tactic.reading.rook_on_seventh@1");
    else {
      const select = labelControl(target, change === "context" ? "Scope" : "Search bound")!;
      await selectValue(select as HTMLSelectElement, change === "context" ? "this line up to this position" : "2 attacking moves");
    }
    expect(oldSignal!.aborted).toBe(true); held.resolve(original); await tick(); await settled(target);
    if (change !== "source") expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
    expect(target.querySelector('[role="alert"]')).toBeNull();
    if(change!=="source"){
      await click(target,"Read this source");await settled(target);
      expect(onQuery.mock.calls.at(-1)![0].query.view).toMatchObject(change==="context"
        ? {kind:"source",context:{kind:"branch",throughNodeId:f.props.nodeId}}
        : {kind:"source",parameters:{kind:"forced_mate",maxAttackerMoves:2}});
      expect(target.querySelector('[role="alert"]')).toBeNull();
    }
  });

  it.each(["run", "node", "config"] as const)("a genuine %s subject change aborts and ignores an older completion", async change => {
    const f = await fixture(), held = deferred<unknown>(); let original: unknown, oldSignal: AbortSignal | undefined;
    const onQuery = vi.fn<Query>(async (body, signal) => {
      const response = await f.send(body, signal);
      if (body.query.view.kind === "source") { original = response; oldSignal = signal; return held.promise; }
      return response;
    });
    const { target, instance } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "rules.castling.reading.rights@1"); await vi.waitFor(() => expect(oldSignal).toBeDefined());
    const next = change === "run" ? (await fixture({ id: "different-browser-run" })).props
      : await f.propsFor(change === "node" ? { nodeId: f.run.nodes[0]!.id } : { assistance: requested("off") });
    instance.$set(next); await tick(); await vi.waitFor(() => expect(oldSignal!.aborted).toBe(true));
    held.resolve(original); await tick(); await settled(target);
    expect(target.querySelectorAll("[data-presented]")).toHaveLength(0); expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(target.querySelectorAll("nav li")).toHaveLength(8);
  });

  it("unmount aborts a real pending operation and ignores its eventual genuine completion", async () => {
    const f = await fixture(), held = deferred<unknown>(); let original: unknown, oldSignal: AbortSignal | undefined;
    const { target, instance } = await mountBrowser({ ...f.props, onQuery: async (body, signal) => {
      const value = await f.send(body, signal);
      if (body.query.view.kind === "source") { original = value; oldSignal = signal; return held.promise; }
      return value;
    } });
    await choose(target, "rules.castling.reading.rights@1"); await vi.waitFor(() => expect(oldSignal).toBeDefined());
    instance.$destroy(); expect(oldSignal!.aborted).toBe(true); held.resolve(original); await tick(); expect(target.textContent).toBe("");
  });

  it.each([0, 99])("keeps an actual sparse Explorer population (%s) distinct from absence without autoload", async total => {
    const f = await fixture({ corpusTotal: total }), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    expect((await f.stats()).providerCalls).toHaveLength(0); await choose(target, "derived.explorer.inspector_population@1"); await settled(target);
    expect(target.textContent).toContain(`(${total}; minimum 100)`); expect(target.textContent).not.toContain("found no matching");
    expect((await f.stats()).providerCalls).toHaveLength(1); expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
    const count = onQuery.mock.calls.length; await tick(); await tick(); expect(onQuery).toHaveBeenCalledTimes(count);
  });

  it("states actual model-source unavailability without inventing an empty chess finding", async () => {
    const f = await fixture(), onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
    await choose(target, "derived.maia.node_distribution@1"); await settled(target);
    expect(target.textContent).toContain("unavailable here. That is not a finding about the position");
    expect(target.textContent).not.toContain("found no matching"); expect(target.querySelector('[role="alert"]')).toBeNull();
    const count = onQuery.mock.calls.length; await tick(); expect(onQuery).toHaveBeenCalledTimes(count);
  });

  it.each(["settled", "pending"] as const)("D3996: no-peer comparison retires a %s original source without painting it under another heading", async state => {
    const f = await fixture(), held = deferred<unknown>(); let original:unknown, oldSignal:AbortSignal|undefined;
    const onQuery=vi.fn<Query>(async(body,signal)=>{
      const response=await f.send(body,signal);
      if(body.query.view.kind==="source"){original=response;oldSignal=signal;if(state==="pending")return held.promise;}
      return response;
    });
    const {target}=await mountBrowser({...f.props,peers:[],onQuery});
    await choose(target,"rules.phase.reading@2");
    if(state==="settled"){await settled(target);expect(target.querySelectorAll("[data-presented]").length).toBeGreaterThan(0);}
    else await vi.waitFor(()=>expect(oldSignal).toBeDefined());
    const calls=onQuery.mock.calls.length;
    // Both topics occupy the same real metadata page: no inventory reset masks retirement.
    await click(target,INSPECTOR_SOURCE_LABELS["derived.compare.structure_delta@2"]);
    expect(oldSignal!.aborted).toBe(true);expect(onQuery).toHaveBeenCalledTimes(calls);
    expect(target.textContent).toContain("No other recorded line is available to compare");
    expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
    if(state==="pending"){held.resolve(original);await tick();await tick();}
    expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it("D4000: a keyboard-owned retry leaves focus on the current result heading, not the document body",async()=>{
    const f=await fixture();let fail=true;
    const {target}=await mountBrowser({...f.props,onQuery:async(body,signal)=>{
      if(body.query.view.kind==="source"&&fail){fail=false;throw new Error("mechanical transport failure");}
      return f.send(body,signal);
    }});
    await choose(target,"rules.castling.reading.rights@1");await settled(target);
    const retry=button(target,"Retry this request")!;retry.focus();retry.click();await tick();await settled(target);
    expect(target.querySelectorAll("[data-presented]").length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(target.querySelector("h4"));
  });

  it.each(["move","unmount"] as const)("D4000: late retry completion does not steal deliberately moved focus (%s)",async action=>{
    const f=await fixture(),held=deferred<unknown>();let fail=true,original:unknown,retained:AbortSignal|undefined;
    const {target,instance}=await mountBrowser({...f.props,onQuery:async(body,signal)=>{
      if(body.query.view.kind!=="source")return f.send(body,signal);
      if(fail){fail=false;throw new Error("mechanical transport failure");}
      original=await f.send(body,signal);retained=signal;return held.promise;
    }});
    await choose(target,"rules.castling.reading.rights@1");await settled(target);
    const retry=button(target,"Retry this request")!;retry.focus();retry.click();await tick();await vi.waitFor(()=>expect(retained).toBeDefined());
    const other=document.createElement("button");other.textContent="Other intentional keyboard target";document.body.append(other);other.focus();
    if(action==="unmount"){instance.$destroy();expect(retained!.aborted).toBe(true);}
    held.resolve(original);await tick();if(action==="move")await settled(target);
    expect(document.activeElement).toBe(other);
  });
});


// D4167: each current choice executes the genuine source, cookie REST and strict receiver.
describe("current structural source choices", () => {
  const cases = [
    ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7"],
    ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
    ["derived.structural.event.pawn_file_group@1", "4k3/8/P6p/8/P6p/8/P6p/4K3 w - - 0 1", "a6a7"],
    ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
    ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
    ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
    ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ] as const;
  for (const [route, fen, move] of cases) for (const black of [false, true]) {
    it(`delivers complete ${route} from real selected source, mirrored=${black}`, async () => {
      const run = recordedSequenceWindowFixture({ fen, moves: [move] }, black, `current-edge-${route}-${black}`);
      const f = await fixture({ run, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
      const path = branchPath(f.run, f.run.activeCursor.branchId);
      const originals = collectInspectorLocalEdge(route, { beforeFen: path[0]!.fen, moveUci: path[1]!.moveUci!, afterFen: path[1]!.fen }).values;
      expect(originals.length).toBeGreaterThan(0);
      const onQuery = vi.fn(f.send), { target, instance } = await mountBrowser({ ...f.props, onQuery });
      await choose(target, route); await settled(target);
      const seen: string[] = [];
      for (;;) {
        const request = onQuery.mock.calls.at(-1)![0];
        const page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value, { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
        if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Current structural source failed real selected delivery");
        const outcome = page.body.outcome;
        expect(outcome.collected).toBe(originals.length); expect(outcome.deferred).toBe(0);
        expect(target.querySelectorAll("[data-presented]")).toHaveLength(page.items.length);
        for (const [index, item] of page.items.entries()) {
          if (item.component.id !== "fact_statement") throw Error("Unexpected current-source board paint");
          const original = originals[outcome.range.start + index]!;
          if (!("san" in item.component.operand.operands)) throw Error("Current readout lost SAN");
          const { san, ...payload } = item.component.operand.operands;
          expect(typeof san).toBe("string"); expect(payload).toEqual(original.payload);
          expect(item.evidenceRef!.evidenceDigest).toBe(`sha256:${evidenceValueReceipt(original).payloadDigest}`);
          expect(target.querySelectorAll("[data-presented]")[index]!.textContent).toContain(presentedSentence(item));
          seen.push(item.evidenceRef!.evidenceDigest);
        }
        expect(target.textContent).not.toMatch(/rules\.|derived\.|sha256:|undefined|NaN/u);
        expect(target.querySelector('[role="alert"]')).toBeNull();
        const cost = modulePresentationBundleCost(page.items);
        expect(cost.words).toBeLessThanOrEqual(400); expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
        if (outcome.range.next === null) break;
        await click(target, "Next observations"); await settled(target);
      }
      expect(seen).toEqual(originals.map(value => `sha256:${evidenceValueReceipt(value).payloadDigest}`));
      const root = await f.propsFor({ nodeId: path[0]!.id }); instance.$set({ ...root, onQuery }); await tick();
      expect(target.querySelectorAll("[data-presented]")).toHaveLength(0);
      await vi.waitFor(() => expect(target.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8));
      await choose(target, route); await settled(target);
      const request = onQuery.mock.calls.at(-1)![0], page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
        { runId: f.run.id, request, fen: root.fen, requestedDigest: root.requestedDigest, finalDigest: root.finalDigest });
      if (page.kind !== "page" || page.body.kind !== "source") throw Error("Root source failed");
      expect(page.body.outcome).toEqual({ kind: "missing_context", reason: "no_incoming_edge" });
      expect(page.items).toEqual([]);
      expect((await f.stats()).providerCalls).toEqual([]);
      expect((await f.httpStatuses()).every(status => status === 200)).toBe(true);
      expect(JSON.stringify(await f.savedRun())).toBe(saved);
    });
  }
});

for (const black of [false, true]) it(`D4167 keeps a genuine dense same-source page whole with honest deferral, mirrored=${black}`, async () => {
  const run = recordedSequenceWindowFixture({ fen: "6q1/5Pp1/4p1pk/3p2p1/2p3p1/1p4p1/p5p1/K7 w - - 0 1", moves: ["f7g8q"] }, black, `current-ray-budget-${black}`);
  const f = await fixture({ run, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
  const path = branchPath(f.run, f.run.activeCursor.branchId), route = "rules.transition.event.slider_ray@2";
  const originals = collectInspectorLocalEdge(route, { beforeFen: path[0]!.fen, moveUci: path[1]!.moveUci!, afterFen: path[1]!.fen }).values;
  expect(originals.length).toBeGreaterThan(8);
  const onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery }); await choose(target, route); await settled(target);
  const ordinals: number[] = []; let deferred = 0;
  for (;;) {
    const request = onQuery.mock.calls.at(-1)![0];
    const page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value, { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
    if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Dense real source was refused");
    const outcome = page.body.outcome; expect(outcome.collected).toBe(originals.length);
    let presented = 0;
    for (const [index, fact] of outcome.facts.entries()) {
      const ordinal = outcome.range.start + index; ordinals.push(ordinal);
      if (fact.disposition === "deferred") {
        expect(fact.exceeded).toContain("words"); deferred++;
        expect(target.textContent).toContain(`Observation ${ordinal + 1} is too large to display whole here. It has not been cropped.`);
      } else {
        const item = page.items[presented++]!;
        expect(item.evidenceRef!.evidenceDigest).toBe(`sha256:${evidenceValueReceipt(originals[ordinal]!).payloadDigest}`);
        expect(target.querySelectorAll("[data-presented]")[presented - 1]!.textContent).toContain(presentedSentence(item));
      }
    }
    expect(presented).toBe(outcome.displayed); expect(page.items).toHaveLength(presented);
    expect(modulePresentationBundleCost(page.items).words).toBeLessThanOrEqual(400);
    if (outcome.range.next === null) break;
    await click(target, "Next observations"); await settled(target);
  }
  // The original page still contains all source ordinals, but some fit only when shown first.
  // Exercise the real new button, not a caller-invented range or a larger budget.
  await click(target, "Read this source"); await settled(target);
  const initialRequest = onQuery.mock.calls.at(-1)![0];
  const initialPage = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
    { runId: f.run.id, request: initialRequest, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
  if (initialPage.kind !== "page" || initialPage.body.kind !== "source" || initialPage.body.outcome.kind !== "available") throw Error("Original dense page was lost");
  const first = initialPage.body.outcome, index = first.facts.findIndex(fact => fact.disposition === "deferred");
  expect(index).toBeGreaterThan(0);
  const ordinal = first.range.start + index;
  await click(target, `Show observation ${ordinal + 1} first`); await settled(target);
  const reopenedRequest = onQuery.mock.calls.at(-1)![0];
  expect(reopenedRequest.query.view).toMatchObject({ kind: "source", projection: route, context: { kind: "incoming_edge" }, start: ordinal, collectionKey: first.collectionKey });
  const reopened = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
    { runId: f.run.id, request: reopenedRequest, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
  if (reopened.kind !== "page" || reopened.body.kind !== "source" || reopened.body.outcome.kind !== "available") throw Error("Deferred observation could not be read first");
  expect(reopened.body.outcome.range.start).toBe(ordinal);
  expect(reopened.body.outcome.collectionKey).toBe(first.collectionKey);
  expect(reopened.body.outcome.facts[0]!.disposition).toBe("presented");
  const originalFact = reopened.items[0]!;
  expect(originalFact.evidenceRef!.evidenceDigest).toBe(`sha256:${evidenceValueReceipt(originals[ordinal]!).payloadDigest}`);
  if (originalFact.component.id !== "fact_statement" || !("san" in originalFact.component.operand.operands)) throw Error("Original whole source lost");
  const { san: _san, ...whole } = originalFact.component.operand.operands;
  expect(whole).toEqual(originals[ordinal]!.payload);
  expect(target.querySelector("[data-presented]")!.textContent).toContain(presentedSentence(originalFact));
  expect(modulePresentationBundleCost(reopened.items).words).toBeLessThanOrEqual(400);
  expect(button(target, `Show observation ${ordinal + 1} first`)).toBeUndefined();
  expect(deferred).toBeGreaterThan(0);
  expect(ordinals).toEqual(originals.map((_, i) => i));
  expect((await f.stats()).providerCalls).toEqual([]);
  expect(JSON.stringify(await f.savedRun())).toBe(saved);
});


for (const black of [false, true]) it(`D4167 distinguishes complete occupied-stop change from blocked-opposition no-witness, mirrored=${black}`, async () => {
  const run = recordedSequenceWindowFixture({ fen: "7k/8/2p1p3/3B4/3P4/8/8/K7 b - - 0 1", moves: ["e6d5"] }, black, `backward-stop-${black}`);
  const f = await fixture({ run, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
  const onQuery = vi.fn(f.send), { target, instance } = await mountBrowser({ ...f.props, onQuery });
  await choose(target, "rules.structural.event.backward_pawn@2"); await settled(target);
  const request = onQuery.mock.calls.at(-1)![0], page = parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value,
    { runId: f.run.id, request, fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
  if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw Error("Occupied stop source failed actual delivery");
  const fact = page.items.find(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "inspector.backward_pawn_change@1"
    && item.component.operand.operands.subject.color === (black ? "black" : "white"));
  if (fact?.component.id !== "fact_statement" || fact.component.operand.rendererId !== "inspector.backward_pawn_change@1") throw Error("Exact stationary pawn lost");
  expect(fact.component.operand.operands).toMatchObject({ sign: "membership_changed", before: { stopOccupancy: { kind: "own", piece: { color: black ? "black" : "white", role: "bishop" } } },
    after: { stopOccupancy: { kind: "enemy", piece: { color: black ? "white" : "black", role: "pawn" } } } });
  expect(target.textContent).toContain(presentedSentence(fact));
  expect(JSON.stringify(await f.savedRun())).toBe(saved); expect((await f.stats()).providerCalls).toEqual([]);

  const blocked = recordedSequenceWindowFixture({ fen: "r7/8/8/4k3/8/4p3/8/4K3 b - - 0 1", moves: ["a8a7"] }, black, `blocked-opposition-${black}`);
  const g = await fixture({ run: blocked, authenticatedRest: true }), nextQuery = vi.fn(g.send);
  instance.$set({ ...g.props, onQuery: nextQuery }); await tick();
  await vi.waitFor(() => expect(target.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8));
  await choose(target, "rules.structural.event.king_opposition@2"); await settled(target);
  const next = nextQuery.mock.calls.at(-1)![0], negative = parseInspectorQueryPage(await nextQuery.mock.results.at(-1)!.value,
    { runId: g.run.id, request: next, fen: g.props.fen, requestedDigest: g.props.requestedDigest, finalDigest: g.props.finalDigest });
  if (negative.kind !== "page" || negative.body.kind !== "source") throw Error("Blocked source did not settle");
  expect(negative.body.outcome).toEqual({ kind: "no_witness" }); expect(negative.items).toEqual([]);
  expect(target.textContent).toContain("found no matching observation");
  expect(target.querySelectorAll("[data-presented]")).toHaveLength(0); expect((await g.stats()).providerCalls).toEqual([]);
});

// Current snapshots remain one full source each; expanded members use their own typed detail pages.
describe("complete selected foundation snapshots and calculated advance", () => {

  for (const [route, fen, move, detailKind] of FOUNDATION_INSPECTOR_CASES) for (const black of [false, true]) {
    it(`delivers whole ${route} and all emitted detail continuations, mirrored=${black}`, async () => {
      const run = recordedSequenceWindowFixture({ fen, moves: [move] }, black, `current-snapshot-${route}-${black}`);
      const f = await fixture({ run, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
      const path = branchPath(f.run, f.run.activeCursor.branchId), last = path.at(-1)!;
      const originals = route === "derived.pawn.consequence.backward_pawn_legal_advance@1"
        ? collectInspectorLocalEdge(route, { beforeFen: path[0]!.fen, moveUci: last.moveUci!, afterFen: last.fen }).values
        : collectInspectorLocalPosition(route, last.fen);
      expect(originals).toHaveLength(1);
      const onQuery = vi.fn(f.send), { target } = await mountBrowser({ ...f.props, onQuery });
      const received = async () => parseInspectorQueryPage(await onQuery.mock.results.at(-1)!.value, { runId: f.run.id,
        request: onQuery.mock.calls.at(-1)![0], fen: f.props.fen, requestedDigest: f.props.requestedDigest, finalDigest: f.props.finalDigest });
      await choose(target, route); await settled(target);
      const first = await received();
      if (first.kind !== "page" || first.body.kind !== "source" || first.body.outcome.kind !== "available") throw Error("Current whole snapshot was not delivered");
      expect(first.body.outcome.collected).toBe(1); expect(first.body.outcome.displayed).toBe(1); expect(first.body.outcome.deferred).toBe(0);
      expect(first.items).toHaveLength(1);
      const item = first.items[0]!;
      if (item.component.id !== "fact_statement") throw Error("Snapshot unexpectedly painted the board");
      expect(item.component.operand.operands).toEqual(originals[0]!.payload);
      expect(item.evidenceRef!.evidenceDigest).toBe(`sha256:${evidenceValueReceipt(originals[0]!).payloadDigest}`);
      expect(target.textContent).toContain(presentedSentence(item));
      if (detailKind !== null) {
        const expected = foundationDetailMembers(detailKind, originals[0]!.payload as never), seen: FoundationDetailMember[] = [];
        await click(target, "Read complete members of observation 1"); await settled(target);
        for (;;) {
          const detail = await received();
          if (detail.kind !== "page" || detail.body.kind !== "detail") throw Error("Complete member page failed real delivery");
          expect(detail.body.sourceKey).toBe(first.body.outcome.facts[0]!.sourceKey);
          expect(detail.body.context).toEqual(first.body.context);
          expect(detail.items).toHaveLength(1);
          const memberItem = detail.items[0]!;
          if (memberItem.component.id !== "fact_statement") throw Error("Text-only detail painted a board");
          const payload = parseInspectorDetailPayload(detailKind, memberItem.component.operand.operands);
          expect(payload.context).toEqual(expected.context);
          expect(payload.fullSourceTotal).toBe(expected.members.length);
          expect(payload.range.start).toBe(seen.length);
          for (const { ordinal, sourceOrdinal, ...member } of payload.members) {
            expect(ordinal).toBe(seen.length); expect(sourceOrdinal).toBe(seen.length);
            seen.push(member as FoundationDetailMember);
          }
          expect(target.textContent).toContain(presentedSentence(memberItem));
          const cost = modulePresentationBundleCost(detail.items);
          expect(cost.words).toBeLessThanOrEqual(400); expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
          expect(target.textContent).not.toMatch(/rules\.|derived\.|sha256:|future_file|undefined|NaN/u);
          expect(target.querySelector('[role="alert"]')).toBeNull();
          if (detail.body.range.next === null) break;
          await click(target, "Next members"); await settled(target);
        }
        expect(seen).toEqual(expected.members);
        await click(target, "Back to source"); await settled(target);
        const back = await received();
        if (back.kind !== "page" || back.body.kind !== "source" || back.body.outcome.kind !== "available") throw Error("Original source could not be reopened");
        expect(back.items[0]!.evidenceRef).toEqual(item.evidenceRef);
      }
      expect((await f.stats()).providerCalls).toEqual([]);
      expect((await f.httpStatuses()).every(status => status === 200)).toBe(true);
      expect(JSON.stringify(await f.savedRun())).toBe(saved);
    });
  }
});
