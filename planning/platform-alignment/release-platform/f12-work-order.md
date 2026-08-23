# F12 work order — the Choice-C appliance is a release contract, not one implementation batch

**Status:** planning synthesis; RFC drafting authority is open for the READY children below

**Inputs:** R18 `design/research/release-platform-audit.md`; O13/D616 owner ruling;
`design/02-product-shape.md` Choice-C amendment; D605-D615; D649 owner-use validation posture

**Boundary:** this plan creates no product code, schema, migration, content wave or release claim.
Each child still needs its own accepted RFC before implementation.

## 1. Current truth, refreshed 2026-08-21

The provider-off rehearsal core remains proven: a clean single-host deployment starts without a
cloud secret, completes a run and persists it over restart. That is not the Choice-C appliance.

Two R18 findings have changed since the audit and must not be copied as current blockers:

- **D614 is closed.** The root README was rewritten at `2b69ee8`; it no longer advertises zero
  defects or copied test counts.
- **Pointer/touch exactness is repaired.** D537/D538/D573 closed at `d208425`; the current permanent
  matrix is 90/90 exact across six endgame packs, five viewports and click/drag/touch, including
  18/18 at 390×844. R18's 4/90 result remains historical evidence for testing interaction state,
  not current release truth.

The remaining release blockers are independently real:

| ledger | current gap | primary child |
|---|---|---|
| D605 | **closed** — deterministic versioned account export ships | F12-B data lifecycle |
| D606 | **closed** — dependency-aware account/run deletion ships | F12-B data lifecycle |
| D607 | unsafe loopback/LAN default and incomplete TLS deployment | F12-A deployment |
| D608 | no supported backup/restore/pre-upgrade/recovery contract | F12-C operations |
| D609 | dead Maia remains advertised and new requests hang | F12-D provider health |
| D610 | no unified licence/notices/source/SBOM surface | F12-E distribution |
| D611 | runtime image ships the authoring tree and local paths | F12-E, behind F3/F4 bundle |
| D612 | no keyboard or assistive chess move entry | F12-F accessible input |
| D613 | unmodified Tab is captured and traps focus | F12-F accessible input |
| D615 | CPU Maia image is 5.11 GB with proprietary-labelled CUDA payload | F12-E engine matrix |

D616/O13 adds five positive obligations beyond merely closing those defects: offline
knowledge/tablebase support; service-worker update semantics; signed/attested images;
multi-architecture resource tiers; and a complete reverse-proxy topology.

Per D649, recruited participant studies are out of scope. Mechanical accessibility and physical
device behavior are proved by automated instruments, then accepted through the owner's own devices
and use before release. This changes the proof owner, not the accessibility requirement.

## 2. Why F12 must split

One RFC spanning database deletion, export formats, reverse proxies, service workers, chessboard
input semantics, image dependency resolution, SBOMs and release attestations violates RFC-0000's
bounded-work rule. Those systems have different dependencies and failure modes. Calling all of them
“release hardening” would hide the same missing joins this project just repaired elsewhere.

The release node is therefore seven child contracts plus one integrator. The F12 label remains the
roadmap capability; it is not a filename or a single merge.

```text
F12-A safe deployment ─┐
teacher-surface → F12-B data lifecycle ─┼─┐
F12-C operations ──────┤ │
F1 → F12-D health ─────┤ ├→ F12-H integrated appliance proof
F3/F4 → F12-E bundle ──┤ │
F12-F accessible input ┤ │
F4 → F12-G offline/PWA ┘─┘
```

F12-H cannot accept a substitute for an unfinished child. A child can land early without claiming
the appliance or 1.0.

## 3. Child contracts

### F12-A — safe deployment profiles and reverse proxy — READY TO DRAFT

Owns D607 and the complete hosted topology.

Required contract:

- `local` binds loopback only, uses HTTP/insecure cookie only on loopback, and refuses a non-loopback
  bind under that cookie posture;
- `appliance` and `hosted` have one documented TLS termination path, forwarded-proto/host trust,
  websocket/event-stream behavior, upload/body limits and health endpoints;
- secrets enter through files/environment with a documented rotation/restart effect and never enter
  images or exports;
- origin/cookie/CSRF behavior is tested through the proxy, not only direct localhost;
- both topologies start from a pinned Compose artifact and have an explicit unsupported-topology
  message rather than folklore.

Non-goals: federation, Kubernetes, public SaaS billing, an operator account.

### F12-B — portable data and deletion lifecycle — IMPLEMENTED 2026-08-23

Owns D605/D606 and the future private-by-default behavioral profile data.

