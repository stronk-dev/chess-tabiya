// Intent-parity contract — D651. Protected design remains owner/Claude-authored.

export const INTENT_CONTRACTS = Object.freeze([
  {
    id: "appliance-floor", ruling: "O13 / D649",
    assertions: [
      { path: "design/02-product-shape.md", text: "A reproducible self-hostable appliance is a core supported topology" },
      { path: "design/02-product-shape.md", text: "no core learner journey may depend on a hosted secret or provider" },
      { path: "design/02-product-shape.md", text: "proof is established by the owner's own devices and use, not by recruited participant studies" },
      { path: "design/03-product-breadth.md", text: "Corrected 2026-08-21 against the O13 Choice-C floor" },
      { path: "planning/exploration/gates.md", text: "The 1.0 platform floor is not met" },
    ],
    preservedOpen: { path: "design/02-product-shape.md", text: "Deliberately preserved as open by O13: source model and monetization" },
  },
  {
    id: "compiled-evidence-authority", ruling: "O1",
    assertions: [
      { path: "design/03-product-breadth.md", text: "versioned compiled producer→evidence→consumer manifest" },
      { path: "design/03-product-breadth.md", text: "consumer, timing, role, session, form and answer-distance constraints" },
      { path: "design/04-content-architecture.md", text: "its **grounding, exactness and abstention** contract" },
      { path: "design/04-content-architecture.md", text: "distinct semantic identities and versions" },
      { path: "design/05-in-run-experience.md", text: "Which producer serves which consumer, in which form, at which time is O1's manifest question" },
    ],
    preservedOpen: { path: "design/03-product-breadth.md", text: "Exact learner-facing detector families, preset names, budgets and defaults are deliberately not chosen here" },
  },
  {
    id: "eligibility-before-selection", ruling: "O2 / O3",
    assertions: [
      { path: "design/05-in-run-experience.md", text: "semantic eligibility is a separate gate from the source's rung" },
      { path: "design/05-in-run-experience.md", text: "Eligibility precedes selection" },
      { path: "design/05-in-run-experience.md", text: "Local distinctiveness/rarity may select among already-eligible events but cannot establish valence, causality, importance or a move grade" },
      { path: "design/05-in-run-experience.md", text: "The measured 20%/two-fact values are candidates, not frozen constants" },
      { path: "planning/exploration/gates.md", text: "zero complete families are unconditionally admitted as learner events" },
    ],
    preservedOpen: { path: "design/05-in-run-experience.md", text: "exact defaults remain R3's" },
  },
  {
    id: "workflow-preset-composition", ruling: "O4",
    assertions: [
      { path: "design/03-product-breadth.md", text: "advanced analysis inspector inventory" },
      { path: "design/03-product-breadth.md", text: "named evidence modules and opinionated presets" },
      { path: "design/05-in-run-experience.md", text: "Workflow identity and the requested preset are stored separately from technical source preferences" },
      { path: "design/05-in-run-experience.md", text: "requested preset ∩ workflow/session ceiling ∩ honesty/access ∩ source availability" },
      { path: "design/05-in-run-experience.md", text: "proactive blunder prevention belongs only to an explicit Support preset and is not the rehearsal default" },
      { path: "planning/exploration/gates.md", text: "only 2/6 intended workflows bind directly" },
    ],
    preservedOpen: { path: "design/05-in-run-experience.md", text: "Exact preset names, budgets, defaults and Review Map moments are deliberately not chosen here" },
  },
  {
    id: "deterministic-renderer-boundary", ruling: "R5 / O1",
    assertions: [
      { path: "design/05-in-run-experience.md", text: "Deterministic rendering is normative" },
      { path: "design/05-in-run-experience.md", text: "The LLM receives **only selected evidence**" },
      { path: "design/05-in-run-experience.md", text: "never selects evidence, grades moves, adds theory, chooses a rung or preset, or raises assistance" },
      { path: "design/05-in-run-experience.md", text: "Each provider/model version must pass a conformance set or fall back to deterministic rendering" },
      { path: "design/03-product-breadth.md", text: "LLM wording is never a layer of chess truth and never selects or grades evidence" },
    ],
  },
  {
    id: "gate-f-content-hold", ruling: "D560 / Gate F",
    assertions: [
      { path: "design/04-content-architecture.md", text: "The D560 scale-content hold remains active" },
      { path: "design/04-content-architecture.md", text: "a dependency-aware migration dry-run" },
      { path: "design/04-content-architecture.md", text: "Adding a producer does **not** require rewriting unrelated packs" },
      { path: "planning/platform-alignment/plan.md", text: "Until Gate F below passes, authored work is limited to disposable/sacrificial pilot packs" },
    ],
    preservedOpen: { path: "design/04-content-architecture.md", text: "the 1.0 theory source and the stable primitive set" },
  },
]);

export function renderIntentParityReport() {
  return [
    "# D651 protected-intent parity contract", "",
    "This file is byte-checked by the D651 harness; the living intent remains owner/Claude-authored.", "",
    "| contract | ruling | required assertions | preserved-open assertion |",
    "|---|---|---:|---|",
    ...INTENT_CONTRACTS.map((contract) => `| ${contract.id} | ${contract.ruling} | ${contract.assertions.length} | ${contract.preservedOpen?.path ?? "—"} |`),
    "",
  ].join("\n");
}
