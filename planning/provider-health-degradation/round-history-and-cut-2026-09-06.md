# Provider health — round history, and the 2026-09-06 cut

**What this file is.** The home for material removed from `rfc/provider-health-degradation.md`
when it was cut from 1,666 lines to its blocking obligation on 2026-09-06. Nothing here was
deleted; it was moved. This file is the index and the record of *why* each piece left the RFC.

## Why the cut happened

Measured 2026-09-06: ten RFCs hold back 654 of 1,293 blocked ledger items, and this one alone
carries **75**. The owner accepted Codex's diagnosis — *"some RFCs have become enormous shadow
implementations… the process is optimizing for increasingly elaborate contract harnesses while
production milestones stay still."* The same ruling was already applied to
`shared-resource-register-bootstrap.md` ([[D3034]]), which was sent back from 1,330 lines to its
forty-line core.

**The measurement that decided the shape of this cut.** All 75 items carrying
`blocker: "rfc:provider-health-degradation.md"` in `planning/work-state.json` are **defect rows
raised against this RFC's own author model** — twelve review rounds against a TypeScript harness
under `tools/d*-provider-health-*/` (5,446 lines across 22 directories). Not one of the 75 is a
downstream product feature waiting on a published contract. The document was being reviewed
against a simulacrum of itself, and each round produced five to nine new rows, each of which then
counted as an item this RFC blocks. Twelve rounds produced sixty new blocked rows and zero shipped
bytes.

That is the loop the cut ends. The RFC now states a contract and names the implementation as its
proof. The harness stays on disk as retained exploration evidence — the `make provider-health-*`
targets and their enrolment in `verify-governance` ([[D2761]]) are untouched — but it is **no
longer the RFC's acceptance authority**, and a thirteenth round against it is not a prerequisite
for anything.

## What moved out of the RFC, and where each piece went

| cut material | RFC lines (pre-cut) | home |
|---|---|---|
| Twelve `Nth fresh independent return` / `Nth author repair` sections | 766–1216 (451 lines) | the twenty-one dated review and repair files already in this directory, indexed below |
| `## Independent-review routing` table (57 finding→repair rows) | 1516–1577 (62 lines) | this file, §Routing disposition |
| Round-by-round `## Changelog` (fourteen entries) | 1578–1659 (82 lines) | the same dated files; the RFC keeps three entries |
| Acceptance criteria 30–51 (each pinned to a harness defect id) | ~90 lines | this file, §Author-model criteria |
| Durable opponent failure/recovery: events, route, idempotency, effective-policy projection, run-schema lane 0.26 | §10 tail, rollout, criteria 10/28, plan item 12 | **`rfc/opponent-recovery-journey.md`** (new successor stub), which carries [[D1914]], [[D2582]], [[D2760]], [[D2764]], [[D2820]], [[D2821]], [[D2822]], [[D2824]] |
| Provider-exchange type re-declaration in §4 (`ProviderStageSettlement` narrative, request/result maps, digest constructors) | ~40 lines | `rfc/provider-exchange-and-execution.md`, which already owns them — [[D2578]] said so and the cut enforces it |
| Staged two-checkpoint dependency machinery ([[D2364]]) | ~15 lines | dissolved: with the run-schema lane gone the RFC lands in **one** checkpoint, so there is no second checkpoint for bot policy to wait behind |
| Four-phase, sixteen-item implementation plan | 1217–1273 (57 lines) | compressed to three phases in the RFC |

## Routing disposition

The pre-cut routing table mapped 57 findings to the section that repaired them. It is superseded by
two facts:

1. **Findings [[D1910]]–[[D1915]], [[D2362]], [[D2412]]–[[D2417]], [[D2575]]–[[D2583]] are contract
   findings.** Their repairs are normative text in §§1–10 of the cut RFC and are carried by its
   acceptance criteria. The RFC keeps a criterion→row map instead of a routing table.
