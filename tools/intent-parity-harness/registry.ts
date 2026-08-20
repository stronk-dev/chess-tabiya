// DISPOSABLE intent-parity registry — D640. It reports protected-design debt; it cannot amend it.

export interface IntentDebt {
  readonly ruling: string;
  readonly home: string;
  readonly staleText: string;
  readonly requiredAmendment: string;
  readonly preserveOpen: string;
}

export const INTENT_DEBT = Object.freeze([
  {
    ruling: "O13 Choice C",
    home: "design/02-product-shape.md; design/03-product-breadth.md",
    staleText: "Deployment axis — SETTLED … hosted multi-user; Platform — OPEN; B8 deployment shipped",
    requiredAmendment: "supported self-hosted appliance plus hosted deployment, web/PWA floor, offline knowledge/tablebase, signed multi-arch images, reverse proxy, data/rights/update/backup/accessibility contract",
    preserveOpen: "source model/monetization and participant accessibility acceptance",
  },
  {
    ruling: "O1 compiled evidence authority",
    home: "design/04-content-architecture.md; design/05-in-run-experience.md",
    staleText: "producer existence and a generic ladder/list stand in for a versioned projection/consumer contract",
    requiredAmendment: "producer and module declarations primary; derived joins; predicate/reading/event projections; declared consumer/timing/role/session/form/answer-distance dispositions; explicit orphan states",
    preserveOpen: "exact learner-family admission remains O2/R3/R7",
  },
  {
    ruling: "O2/O3 semantic eligibility and local selection",
    home: "design/05-in-run-experience.md; design/03-product-breadth.md",
    staleText: "rung 0 cannot be wrong; B9/B10 are described as fully shipped learner capabilities",
    requiredAmendment: "scope exactness separately from label semantics; typed operands/squares/sign/grounding/confidence/abstention; eligibility before deterministic local selection and budgets",
    preserveOpen: "20 percent/two-fact defaults and exact admitted families remain candidate evidence",
  },
  {
    ruling: "O4 workflow presets and configuration",
    home: "design/05-in-run-experience.md; design/03-product-breadth.md",
    staleText: "ordinary UX exposes selectable evidence layers and per-context raw AssistanceConfig",
    requiredAmendment: "workflow identity distinct from technical profiles; named intent presets/modules; requested preset intersected with workflow ceiling, honesty/access and availability; advanced/raw controls remain secondary",
    preserveOpen: "participant-validated names, budgets and default preset per Review/Just Play/drill/Analyze; campaign/professional defaults",
  },
  {
    ruling: "R5/O4 LLM boundary",
    home: "design/05-in-run-experience.md; design/03-product-breadth.md",
    staleText: "LLM is the mouth and a typed prompt/check is implied sufficient",
    requiredAmendment: "deterministic renderer is normative and provider-off fallback; LLM is optional post-selection style only; never selects, grades, adds theory or raises assistance; citations/provenance survive outside model output",
    preserveOpen: "whether any provider wording improves learner comprehension",
  },
] as const satisfies readonly IntentDebt[]);

