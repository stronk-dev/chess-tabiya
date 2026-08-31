# RFC: Work state — durable per-item state, a named owner, and an instrument that measures assignment

- **Status:** implemented 2026-08-31 — 2,128 ledger rows bootstrapped with durable state; normal
  governance and staged checks enforce population, state, ownership, closure, exact-row identity,
  cross-store references, blockers and the one-way untriaged ratchet.
- **Author:** claude
- **Created:** 2026-08-26
- **Design refs:** none. This is repository process over the shared ledger. It chooses no product
  behaviour, no learner surface, no chess claim, and touches no schema, migration or runtime byte.
- **Exploration gate:** passed on ledgered defects with first-hand evidence, not on an open
  question: [[D1523]] (the instrument measures citation, not assignment), [[D1528]] (89% of live
  work is in no queue a worker reads), [[D1522]] (the coordinator curates instead of enumerating),
  [[D1320]] (an unruled refusal is a defect), [[D1374]] (a snapshot cannot self-correct),
  [[D1525]] (an instrument that does not declare its scope answers a narrower question than the
  one asked). Each names its own remedy; none asks a question research must answer first.
- **Depends on:** the shipped `tools/work-index.mjs` (its new raw-row export becomes the single
  population authority while `parseLedgerRows` retains its public shape),
  `tools/work-item-registry.mjs` (the sidecar-plus-digest pattern
  this RFC generalises), `planning/roadmap-1.0.json` (the owner vocabulary)
- **Parent / amends:** amends `Makefile`, `tools/staged-process-contracts.mjs`
  (`PROCESS_CONTRACT_TARGETS`) and `planning/roadmap-1.0.json` (`capabilities.governance.rfcs`).
  It does **not** amend `rfc/0000-rfc-process.md`. It extends `tools/work-index.mjs` with raw row
  bytes and glyphs without changing the existing `parseLedgerRows` result or CLI behaviour.
- **Supersedes / superseded by:** —
- **Planning:** `planning/work-state/` (once implementing)

```tabiya-claims
none
```

## Summary

`design/BACKLOG.md` records 2,128 items: 686 closed and 1,442 live at the acceptance refresh. It
can say, per item, only whether the row is closed.
Nothing on an item says whether the work is going to happen, or who would do it. This RFC gives
every ledger row a durable **state** (one of six), a durable **owner** (one of the fourteen
capability lanes the roadmap already declares, or `OWNER`, or `unowned`), and one instrument —
`make work-state` — whose subject is **assignment** rather than citation.

The state lives in a generated sidecar, `planning/work-state.json`, joined to each ledger row by a
digest of that row's exact bytes. `tools/work-index.mjs` gains a raw-row export and keeps its
existing parser and CLI contract: citation and assignment are different questions and both are
worth asking. The migration derives what the tree can prove
(`✅` → `done`, `⛔` → `refused`, an unambiguous live UX-registry reference → `todo`) and gives the
remaining open rows the honest state `untriaged`, owner `unowned`. Bootstrap invents no blockers
or owners from prose. A ratchet stops the untriaged number rising.

## Motivation

### The measured failure

`tools/work-index.mjs:56` is the whole check:

```js
function mention(text, id) { return new RegExp(`\\b${id}\\b`, "u").test(text); }
```

It asks whether a row's id appears **as a string** in some durable document. It reports
`1544 ledger rows; 968 open; 968 routed; 0 unrouted` — and [[D1528]] measured, across twelve UX
dossiers, that **452 of 507 live items (89%) sit in no queue any worker reads**, including
**195 of 312 buildable-now items**. Both statements are true at once, because the instrument
cannot distinguish *queued* from *merely mentioned*.

