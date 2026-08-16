# WORK — the single entry point

**Read this first. Everything else in `planning/` is a lane this file points at.**

Created 2026-08-16 after the owner asked *"why is none of that indexed?"* and the answer was
that it was: `planning/work-register.md` states the right invariant — *"every open defect
appears exactly once, with a destination"* — and was **121 rows stale**, missing every row
created on the project's two highest-output days ([[D487]]).

> **⚠ THIS FILE IS HAND-MADE AND WILL ROT THE SAME WAY.** That is not a caveat, it is the top
> item in the queue below. Until `make work-index` exists and **fails when any open ledger row
> has no destination**, treat every count here as a snapshot with a date on it.

**Snapshot date: 2026-08-16.** Ledger at **D487**, 289 open rows at the time of the routing pass.

---

## The five lanes

| Lane | Document | What it holds |
|---|---|---|
| **Implementation** | `planning/codex-queue.md` | What the implementer takes next, in order |
| **Defects** | `planning/defect-triage.md` | All 289 open rows routed into 9 batches + 7 buckets |
| **RFCs to draft** | `planning/rfc-drafting-queue.md` | **40 unowned rows → 7 documents (4:1).** Write `shared-resource-registers` first — not the most valuable, but the only one currently *producing wrong work*: three of four registers are wrong at HEAD and five of the seven documents must claim a lane |
| **Research** | `planning/research-queue.md` | Hypotheses, kill criteria and measurement questions, ranked |
| **UX** | `planning/ux-work-lane.md` | What to fix so a person can use the thing |

Reality check on what a user actually sees: `planning/app-reality-check.md`.

---

## 0. The two instruments that stop this rotting — build these first

Both are `make verify` targets, both are small, and both exist because a **normative rule
written in prose has no reader**. That is now the dominant defect class in this repo.

- **`make work-index`** ([[D487]]) — derive the routing from column 1 of `design/BACKLOG.md`,
  joined against the RFC register and the queue. **Fail when any open row has no destination.**
  That is the invariant `work-register.md` already claims and cannot keep by hand.
- **`make status-parity`** ([[D477]]) — compare every Active row in `rfc/README.md` to the RFC
  body's `**Status:**` line. **Six instances** of that contradiction have now blocked an
  implementer mid-task; each cost a round trip and one cost a wasted acceptance.

Same family: [[D450]] (a permission rule in a doc that no test reads), [[D459]] (the defect
table's own header mislabels column 3 and produced four misreads).

## 0b. Owner rulings of 2026-08-16 — act on these

- **[[D502]] — the corpus reaches learners through BOTH channels.** A **disclosed draft channel
  now** (all 56 behind an *unreviewed draft* badge; the registry already carries
  `channel: "official" | "community"` and the UI renders it), and a **graduated shelf** as packs
  earn it. **Not by flipping `NODE_ENV`.** Unblocks K1–K4, K8, R6–R8 and a real play session, and
  gives the graduation machinery a consumer.
- **[[D502]] — the schema example fixture is removed from the served library.** It is a format
  fixture, not content; it validates the schema in tests and never reaches a user.
- **[[D493]] is a defect fix, not a ruling** — `SILENT_ASSISTANCE.boardLighting` was flipped
  `"legal"` → `"off"` at `f304384` **the same day**, on a constant-tidiness rationale, while the
  docs and all three migration branches still say `"legal"`. **One token.** Silence over
  *evidence* stays; the rules floor was never on the ladder.

## 1. Live and user-affecting — outranks everything below

- **[[D468]]** the server fails to boot on the first graduated pack carrying an acceptance —
  40 of 56 drafts carry one; **[[D469]]** `release.yml` pushes the image with no content gate.
- **[[D481]]** `make up` serves **one** pack, the schema fixture, because `compose.yaml` never
  sets `NODE_ENV=development` and `content/packs/` holds only `.gitkeep`.
- **[[D482]]** every browser test backing a breadth gate runs under a configuration `make up`
  cannot produce — **the mechanical reason 736 green tests and an empty app are both true.**

## 2. What is scheduled vs what is not

Of 289 open rows at the routing pass:

| | Rows | State |
|---|---:|---|
| Batch-ready, queued | 72 | in `defect-triage.md`, 9 batches |
| Content — mechanical | 27 | five jobs, three of them a shipped `make` target at the corpus |
| Already done or half-done | 59 | flipping them is one commit and no code |
| Duplicate / record-only | 20 | |
| **Needs an RFC nobody has drafted** | **~29** | 47 rows less ~18 already owned |
| **Needs an owner decision** | **22** | yours |
| **Needs research** | **19** | |
| **Needs authored chess judgement** | **23** | law 8 forbids generating it |

**≈93 rows have no path to being done today.** The row count understates it: the largest
unscheduled things are not rows.

## 3. Unscheduled and bigger than any row

- **Campaign mode** — zero implementation, no RFC in any state, a 245-line design doc that
  calls itself intent ([[D486]]). Every document is honest about its own tier; **nothing
  aggregates**, which is why this file exists.
- **Stage 2 of the binding wave** — 98 claims a landed ruling requires *before anyone plays*,
  and its named owner was archived ([[D476]]). **Nobody owns it.**
- **Six changes owed to `design/06-campaign.md`** from the boss ruling ([[D439]]). Law 5 —
  owner or claude-on-a-ruling only.
- **The breadth-gate criteria themselves.** B2's is *"each completes one fixture run"*. **Not
  one of the eleven was written in a form a person could fail** ([[D482]]). Rewriting them is
  design-tier and on nobody's list.

## 4. Gated on the owner playing a run

**Nobody has played since 2026-08-12.** This is the only lane where building does not help.

- **H1–H4** untested; **K1–K5, K8, K9** have no evidence either way.
- **R6, R7, R8** deliberately deferred until the loop has been felt.
- Runtime playtest cost — unmeasured since 2026-08-12, and it is the open half of **K10**.

## Maintenance rule

**Every lane document above states its own snapshot date and the commit it was measured at.**
A lane with no date is not current. When `make work-index` lands, this section is replaced by
its output and the counts stop being hand-copied — which is the only version of this file that
survives contact with a working week.