Required contract:

- versioned account bundle with a typed inventory and per-section provenance;
- full-fidelity runs/events/imports, progress/schedules/concepts, marks, repertoires, owned drafts,
  registrations and live/social relationships represented explicitly rather than hidden in PGN;
- deterministic export with secrets, password hashes, sessions and bearer tokens excluded;
- per-run deletion and a dry-run explaining affected grants/shares/distillations;
- account-delete preview listing hard-deleted, tombstoned and retained objects;
- style/profile metrics private by default, exported and deleted with the learner unless separately
  published by an explicit later contract.

**OWNER RULED 2026-08-21:** adopt the recommended dependency-aware retention boundary:

> hard-delete private/solo runs and learner-only state; retain genuinely shared or published
> artifacts only as immutable tombstoned records after an explicit preview; delete the learner's
> grants, private marks, profile and credentials; never reassign a private run to `__legacy`.

For this ruling, an anonymous share link alone is not a durable dependency: deletion revokes the
link and hard-deletes an otherwise-private run. A run is genuinely shared only when another
authenticated learner has a durable grant or owns a derived artifact that names it. Retained runs
lose all real writers and become read-only; registered pack/shape bytes remain immutable while
account-identifying publisher metadata becomes a tombstone. The preview must disclose that authored
bytes already embedded in an immutable shared/published artifact survive with that artifact.

Author review found one landing dependency not visible in R18: `teacher-surface.md` created
classroom/submission tables and specified the pre-D656 opposite deletion outcome. It landed first;
`rfc/archive/portable-account-data.md` now inventories those tables and supersedes only its
account-deletion clause. D657 is closed.

Account-bundle **import** is not implied by O13's export/delete ruling. Server backup/restore belongs
to F12-C. A future user-level cross-instance import needs its own collision/identity contract.

### F12-C — backup, restore, upgrade and recovery — READY TO DRAFT

Owns D608.

Required contract:

- quiesced SQLite backup that handles WAL/SHM correctly and records storage version, app version,
  timestamp and digest;
- restore into a fresh named volume plus post-restore identity/data invariant checks;
- automatic pre-upgrade snapshot before migrations;
- explicit compatibility matrix: which app version may read/upgrade which storage version;
- failed-migration recovery and last-known-good procedure; no promise of downgrade reading after a
  forward-only migration unless tested;
- Make/Compose commands for backup, verify, restore and upgrade rehearsal;
- disposable drill proving backup → mutate → restore → verify on both amd64 and arm64 CI runners or
  equivalent emulation.

### F12-D — provider health and honest degradation — BLOCKED ON F1 ACCEPTANCE

Owns D609 and consumes F1 rather than inventing a second capability registry.

Required contract:

- provider states distinguish at least `not_configured`, `available`, `degraded_cached_only` and
  `unavailable`;
- every new provider call has a server deadline, cancellation and typed unavailable result;
- live health uses bounded probes/request outcomes with hysteresis, not configured-process presence;
- cached answers remain identified as cached and never prove new-request health;
- capability output joins F1's compiled producer/consumer declaration with runtime availability;
- client modules render honest empty/unavailable and never silently substitute Stockfish for Maia,
  corpus for theory or an LLM for deterministic evidence.

F12-D may draft after F1 is accepted. F1 itself declares availability fields but does not choose
health probing, timeout or hysteresis policy.

### F12-E — runtime bundle, FOSS engine matrix and verifiable distribution — PARTLY BLOCKED

Owns D610/D611/D615, signed/attested images, multi-architecture tiers and the distribution half of
Choice C.

Independent portion, ready after the resource-tier ruling below:

- generate SPDX or CycloneDX SBOM per image and a human notices/source inventory;
- ship Tabiya licence/source/warranty entry plus pinned Stockfish/Maia sources and applied patches;
- resolve Maia weight attribution explicitly; do not infer an SPDX ID from ambiguous prose;
- build a CPU-default Maia image without CUDA/NVIDIA packages and pin all Python dependencies;
- publish signatures and SLSA-style provenance/attestations for every digest-pinned image and
  Compose artifact;
- verify amd64 and arm64 artifacts and record idle/peak memory plus model/startup budgets.

Blocked portion:

- the allow-listed immutable runtime content/knowledge bundle depends on F3/F4. It must exclude
  candidates, jobs, local paths and authoring-only sidecars, and carry only rights-cleared runtime
  artifacts.

**OWNER RULED 2026-08-21:** adopt these resource tiers as proposed:

