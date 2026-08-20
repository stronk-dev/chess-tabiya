# R18 release-platform audit — predeclared plan

**Opened:** 2026-08-20

**Authority:** platform-alignment R18; research and read-only reconciliation only

**Status:** answered mechanically 2026-08-20; physical-device and screen-reader participant proof remains external

## Question

What exact self-host, provider-off, data-lifecycle, rights, accessibility, responsive-input and
operational floor can the committed product honestly support for 1.0? This pass inventories and
measures the existing release surface. It does not implement missing platform features or declare
the owner decision O13.

## Audit baseline

Product behavior is measured from committed `24430fe`. The shared working tree contains unrelated
feedback-delivery implementation, so executable deployment probes use a clean extraction under
`/private/tmp`. Research documents may be written in the shared tree. Docker/host versions, image
digests or sizes, commands, exit codes, timings and bound ports are recorded with the result.

## Arms

### A. Reproducible self-host and degradation

1. Read the root setup, development and release instructions as a new operator would.
2. Validate development and release Compose projections without supplying secrets.
3. Build and start the default profile from the documented command. Probe health, the shell,
   capabilities and one core rehearsal route; inspect logs for undeclared outbound/provider calls.
4. Start the optional local-engine profile if host resources permit. Record build/start time,
   health and the capability difference. A build that cannot complete is a result, not permission
   to weaken the arm.
5. Exercise declared engine-unavailable and unsupported-mode paths. “Mock works” does not by itself
   establish an honest fallback for a learner-facing engine or Maia request.
6. Inspect whether an LLM, theory builder, hosted identity or other cloud secret is required by any
   core journey. Optional configuration must have an explicit off/unavailable state rather than a
   silently weaker or false answer.

The core provider-off floor passes only if a fresh single-host start follows the documented command,
reaches a useful rehearsal without a cloud credential, persists across restart, and exposes the
actual capability state. The engine-on arm is reported separately and cannot rescue the off arm.

### B. Operations and resource envelope

Measure build/start duration, image and writable-data size, idle container memory, health latency
and first useful response on the available audit host. Record the host architecture and Docker
version. These are observations, not universal minimum requirements.

Trace update, schema migration, backup and restore instructions and mechanisms. On disposable
data, create an identifiable record, back it up, destroy only the disposable deployment state,
restore it and prove identity/digest equality. If no documented mechanism exists, record the gap
and do not invent an operator procedure as product support.

### C. Data lifecycle and privacy

Inventory stored tables/objects and every browser/API/CLI export or delete path for accounts,
sessions/runs, imported games, authored drafts, annotations, live/social data, schedules and future
style vectors. Trace authentication, authorization, cookies, listen defaults, retention, telemetry
and outbound calls.

The lifecycle floor requires a user-visible inventory; portable export of the user's durable data;
account/data deletion with explicit scope; private-by-default behavioral profiles; and documented
backup/restore. A PGN export of one run is not an account export. Absence is reported from both
route/API search and a runtime negative probe where practical.

R12's style vector is treated as behavioral identifying data because its measured 12-dimensional
vector re-identified 35/36 public accounts across disjoint samples. Sharing, retention and deletion
therefore cannot be inherited silently from generic progress settings.

### D. Rights and provenance

Build an inventory for first-party code, shipped JavaScript/Python/system dependencies, Stockfish,
Maia source and weights, tablebase/explorer calls, fonts/assets and every distributed content/source
class. Record licence identifier, pinned revision/digest, redistribution/modification obligations,
attribution/source offer and whether the release UI/package exposes required notices.

Use repository manifests and upstream primary licence/model-card/source pages. Missing or
ambiguous rights are named; this is an engineering inventory, not legal advice. Dependency licence
compatibility is not inferred merely because installation succeeds.

### E. Accessibility and responsive/input behavior

Reuse A2's exact-UCI mobile and gesture findings rather than rerunning a resting-layout proxy. On a
clean running app, test at least:

- keyboard-only entry, navigation, move input or documented equivalent, rewind, reveal/assistance,
  compare and dialog dismissal/focus restoration;
- accessible names/roles/states and live status for board, timeline, evidence, errors and dialogs,
  using DOM/accessibility-tree inspection plus static source trace;
- reduced-motion and visible-focus behavior;
- 390x844 phone, 768x1024 tablet portrait and 1440x1000 desktop, including an interaction state
  after a source square/branch/control is selected;
- pointer, touch and keyboard equivalence. Hover-only meaning without a touch/keyboard route fails.

Automated semantics are necessary but not sufficient. No screen-reader-user usability claim is
made without a participant; this pass may establish only mechanical compatibility and named gaps.
The responsive floor fails if the exact intended legal UCI cannot be entered or a required source
square/control is occluded, even when the resting viewport assertion passes.

## Controls and refusal rules

- Run `docker compose config` on both profiles and the release template before starting services.
- Compare documented commands with actual service/profile names and environment defaults.
- Probe an absent export/delete route and an unavailable engine mode; 404/typed-unavailable/500 are
  distinct outcomes.
- Keep deployment data disposable and outside the named production volume; do not delete the
  repository or the user's existing Docker volumes.
- Do not use the unrelated dirty working tree as deployment evidence.
- Do not call an undisclosed manual SQLite copy a supported backup flow.
- Do not call source semantics “screen-reader accessible” from ARIA/static inspection alone.
- Do not call the platform private merely because it is self-hostable; network exposure, cookies,
  outbound calls, retention and deletion are separate properties.

## Exit and decision output

R18 completes when `design/research/release-platform-audit.md` contains:

1. exact results and failures for provider-off and optional-engine deployment;
2. an operations/resource table and tested or explicitly absent update/backup/restore path;
3. a durable-data/export/delete/privacy map, including R12 profiles;
4. a rights/provenance register with unresolved release blockers separated from notices;
5. accessibility and responsive/input results that incorporate A2's live-gesture evidence;
6. a proposed O13 choice set with the minimum coherent 1.0 floor and explicit deferrals.

The dossier may unblock O13 and supply F12 acceptance inputs. It cannot accept F12, claim a release,
or convert unmeasured participant accessibility into a pass.

## Result

Landed in `design/research/release-platform-audit.md`, with exact measurements in `results.md` and
the browser/AX artifact in `browser-results.json`. The provider-off core passes, but the 1.0 floor
fails on data portability/deletion, operations, accessibility, deployment documentation and rights.
O13 is ready for an owner ruling; F12 remains future RFC/implementation work.
