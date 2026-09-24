# Evidence presentation

`rfc/evidence-presentation.md` — the component vocabulary between a typed fact and a pixel.
Checkpoints P, A and B landed 2026-09-24. Runtime: `packages/runtime/src/presentation-contract.ts`
(components, parsers, seals, wire, registry) with its adapter groups; client:
`apps/web/src/lib/evidence/`.

## Components

`COMPONENT_DECLARATIONS` declares the fourteen closed components — `distribution`,
`outcome_split`, `magnitude`, `magnitude_trail`, `square_set`, `move_path`, `relation_overlay`,
`count_with_denominator`, `citation`, `enum_state`, `claim`, `fact_statement`, `abstention`,
`structured_document` — each with its operand type, convention obligation, empty behaviour, forms,
equivalent-sentence renderer and theme tokens. Every one ships a strict runtime parser, a sentence
renderer (`componentValueSentence`) and a Svelte component under `apps/web/src/lib/evidence/components/`
dispatched by `PresentedEvidence.svelte`.

- Numbers carry their `ConventionReceipt` (search execution, recorded search, exact tablebase, human
  model, human population or a registered declared convention); the attribution renders inside the
  component root. Shares are computed by the component from counts; no operand carries a percentage.
- `magnitude_trail` draws an SVG whose pixels come only from a registered `MAGNITUDE_SCALE_POLICIES`
  row, with a keyboard-reachable point list.
- `square_set` carries its caption as a sealed `fact_statement` operand (recomputed on parse);
  squares are deduplicated at construction.
- `relation_overlay` edges must join retained nodes; its sentence names only those endpoints.
- `outcome_split` and `count_with_denominator` draw no bar when the floor is unmet or the total is
  zero, and the withheld state carries `data-abstention`.
- `structured_document` is coupled to a literal schema in `STRUCTURED_DOCUMENT_SCHEMAS` and is
  constructed only for author/operator consumers.

## The sealed path

```text
ConsumerEvidenceView → exact consumer × projection adapter (one component or a named composition)
  → process-sealed PresentedEvidenceItem → presentation.receipt@1 → parsePresentationReceipt
  → client-local seal → PresentedEvidence.svelte
```

Adapters live in four places, all keyed by exact `consumer@version × projection@version`: the
Checkpoint-A rows in `presentation-contract.ts`, and three group files that receive the registry's
construction kit by injection (no import cycle): `presentation-play-adapters.ts` (play seats),
`presentation-inspector-adapters.ts` (Full Inspector, Post-commit Nudge, Review Map) and
`presentation-consumer-adapters.ts` (the ordinary, Inspector and author/operator consumers). Fact
renderers are fixed templates over strict operand schemas (`presentation-schema.ts`); every sentence
passes `assertPresentationText`.

## Checkpoint P (manifest repairs)

Opponent selection and the repertoire scan are machine-only operations; `review.story ×
derived.story.rank@1` is a selection-only binding; `pack.authored.phase@1` is `{phase}`;
`rules.structural.reading.named_structure@2` retains its matched-witness `squares`; the consequence
payload is the terminal/non-terminal union; the Explorer abstention reasons are the exported
`CorpusResult` tuple; and `derived.citation.attribution@1` joins one evidence-reference resolution
to exactly its source item and the versioned source-attribution registry (missing metadata abstains).

## Instruments

- `make label-sweep` — raw enum/id mustaches, de-underscoring and `JSON.stringify` in markup, set-equal
  to an empty allowlist. The label registry is `apps/web/src/lib/labels/`.
- `make component-coverage` — every presented consumer × projection pair (ordinary, Inspector,
  author/operator and the learner-module seats) has exactly one adapter whose forms equal the
  binding's forms; orphan adapters and adapters on machine-only pairs fail.
- `make component-theme-sweep` — literal, named, system and `color-mix` colours over the component
  tree, with a non-empty keyword self-check.
- `apps/web/src/lib/evidence/components.test.ts` — the zero/one/many/withheld/unavailable matrix of
  all fourteen components.

All three commands are prerequisites of `make verify-software`.