The loop this produces: enumerate → write a snapshot document → the document cites the ids →
the gate goes green → the work stays undone → the next enumeration **starts from zero**, because
the classification lived in the snapshot rather than on the item. It has run three times
([[D1330]]'s dossier remainder, `work-index` itself, `planning/codex-wave-3.md`), and [[D1374]]
separately found the first one's ranks 9–10 were simply wrong — an error a snapshot cannot
self-correct. `planning/ux-implementation-index.md` says so about itself, in its own method
section: *"This is a fourth snapshot… If nothing consumes it, it decays exactly as the other three
did."*

The owner's words are the acceptance test for this document: *"YOU HAVE LAUNCHED SUBAGENTS ON
THREE DIFFERENT OCCASIONS TO ENUMERATE THIS SHIT HOW COME YOU KEEP ON OMITTING SHIT"* and
*"why do i have to explicitly keep mentioning every single little thing?"* He was the index for
89% of it.

### Why this is not another queue document

A queue document is a snapshot with a nicer name. The distinguishing property of this RFC is that
**state is a field on the item and the only way to change it is a validated write** — so the next
enumeration reads the previous one's classification instead of re-deriving it, and a
classification that was wrong is corrected in place rather than re-litigated in a fifth document.

### Scope boundary — stated first, because [[D1525]] predicts otherwise

[[D1525]] found two successive censuses that silently scoped themselves to `apps/server` and
therefore could not find a client consumer. This instrument's scope is declared in §1, printed on
every run, and checked (W10).

**Out of scope, named:** RFC discharge rows (owned by `status-parity` P4–P6), roadmap capability
completion dimensions (owned by `roadmap-check`), UX index items (owned by `work-item-registry`;
this RFC joins to them in W8 but does not take their state), `planning/*/log.md` entries, and any
document under `archive/`.

## Specification

### 1. Scope

| | |
|---|---|
| **Unit** | one `design/BACKLOG.md` ledger row |
| **Population** | every row `tools/work-index.mjs`'s raw-row parser returns — **2,128** at the 2026-08-31 acceptance refresh |
| **Identity** | the row's `D<n>[a-z]?` id |
| **Authority for closure** | the ledger row's column-1 glyph |
| **Authority for owners** | `planning/roadmap-1.0.json` `capabilities[].owner` |
| **Not measured** | RFC discharges · roadmap dimensions · UX index items' own state · logs · `archive/` |

The instrument prints this scope sentence on every invocation, green or red, and fails if the
population it printed is not the population it parsed (W10). A census that cannot state its
denominator is the defect class [[D1525]] named.

### 2. The state vocabulary — six states

| state | means | required fields | live? |
|---|---|---|---|
| `untriaged` | recorded; nobody has classified it. **Not a promise that it will happen** | `owner: unowned`; no blocker, evidence or ruling | yes |
| `todo` | classified; it is going to happen; nobody is on it yet | `owner` ≠ `unowned` | yes |
| `doing` | a named owner is working it now | `owner` ≠ `unowned`, `since` (`YYYY-MM-DD`) | yes |
| `blocked` | cannot start; the thing in the way is named and resolvable | `owner` ≠ `unowned`, `blocker` (§5) | yes |
| `done` | landed | no owner; `evidence` + `evidenceKind` | no |
| `refused` | will not happen or was filed in error | no owner; `ruling` + `rulingKind` | no |

**Why six and not the five proposed.** `todo` / `doing` / `blocked` / `done` / `refused` cannot
express the state most of this ledger is actually in: *recorded, never classified*. Calling that
`todo` asserts an intention nobody formed. `untriaged` is the state that makes the migration
honest (§9) and the census meaningful — it is the number the ratchet drives down, and it is what
"89% unqueued" looks like once it lives on the items instead of in a dossier.

**Why `blocked` is one state and not two.** The shipped `work-item-registry` splits
`blocked_owner` / `blocked_rfc`. That encodes the blocker's *class* in the state's name and still
cannot say *which* RFC or *which* ruling — so a blocked item can outlive its blocker invisibly.
Here the class is derivable from the blocker's grammar and the blocker's *identity* is required,
which is what makes W5 possible.

**Why `refused` retains disposition strength.** [[D1320]] still applies to product decisions, but
the three current `⛔` rows are not one class: D1193 records an explicit owner rejection, D23 was
filed in error, and D306 records a transformation/technical refusal. Bootstrap therefore records
`rulingKind: source-row` and the exact ledger row rather than fabricating an owner-ruling id. A
later triage may strengthen it to `owner-ledger`; the census keeps source-row dispositions visible.

Closed states are `done` and `refused`. Live states are the other four.

### 3. Owners

An owner is a **lane, not a person and not an agent instance** — agents are ephemeral, lanes
persist. The vocabulary is **derived, not restated**: the fourteen values of
`planning/roadmap-1.0.json` `capabilities[].owner` (`coordinator`, `evidence-foundation`,
`core-loop`, `assistance-and-presentation`, `review-and-return`, `content-and-theory`, `bot-play`,
`learner-history`, `campaign`, `live-and-social`, `professional-workflows`, `client-platform`,
`account-and-data`, `release-engineering`), plus two live-state literals:

- **`OWNER`** — Marco. Legal only where a live item is `blocked` on `owner-ruling`.
- **`unowned`** — nobody. Legal only where the state is `untriaged`.

Terminal items carry no `owner`; assigning future work to a closed row would be false precision.

Deleting a capability from the roadmap therefore narrows the owner vocabulary automatically and
any item still naming it fails W3. No list of owners is written into this RFC's implementation.

**What an item with no owner means.** It means nobody is going to do it, and the instrument says
so out loud. The invariant is exact and mechanically locked (W4):

> an item is live and `unowned` **if and only if** it is `untriaged`; terminal items have no owner.

So the unowned count and the untriaged count are the same number seen from two directions, and it
is the headline the census prints.

### 4. Where the state lives

#### 4.1 The three options, honestly costed

**A — extend the ledger's status column.** No new file; the state sits where every reader already
looks. Costs, all measured at `495645ee`:

- **1,544 hand edits** to a 2,053-line prose file that every tier writes concurrently. This is not
  theoretical: `design/BACKLOG.md` held 1,544 rows at `495645ee` and **1,545 in the working tree
  during this drafting pass**, changed by another agent between two measurements an hour apart.
- The column already conflates *kind* with *closure* across **12 distinct values** — `✅` 573,
  `🐞` 560, `📊` 170, `💡` 152, `⚖️` 60, `🔬` 16, `🔨` 4, `⛔` 3, `🛠` 2, `🏗` 2, `⚠️` 1, and **one row
  (`D1534`) carrying no glyph at all**, which `work-index` silently reads as open with the entire
  row description as its "state" string. Adding a third dimension to that column makes it worse.
- The ledger's own documented vocabulary is already false: its header declares
  `💡 → 📐 → 🔬 → 📜 → ⛔`, and `📐` and `📜` appear **zero** times in column 1.
- The row is not reliably machine-writable: **53 of 1,544 rows do not have three cells** (9 have
  two, 44 have more than three, one has ten), because pipes appear inside backticked prose.

**B — a generated sidecar, joined to the row by a digest of its exact bytes.** Costs: a second
place to look; roughly 300 KB of generated JSON; and it can go stale. The staleness is the real
cost and it is answered directly — W1 (population), W6 (closure parity) and W7 (digest freshness)
make a stale sidecar **red**, not invisible. This is the pattern already shipped and already
trusted in this repo: `planning/work-items-1.0.json` + `sourceDigest` + `--sync` +
`make work-item-check`.

**C — a database.** Refused; out of scope by instruction and by proportion.

#### 4.2 Decision

**B.** `planning/work-state.json`, generated, one entry per ledger row, joined by digest.

**The residual risk, stated rather than finessed:** B's failure mode is a check that goes red and
gets `--no-verify`'d until somebody deletes it. Two things answer that. The census (W10) prints on
**green** runs too, so the untriaged number is visible without an audit rather than discoverable
only by one. And the ratchet (W9) makes *raising* the ceiling itself a red condition, so the
number cannot be quietly re-based.

### 5. The store

```json
{
  "schemaVersion": 1,
  "scope": "design/BACKLOG.md ledger rows",
  "authority": "design/BACKLOG.md",
  "ownerAuthority": "planning/roadmap-1.0.json",
  "untriagedCeiling": 817,
  "items": [
    {
      "id": "D1523",
      "state": "todo",
      "owner": "coordinator",
      "sourceGlyph": "🐞",
      "sourceDigest": "sha256:…",
      "uxItems": []
    }
  ]
}
```

Per-state additional fields: `since` (`doing`), `blocker` (`blocked`), `question` (`blocked` on
`owner-ruling`), `evidence` + `evidenceKind` (`done`), `ruling` (`refused`).

`sourceDigest` is `sha256` over the ledger row's exact bytes — the full line, id, glyph,
description and disposition cells included. `sourceGlyph` is the single leading grapheme after
the id, not the whole status cell. `uxItems` is the sorted reverse join of every UX work item whose
summary or note cites the ledger id, including historical references from live UX work to terminal
ledger rows. Items are sorted by id. The file is generated; it is never hand-edited.

**The blocker grammar is closed at three forms.** Anything else fails W3.

| form | resolves against | red when |
|---|---|---|
| `rfc:<name>.md` | the `## Active` table of `rfc/README.md` | the name is absent, or appears only under `## Archive` |
| `item:D<n>` | this registry | the target's state is `done` or `refused`, or the id is not a ledger row |
| `owner-ruling` | Marco | `owner` is not `OWNER`, or `question` is missing or empty |

**There is deliberately no `blocker: other`.** A blocker nobody can name is not a blocker; it is
an `untriaged` item wearing a label, and the label is precisely how [[D1523]]'s loop restarts.

### 6. The instrument — `tools/work-state.mjs`, `make work-state`

`tools/work-index.mjs` remains the population authority. It gains `parseLedgerSourceRows`, and its
existing `parseLedgerRows` delegates to that export while returning the same `{id,state,open}`
objects as before. Citation and assignment remain different questions: work-index catches an id
that appears in no durable document at all; this catches an id that appears in one and is still
going nowhere.

| check | what it asserts |
|---|---|
| **W1 Population** | the registry's id set is **set-equal** to `parseLedgerSourceRows(design/BACKLOG.md)`, imported from `tools/work-index.mjs` rather than re-implemented. Missing and extra ids are both listed |
| **W2 Row well-formedness** | every ledger row's column 1 is one `D<n>[a-z]?` id followed by exactly one glyph from the thirteen-value acceptance-tree set: `🐞 ✅ 📊 💡 🛠 ⚖️ 🔬 📝 📜 🔨 ⛔ 🏗 ⚠️` |
| **W3 Vocabulary** | every `state` is one of six; every `owner` is one of the fourteen derived lanes, `OWNER` or `unowned`; every `blocker` matches one of the three forms |
| **W4 Field completeness** | the per-state required fields of §2 are present and non-empty; forbidden fields are absent; and **live ∧ `unowned` ⟺ `untriaged`** |
| **W5 Blocker liveness** | every `blocker` resolves live per §5 |
| **W6 Closure parity** | `✅` ⟺ `done` and `⛔` ⟺ `refused`, in **both** directions |
| **W7 Digest freshness** | every entry's `sourceDigest` equals the digest of the row's current bytes |
| **W8 Cross-store join** | `uxItems` equals the reverse join derived from every UX item's summary and note. Live UX items may cite terminal ledger rows as historical evidence; those references are printed, not rejected. Only live→live references with exactly one distinct capability owner infer execution ownership |
| **W9 Untriaged ratchet** | `count(untriaged) ≤ untriagedCeiling`, **and** the ceiling is ≤ the ceiling in `git show HEAD:planning/work-state.json`. Skipped in a non-git fixture root, exactly as `status-parity`'s `checkP7` already does |
| **W10 Census** | the scope sentence, six state counts, live-per-owner counts, `closeout-prose` count, `source-row` refusal count, live-UX→terminal reference count and `untriaged / live` percentage are printed on **every** run; printed population equals parsed population |

Exit code 1 on any failure; every failure names the ids.

### 7. Commands

- *(no flag)* — check. Runs W1–W10.
- `--bootstrap` — the migration of §9. Refuses to overwrite an existing store. **Idempotent**: run
  twice on the same ledger bytes it produces byte-identical output.
- `--sync` — reconcile population and digests after the ledger moves. Inserts newly seen rows as
  `untriaged`/`unowned`, drops entries whose row is gone, refreshes digests where the row's text
  changed but its closure glyph did not. **Never** changes an existing state and **never** raises
  the ceiling; where inserting new rows would exceed it, `--sync` fails and prints the ids that
  must be given a state in the same commit.
- `--set=D<n> --state=<s> [--owner=…] [--since=…] [--blocker=…] [--question=…]
  [--evidence=…] [--evidence-kind=…] [--ruling=…] [--ruling-kind=…]` —
  the single write path for state. Validates W3–W6 before writing. Lowers the ceiling by one for
  each item that leaves `untriaged`.
- `--json` — machine-readable census plus the failing checks.

A ledger row may be added at any time — law 4 is not weakened. It must acquire a state in the same
commit, which is the same closeout discipline `status-parity` P7 already enforces for RFC archival
and the CLAUDE.md clause already enforces for content waves.

### 8. Wiring

- `Makefile`: a `work-state` target running `node --test tools/work-state.test.mjs` then
  `node tools/work-state.mjs`, and added to `verify-governance`.
- `tools/staged-process-contracts.mjs`: `work-state` joins `PROCESS_CONTRACT_TARGETS`, so it runs
  against the **materialised git index**, not another worker's unstaged tree.
- `planning/roadmap-1.0.json`: `work-state.md` is added to `capabilities.governance.rfcs`
  (`roadmap-check` requires active-RFC set equality, so this is not optional). The governance
  capability's `state` dimension already reads *"Every live item has one durable state, one owner,
  and one capability"* at `partial`; **this RFC does not flip it** — the implementing change set
  proposes the flip and the owner rules on it.

## 9. Migration

All 2,128 rows acquire state by deterministic derivation. The acceptance refresh measured 683
`✅` rows, three `⛔` rows and 1,442 live rows after repairing D1534's missing glyph. Rules apply in
order; the first match wins:

| # | rule | → state | acceptance-refresh yield |
|---|---|---|---|
| 1 | source glyph is `✅` | `done`; evidence classified from the source row | **683** |
| 2 | source glyph is `⛔` | `refused`; `ruling: ledger:<id>`, `rulingKind: source-row` | **3** |
| 3 | open row cited by live UX work with exactly one distinct capability owner | `todo`, that owner | **47** |
| 4 | everything else, including four multi-owner conflicts | `untriaged`, `unowned` | **1,395** |

`doing` and `blocked` are zero at migration. Nothing in the tree proves an agent is actively
working a row, and prose such as "blocked on the platform work" is not a safe blocker identity.
Inventing either would repeat the assertion-over-derivation failure [[D1526]] names.

For a `✅` row, bootstrap records the strongest mechanically identifiable evidence kind:
`commit` for a hexadecimal commit token, `path` for a repository path, otherwise
`closeout-prose`, with the exact source row as evidence. The census prints `closeout-prose`
separately because a green row without a machine-resolvable landing proof is weaker evidence.

The three `⛔` rows are heterogeneous. Rather than manufacture an owner ruling that does not
exist, bootstrap preserves their exact source rows through `rulingKind: source-row`; W10 keeps
that weaker class visible. A later triage may strengthen one to `owner-ledger`.

Ten live UX items cite terminal ledger rows as historical evidence. That is legal and is printed
as a cross-store diagnostic. It is not execution ownership: only live→live references participate
in rule 3, and only an unambiguous single owner can promote a row to `todo`.

The ceiling is initialized to 1,395, the bootstrap's own untriaged count. From then on it only
falls.

## Deviations from design

None. This RFC specifies no product behaviour and cites no `design/` section.

**Intent-amendment check (CLAUDE.md, 2026-08-24 clause), run rather than asserted:** `design/00`–
`06` were searched for sentences this change set would falsify — the four hits on `BACKLOG` are
citations of individual ledger rows as evidence (`design/03:427`, `design/04:221`,
`design/05:141,431,438,509`), none of which asserts anything about how ledger rows carry state.
`design/BACKLOG.md`'s own header **does** declare a status vocabulary that this RFC contradicts,
but the ledger is not an intent document — it is the shared register every tier writes to — so no
`planning/platform-alignment/` amendment is owed. The implementing change set must re-run this
check against the tree it actually produces; drafting falsifies nothing.

## Acceptance criteria

Each criterion names the concrete tree state that makes it **RED**. Criteria that cannot fail are
the named defect class [[D444]] / [[D984]] / [[D1274]]. The acceptance refresh repaired the one
malformed production row; permanent negative fixtures keep the criteria able to fail.

1. **Population is joined, not re-parsed.** `tools/work-state.mjs` imports
   `parseLedgerSourceRows` from
   `tools/work-index.mjs`. **RED:** append a ledger row without running `--sync` (W1 lists it as
   missing); delete a ledger row and leave its entry (W1 lists it as extra); replace the import
   with a local regex and the fixture that pins the two parsers to the same population fails.
2. **Malformed rows are caught.** D1534's missing status glyph is repaired in the implementing
   change set; re-deleting it makes W2 red. A fixture pins all **13** accepted glyphs and one
   glyphless row.
3. **The parser survives the ledger's real shapes.** A permanent fixture contains one row of each
   observed shape: 2 cells, 3 cells, 10 cells, a backticked `|` inside the description, and a
   lettered id (`D123a`). **RED:** narrow the row parser to `split("|")` with a 3-cell assumption
   and 53 rows change identity, failing W1 and W7.
4. **Vocabulary is derived.** The owner set is read from `planning/roadmap-1.0.json`. **RED:** set
   an item's owner to `claude` or `marco`; rename a roadmap capability's owner without syncing.
   **RED:** set a state to `in-progress` or `wontfix`.
5. **`refused` retains its disposition basis.** **RED:** omit `ruling` or `rulingKind`; use a
   `rulingKind` outside `owner-ledger | source-row`; or claim `owner-ledger` without a `ledger:D<n>`
   identity. The bootstrap uses `source-row` for the three heterogeneous existing refusals and
   W10 prints that count rather than laundering it as owner authority.
6. **`doing` cannot be anonymous.** **RED:** any entry with `state: doing` and
   `owner: unowned`, or with no `since`, or with a `since` that is not `YYYY-MM-DD`.
7. **The unowned/untriaged biconditional holds.** **RED:** `{state: todo, owner: unowned}`;
   **RED:** `{state: untriaged, owner: core-loop}`. Both directions are fixtured.
8. **Blockers are live.** **RED:** `blocker: rfc:claim-backing.md` where that file sits under
   `rfc/archive/`; **RED:** `blocker: item:D23` where `D23` is `refused`; **RED:**
   `blocker: owner-ruling` with `owner: coordinator` or with an empty `question`; **RED:**
   `blocker: "waiting on the platform work"` (free text is not one of the three forms).
9. **Closure parity is bidirectional.** **RED:** flip a row to `✅` in the ledger and leave its
   entry `todo`; **RED:** set an entry to `done` while its row still reads `🐞`. Both arms are
   fixtured — a one-directional check is how [[D1274]]'s half-criterion happened.
10. **Staleness is red, not invisible.** **RED:** edit a ledger row's description without
    `--sync`; W7 names the id. **RED:** hand-edit `planning/work-state.json` to change a digest.
11. **The cross-store join holds without confusing evidence with ownership.** **RED:** delete or
    add an id in `uxItems` that disagrees with the derived reverse join. A fixture proves a live UX
    item may cite a terminal ledger row as historical evidence; the census counts that reference.
    A separate fixture proves only a live ledger row with one distinct live UX owner becomes
    `todo`; multi-owner rows remain `untriaged`.
12. **The ratchet only turns one way.** **RED:** raise `untriagedCeiling` above its value at
    `HEAD`; **RED:** add three ledger rows in one commit without giving them states, so the
    untriaged count exceeds the ceiling. The check degrades to skipped — not passed silently — in
    a non-git fixture root, and that skip path is itself fixtured.
13. **The census cannot be narrowed silently ([[D1525]]).** The run prints the scope sentence, the
    parsed population, all six counts, per-owner live counts, `closeout-prose`, `source-row`
    refusals, live-UX→terminal references, and `untriaged / live`. At bootstrap the headline is
    `1395 untriaged of 1442 live (96.7%)`; a smaller denominator fails population equality.
    **RED:** make the census print only on failure.
14. **Bootstrap is idempotent and derived.** Running `--bootstrap` twice on identical ledger bytes
    produces byte-identical JSON. **RED:** any rule in §9 that consults wall-clock time, file
    mtime, or map iteration order.
15. **Bootstrap produces a green tree.** Immediately after `--bootstrap`,
    `node tools/work-state.mjs` exits 0. **RED:** infer a blocker from prose, assign a multi-owner
    row to one arbitrary lane, or create `done` without an `evidenceKind`.
16. **`work-index` keeps its public contract.** Its parser fixture proves `parseLedgerRows`
    returns the same `{id,state,open}` shape and the CLI reports the same census after the raw-row
    export is added. **RED:** leak `sourceLine`/`sourceGlyph` into the old parser or change routing.
17. **Governance wiring.** `make work-state` exists, is part of `verify-governance`, and appears in
    `PROCESS_CONTRACT_TARGETS`. **RED:** delete it from either list — the pre-commit snapshot then
    accepts a commit that adds an unstated ledger row.
18. **No product change.** `git diff` contains no file under `apps/`, `packages/`, `schemas/`,
    `content/` or `archive/`. `make register-check` reports **C1–C8** green ([[D1526]]: naming
    C1–C7 omits exactly the check that fires on a `none` claims block, which is what this RFC
    declares). `make status-parity` reports P1–P7 green.
19. **Closeout.** The implementing commit flips the `design/BACKLOG.md` rows it ships, appends its
    entry to `planning/exploration/log.md`, re-runs the intent-amendment check of §Deviations, and
    applies the owner-approved `governance.state` roadmap flip with a dated checkpoint. The ledger
    header's false glyph vocabulary remains a separately ledgered correction unless required by
    the implementation.

## Discharges

none

## Open questions

1. **Should the ledger's status column be reduced to the two closure glyphs once state lives in
   the sidecar?** **No** — not in this RFC. The eleven glyphs carry *kind* (`🐞` defect, `📊`
   measurement, `💡` candidate, `🔬` researched), which is orthogonal to execution state and is
   read by humans scanning the file. Reducing them is a separate change to a shared register and
   would be a hand pass over 1,544 rows for no mechanical gain.
2. **Should `planning/work-items-1.0.json` be folded into `planning/work-state.json`?** **No** —
   deliberately deferred, and W8 is the price of deferring it. The UX registry's authority is a
   different document with a different item identity; merging them is a 397 KB rewrite that would
   have to land in the same commit as the migration. If W8 ever goes red-and-ignored, the merge
   becomes the correct answer and this question reopens with evidence.
3. **Who triages the 1,395?** This RFC deliberately does not assign 1,395 rows by fiat. It creates
   the state and makes the
   number visible; commissioning the triage is an owner act, and specifying it here would be the
   same overreach [[D476]] recorded when an RFC implied it could commission a wave. The census
   prints the per-owner live counts so the commission can be made against a real distribution.
4. **Does `blocked` need a `since` too, to expose blockers that never move?** Deferred, with the
   reason stated: it is cheap to add and W5 already makes a *dead* blocker red, which is the
   failure that actually recurs. Routed to open question 4 of this RFC's own planning doc rather
   than to a new ledger row, per [[D1503]].

## Acceptance-refresh findings

- D1534's missing glyph is repaired by this implementation and permanently fixtured.
- [[D2377]] owns the missing raw-row contract between `work-index` and this instrument.
- [[D2378]] owns the evidence-versus-execution distinction in the UX reverse join.
- The ledger header's historic vocabulary remains inaccurate; the instrument derives and pins the
  actual thirteen-value set without rewriting the intent-neutral ledger header in this RFC.
- The three `⛔` rows remain heterogeneous source dispositions and are exposed as such.

## Changelog

- 2026-08-26: created.
- 2026-08-31: accepted on owner instruction; refreshed against 2,128 rows; removed unsafe prose
  blocker inference; repaired terminal-owner and UX historical-reference semantics.
- 2026-08-31: implemented and archived; D1523, D1741, D2377 and D2378 closed.
