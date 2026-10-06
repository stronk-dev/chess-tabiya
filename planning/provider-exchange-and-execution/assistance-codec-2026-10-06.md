# Shared assistance codec and visible Settings recovery — D3500 / D3501 / D3502

Authority: implementing `rfc/hint-distance.md` §5/D12 and
`rfc/intent-presets.md` §5.3. This is current-head persistence groundwork,
not a new assistance policy, resource claim, preset or disclosure rung.

## Production boundary

`packages/runtime/src/assistance-codec.ts` owns the nine current fields and
their closed literal domains, complete v4 parsing, sparse override parsing and
pure v1–v4 migration. Presets reuse and re-export the same registry; the browser
adapter calls the shared migration rather than carrying a private validator.
Assistance remains v4 and workflow preferences remain v2 with assistanceHead 4.

Current snapshots refuse missing/extra fields, unknown/broad values and future
heads. Sparse overrides preserve omission. Historical migration still ignores
extra legacy keys and applies the original defaults, including v3 spoken-on to
browser speech. It retains exact source-version provenance, copies no future
field, and never adopts v5/hintDistance. Only ordinary data objects are accepted;
accessor, inherited, symbolic and hidden fields cannot bypass the closed parser.

Settings now renders the existing registered `preference_recovery` message beside
the affected activity's Help style control, with status semantics and an accessible
description. Unreadable current bytes take precedence over otherwise valid legacy
data and remain untouched until an explicit new choice. An unavailable or refused
store remains an honest unsaved choice rather than a claim of persistence.
No raw stored data enters the message and no new learner copy or policy is invented.

## Permanent falsifiers and local verification

- The test-only TypeChecker independently projects the actual AssistanceConfig
  interface and compares its head, every field and every literal to the runtime
  registry. Added fields/domains cannot silently disappear; broad types refuse.
  The projection is not a second production schema.
- All 22 literal members across nine fields pass both runtime parsing and actual
  preference save/load/legacy migration/reload controls. Missing, extra, future,
  malformed and broad values refuse without resurrecting legacy choices.
- Mounted Settings controls prove visible recovery, description binding, unchanged
  unreadable bytes, explicit replacement and an honest refused save.
- `make assistance-codec-check typecheck` passes 108 cases / five files and clean
  TypeScript/Svelte checks (zero errors/warnings).
- `make assistance-codec-browser-check` passes three built-browser journeys,
  zero retries: the new migration/reload/recovery journey, existing preset-to-server
  module compilation and existing mobile settings/storage-event/install journey.
  This is not a fresh full-browser or composition-matrix result.
- The import-isolation guard now reads the codec itself and permits exactly its
  type-only assistance import. It does not admit new evidence/eligibility inputs.

Early instrument failures were repaired without dropping assertions: the import
guard did not recognize the new pure codec; the test-only TypeChecker helper used
a Vite-transformed non-file URL; the new browser Arrows lookup used a label locator
that did not match its actual accessible combobox name. The final role/name locator
still asserts the evidence value. Neither failed browser run is counted as a pass.

The first content run catches the new ASSISTANCE_SHAPE error without a direct
named refusal-code disposition. Existing codec negatives now assert all three
typed codes (shape/value/version) and the actual AssistanceCodecError class.
No debt register or ceiling is widened, and the focused codec/content targets
are rerun. Generic `.toThrow()` controls alone were not sufficient coverage.

The first complete software run passes 3,396 cases / 344 files, seven isolated
performance cases / four files, clean types and the earlier downstream contracts,
then refuses stale semantic receipts. Normal semantic-validation/capability writers
refresh the source-closure digests automatically. They retain 81 subjects with zero
passed, 38/38 cases, 53 population receipts and eight external receipts. The first
replacement passes those receipt checks but correctly refuses rewriting seven
existing capability versions, even though only their digests changed. Original
declarations are restored and the lifecycle appends five v22 / two v24 successors,
retaining all 977 predecessors.

`make assistance-codec-metadata-update` passes its preservation proof before
writing: 104 pack/example/fixture requirement stamps and 68 ledger digest stamps
change; authored fields in all 104 documents, 192 other source documents and all
278 factory outcomes remain identical. No validation observation or evaluator code
changes. Canonical applicability tracks the same seven explicit successors. The
proof permits exactly the added pure codec in affected import closures, not
arbitrary replacement sources. `make assistance-codec-metadata-check` reruns
read-only against fixed predecessor 34d96c4d.

The earlier staged software/full-browser runs are deliberately interrupted after
the history failure, not counted green; the browser's interrupted matrix case is
not evidence of a product regression. Fresh complete gates run against the corrected
index/application. Their terminal results are recorded below before commit.
No stale or interrupted gate is called green.

## Remaining work

Final `make test-browser-content test-browser` terminates zero: five content-browser
journeys, then 145 complete-suite passes / one optional Maia skip, zero retries.
The normal retained composition proof passes all 112/112 unretried cells. The shared
codec/recovery journey and the precise Compare fork/cardinality control both pass.
No GitHub run, paid voice result, Hint latency discharge or full 1.0 is claimed.

The corrected exact-index `make staged-software-contracts` terminates zero:
3,396 cases / 344 files, seven isolated performance cases / four files, clean
types and every downstream software contract, including append-only history,
source/validation, capability, migration, composition and preserved failed Hint
measurement controls. Captured tree: aca21712ec0a5c41754ee714eb2931ce02681a1a;
durable receipt: `assistance-codec-software-2026-10-06.json`. Other workers' unstaged
bytes are excluded. Later browser-test/tracking closeout is verified separately,
not represented as part of that earlier captured tree.

`make verify-content assistance-codec-metadata-check` terminates zero: all 227
content cases / 23 files, no graduation-corpus error, all 104 exact pack declarations
and the complete read-only history/authored-content/factory/validation preservation
proof. Official-content graduation is not claimed by successful corpus checks.

The corrected full-browser run exposes D3502: its Najdorf Compare test counts
two readings across the whole timeline, but the failure snapshot correctly has
two at the fork, one later reading and No record in the other branch's later cell.
The test now binds exactly two readings to the fork, exact labelled branch columns
and one reading-or-absence per cell at every rendered step. It keeps the existing
export, rehearsal, strips and disclosure assertions. This is not a production
trajectory change or a minimum-count waiver. A complete replacement browser run
must terminate zero before closure; the failed run remains a failed run.

D3500/D3501 close only this production codec/recovery boundary. Hint D12 still
requires the full v5/rung preference contract, D1639's ceiling table remains
proposed, and D3498 still requires a proper optional-voice lifecycle amendment.
D3497/D7 still require actual browser/permitted-rung latency evidence. The earlier
HTTP timing receipt is historical, not a new timing result for these bytes.
D3262 still owns five-approach cost/profile research; production/source/A4,
official content and the full 1.0 roadmap remain open. No capability, milestone,
full RFC, release or GitHub completion is asserted.

Final `make staged-process-contracts verify-governance` terminates zero on the
closed tracker and final owned index. All 204 staged files are owned by this
checkpoint; whitespace checks are clean. Software code, software tests, Make
targets and generated metadata match the captured passing software tree;
later browser assertions and flowback have their separately passing gates.
Ordinary commit hooks remain enabled. Routine metadata maintenance requires no
owner ruling; the full 1.0 goal remains active.