1. `core`: deterministic rehearsal, no model, lowest supported memory;
2. `cpu`: FOSS Stockfish + CPU Maia, the default full local-opponent appliance;
3. `accelerated`: optional GPU image, separately labelled/licensed, never required by a core journey.

### F12-F — one accessible board-input model — READY TO DRAFT

Owns D612/D613 and preserves the now-green pointer/touch contract.

Required contract:

- one active-square/destination state machine shared by pointer, touch, keyboard and assistive input;
- board has an interactive role, position/turn/status name, square/piece announcements and a text
  move-entry fallback using legal SAN/UCI validation;
- arrow keys or an explicitly documented grid model navigate squares; Enter/Space select/commit;
  Escape cancels; focus is restored after move/re-render;
- normal Tab/Shift+Tab traversal is never captured; comparison moves to a non-conflicting shortcut;
- legal destinations and invalid/committed moves are announced without flooding 64 nodes;
- click/drag/touch remain 90/90 exact, and keyboard/text input emits the identical UCI;
- owner validation covers phone/tablet, keyboard-only and the screen reader(s) available on their
  devices; mechanical checks remain release gates even before that session.

No chess evidence or move recommendation is added by accessible input.

### F12-G — offline knowledge/tablebase and PWA update semantics — BLOCKED ON F4

Choice C does **not** require the browser to complete server mutations while disconnected from the
appliance. “Offline” means the appliance's core, knowledge and declared tablebase tier require no
Internet/cloud provider. The browser may need LAN/localhost access to its own server.

Required contract after F4 defines the immutable knowledge bundle:

- local exact/FTS knowledge retrieval and a local tablebase provider with declared installed domain;
- operator-mounted data directories and resource-tier capability reporting; no pretence that the
  complete seven-piece tablebase is bundled in a small image;
- service worker caches only versioned immutable shell/assets, never auth responses, account
  exports, live capability state or mutable API data;
- a new worker installs in the background but never takes control mid-run; the learner receives an
  update-ready prompt and reload occurs only at a safe boundary they choose;
- schema/storage compatibility is checked before activation; rollback uses F12-C's recovery path;
- offline/provider-loss tests distinguish Internet loss from appliance-server loss and render both
  honestly.

The exact bundled/mounted tablebase domains and knowledge corpus are F4/F12-G decisions after the
runtime bundle exists; no size claim is authorized today.

### F12-H — integrated appliance and 1.0 release proof — LAST

Owns no new mechanism. It composes the seven children and the included product journeys.

The release candidate must prove, from a clean host and fresh account:

1. local core and CPU profiles install, start, update, back up, restore and recover;
2. hosted proxy login/session/share flows work over TLS;
3. provider failures produce typed honest degradation within deadlines;
4. export/delete previews and outcomes match the typed data inventory;
5. pointer/touch/keyboard/text/assistive board entry produce identical legal moves;
6. the PWA update waits for a safe boundary and the appliance operates without Internet;
7. images, Compose and runtime bundle verify signatures/digests/SBOM/notices on amd64 and arm64;
8. every mandatory 1.0 learner journey works with external providers disabled;
9. deferred features are labelled, and no current limitation is marketed as implemented.

Only F12-H may change the product label from pre-1.0. Failure returns to the owning child; it is not
accepted as “1.0 with known issues.”

## 4. Owner decisions now

Two rulings unblock their child specifications without waiting on F1/F4:

1. **Deletion retention — RULED 2026-08-21:** adopted F12-B's private-hard-delete / authenticated-
   shared-or-published-tombstone rule; anonymous links are revoked rather than treated as retention.
2. **Resource tiers — RULED 2026-08-21:** adopted F12-E's `core` / FOSS `cpu` / optional separately
   disclosed `accelerated` matrix as proposed.

Everything else above is either already ruled by O13, a technical implementation decision for its
child RFC, or honestly blocked on F1/F3/F4. No further broad platform research is required before
drafting F12-A/C/F; their eventual implementations still need the named destructive/failure drills.

## 5. Immediate queue

1. Both owner choices are settled.
2. Draft F12-F first: it closes a core-action exclusion and has no F1/F3/F4 dependency.
3. Draft F12-C and F12-A in either order; they touch disjoint systems.
4. **Done:** F12-B drafted from the ruled retention boundary; buildability/cross-review remains, and
   implementation lands after `teacher-surface`.
5. Draft F12-D after F1 acceptance.
6. Draft F12-E independent half after resource tiers; reconcile its runtime bundle after F3/F4.
7. Draft F12-G after F4.
8. F12-H stays a release-proof contract until all mandatory product nodes are accepted and landed.