2. **Findings [[D2753]]–[[D2764]], [[D2815]]–[[D2827]], [[D2846]]–[[D2851]], [[D2857]]–[[D2859]],
   [[D2869]]–[[D2873]], [[D2912]]–[[D2919]], [[D2942]]–[[D2949]], [[D2966]]–[[D2971]] are defects
   in the author model, not in the contract.** In every case the RFC prose already required the
   behaviour the model failed to implement — §6 has said `acquire`/`renew`/`settle`/`expire`, the
   5/15/60 sequence, the 60-second Lichess floor and a longer valid `Retry-After` since the fourth
   repair, and [[D2818]], [[D2848]], [[D2919]], [[D2968]] and [[D2969]] are four separate rounds of
   the harness not doing it. These rows close against the **implementation**, under the cut RFC's
   criteria, and not against a thirteenth harness round.

[[D2761]] is already discharged and stays discharged: the review target remains enrolled in
`verify-governance`.

## Author-model criteria

Pre-cut criteria 30–51 each opened with a defect id and constrained the author model's exports,
private fields and construction order. Their contract content survives in criteria 1–22 of the cut
RFC; what does not survive is the requirement that a *model* demonstrate it. Concretely:

- 30/40 (closed configuration parsing, distinct derived generation) → criteria 1 and 9;
- 31/38/42/44 (registry-current snapshot, group image, receipt currentness) → criterion 13;
- 32/47 (coordinator owns blocked-until and the 5/15/60 sequence) → criterion 6;
- 33/37/41 (full-grain atomic cache resolution, issued keys, conditional vs exact) → criteria 10–12;
- 34/35/48 (one real stage per operation, composed exports, derived membership) → criteria 14–15;
- 36 (concurrent equal snapshots) → criterion 13;
- 39/49 (exact settlement parsing, sealed group settlement) → criterion 8;
- 43/50 (shared backoff visible to availability, total wire projection) → criteria 6 and 17;
- 45 (recovering is reachable and representable) → criterion 2;
- 46 (total configured-group/coordinator closure) → criterion 15;
- 51 (monotonic and civil clocks are separate operands) → criterion 2.

## Round index

| round | return | repair |
|---|---|---|
| 1 | `independent-buildability-review-2026-08-27.md` | `author-repair-2026-08-31.md` |
| 2 | `second-fresh-independent-buildability-review-2026-08-31.md` | `third-author-repair-2026-09-02.md` |
| 4 | `fourth-fresh-independent-buildability-review-2026-09-04.md` | `fourth-author-repair-2026-09-04.md` |
| 5 | `fifth-fresh-independent-buildability-review-2026-09-05.md` | `fifth-author-repair-2026-09-05.md` |
| 6 | `sixth-fresh-independent-buildability-review-2026-09-05.md` | `sixth-author-repair-2026-09-05.md` |
| 7 | `seventh-fresh-independent-buildability-review-2026-09-05.md` | `seventh-author-repair-2026-09-05.md` |
| 8 | `eighth-fresh-independent-buildability-review-2026-09-05.md` | `eighth-author-repair-2026-09-05.md` |
| 9 | `ninth-fresh-independent-buildability-review-2026-09-06.md` | `ninth-author-repair-2026-09-06.md` |
| 10 | `tenth-fresh-independent-buildability-review-2026-09-06.md` | `tenth-author-repair-2026-09-06.md` |
| 11 | `eleventh-fresh-independent-buildability-review-2026-09-06.md` | `eleventh-author-repair-2026-09-06.md` |
| 12 | `twelfth-fresh-independent-buildability-review-2026-09-06.md` | — (superseded by this cut) |

## What is still true after the cut

The production failure that opened this RFC is unrepaired and reproduces at HEAD:

- `apps/server/src/opponent-selector.ts:468` — the opponent cache is still
  `new Map<string, Promise<OpponentSelection>>()`, unbounded and generation-blind;
- `apps/server/src/opponent-selector.ts:612` — Maia still receives `timeoutMs: 60_000`;
- `apps/server/src/capabilities.ts:282-317` — `EngineCapabilities` still converts constructor flags
  (`corpus`, `tts`, `tablebase`, `llmAvailable`) straight into advertised availability;
- `apps/web/src/lib/DrillScreen.svelte:978,981,983`, `apps/web/src/lib/AssistanceSettings.svelte:65`
  and `apps/web/src/App.svelte:1318,1327,1364` still branch on `capabilities?.providers.*`, and
  several of them **remove** the control rather than render it with a reason — the honest-absence
  gap [[D1469]] named for *offered* surfaces.

The cut removed process, not the problem.
