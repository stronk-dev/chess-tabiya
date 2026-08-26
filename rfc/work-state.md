# RFC: Work state — durable per-item state, a named owner, and an instrument that measures assignment

- **Status:** draft 2026-08-26 — the [[D1523]] instrument. Every number below is measured against
  `design/BACKLOG.md` at committed `495645ee`; the working tree moved under the drafting pass and
  that is recorded as evidence rather than hidden (§4.1)
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
- **Depends on:** the shipped `tools/work-index.mjs` (its `parseLedgerRows` export becomes the
  single population authority), `tools/work-item-registry.mjs` (the sidecar-plus-digest pattern
  this RFC generalises), `planning/roadmap-1.0.json` (the owner vocabulary)
- **Parent / amends:** amends `Makefile`, `tools/staged-process-contracts.mjs`
  (`PROCESS_CONTRACT_TARGETS`) and `planning/roadmap-1.0.json` (`capabilities.governance.rfcs`).
  It does **not** amend `rfc/0000-rfc-process.md` and does not change `tools/work-index.mjs`
  behaviour.
- **Supersedes / superseded by:** —
- **Planning:** `planning/work-state/` (once implementing)

```tabiya-claims
none
```

## Summary

`design/BACKLOG.md` records 1,544 items and can say, per item, only whether the row is closed.
Nothing on an item says whether the work is going to happen, or who would do it. This RFC gives
every ledger row a durable **state** (one of six), a durable **owner** (one of the fourteen
capability lanes the roadmap already declares, or `OWNER`, or `unowned`), and one instrument —
`make work-state` — whose subject is **assignment** rather than citation.

The state lives in a generated sidecar, `planning/work-state.json`, joined to each ledger row by a
digest of that row's exact bytes. `tools/work-index.mjs` is unchanged: citation and assignment are
different questions and both are worth asking. The migration derives what the tree can prove
(`✅` → `done`, `⛔` → `refused`, a resolvable blocker → `blocked`, a live UX-registry item →
`todo`) and gives the remaining **817 of 968 open rows — 84.4%** the state `untriaged`, owner
`unowned`, because that is what is true. A ratchet stops that number rising.

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
| **Population** | every row `tools/work-index.mjs`'s exported `parseLedgerRows` returns — **1,544** at `495645ee` |
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
| `done` | landed | `evidence` | no |
| `refused` | will not happen | `ruling` — a live ledger row recording the owner ruling ([[D1320]]) | no |

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

**Why `refused` requires a ruling.** [[D1320]]: an unruled refusal is a decision taken in a tier
the owner never reads. Measured at `495645ee`, all **three** `⛔` rows in the ledger name no
ruling, and one of them (`D1193`) carries `💡 open` in its own third column while its column 1
says rejected — the ledger contradicts itself on the same line and nothing notices.

Closed states are `done` and `refused`. Live states are the other four.

### 3. Owners

An owner is a **lane, not a person and not an agent instance** — agents are ephemeral, lanes
persist. The vocabulary is **derived, not restated**: the fourteen values of
`planning/roadmap-1.0.json` `capabilities[].owner` (`coordinator`, `evidence-foundation`,
`core-loop`, `assistance-and-presentation`, `review-and-return`, `content-and-theory`, `bot-play`,
`learner-history`, `campaign`, `live-and-social`, `professional-workflows`, `client-platform`,
`account-and-data`, `release-engineering`), plus exactly two literals:

- **`OWNER`** — Marco. Legal only where the item is `blocked` on `owner-ruling`, or `refused`.
- **`unowned`** — nobody. Legal only where the state is `untriaged`.

Deleting a capability from the roadmap therefore narrows the owner vocabulary automatically and
any item still naming it fails W3. No list of owners is written into this RFC's implementation.

**What an item with no owner means.** It means nobody is going to do it, and the instrument says
so out loud. The invariant is exact and mechanically locked (W4):

> an item is live and `unowned` **if and only if** it is `untriaged`.

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
description and disposition cells included. Items are sorted by id. The file is generated; it is
never hand-edited.

**The blocker grammar is closed at three forms.** Anything else fails W3.

| form | resolves against | red when |
|---|---|---|
| `rfc:<name>.md` | the `## Active` table of `rfc/README.md` | the name is absent, or appears only under `## Archive` |
| `item:D<n>` | this registry | the target's state is `done` or `refused`, or the id is not a ledger row |
| `owner-ruling` | Marco | `owner` is not `OWNER`, or `question` is missing or empty |

**There is deliberately no `blocker: other`.** A blocker nobody can name is not a blocker; it is
an `untriaged` item wearing a label, and the label is precisely how [[D1523]]'s loop restarts.

### 6. The instrument — `tools/work-state.mjs`, `make work-state`

`tools/work-index.mjs` is **not changed**. Citation and assignment are different questions:
work-index catches an id that appears in no durable document at all; this catches an id that
appears in one and is still going nowhere.

| check | what it asserts |
|---|---|
| **W1 Population** | the registry's id set is **set-equal** to `parseLedgerRows(design/BACKLOG.md)`, imported from `tools/work-index.mjs` rather than re-implemented. Missing and extra ids are both listed |
| **W2 Row well-formedness** | every ledger row's column 1 is one `D<n>[a-z]?` id followed by exactly one glyph from the closed set of eleven observed in the tree |
| **W3 Vocabulary** | every `state` is one of six; every `owner` is one of the fourteen derived lanes, `OWNER` or `unowned`; every `blocker` matches one of the three forms |
| **W4 Field completeness** | the per-state required fields of §2 are present and non-empty; forbidden fields are absent; and **live ∧ `unowned` ⟺ `untriaged`** |
| **W5 Blocker liveness** | every `blocker` resolves live per §5 |
| **W6 Closure parity** | `✅` ⟺ `done` and `⛔` ⟺ `refused`, in **both** directions |
| **W7 Digest freshness** | every entry's `sourceDigest` equals the digest of the row's current bytes |
| **W8 Cross-store join** | for every **live** item in `planning/work-items-1.0.json`, each `[[D<n>]]` it cites is a live ledger row; and no ledger row is `done`/`refused` while a UX item it lists in `uxItems` is live |
| **W9 Untriaged ratchet** | `count(untriaged) ≤ untriagedCeiling`, **and** the ceiling is ≤ the ceiling in `git show HEAD:planning/work-state.json`. Skipped in a non-git fixture root, exactly as `status-parity`'s `checkP7` already does |
| **W10 Census** | the scope sentence, the six state counts, the live-per-owner counts and `untriaged / live` as a percentage are printed on **every** run; the printed population must equal the parsed population |

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
- `--set=D<n> --state=<s> [--owner=…] [--blocker=…] [--question=…] [--evidence=…] [--ruling=…]` —
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

~1,544 rows have no state. They acquire one by **derivation**, executed by `--bootstrap`, which is
deterministic and re-runnable — so it does not go stale the way a hand pass would. Rules apply in
order; the first that matches wins. Yields are measured at `495645ee`:

| # | rule | → state | rows |
|---|---|---|---|
| 1 | column-1 glyph contains `✅` | `done` | **573** |
| 2 | column-1 glyph contains `⛔` | `refused` | **3** |
| 3 | open row whose text names a blocker **that resolves live** at bootstrap | `blocked` | **≤ 86** |
| 4 | open row cited by a **live** entry in `planning/work-items-1.0.json`, not already blocked | `todo`, owner inherited from that item's capability | **65** |
| 5 | everything else | **`untriaged`**, owner `unowned` | **817** |

`doing` is **zero** at migration: nothing in the tree records that anyone is currently working on a
ledger row, and inventing that would be the assertion-over-derivation failure [[D1526]] names.

**Rule 3's number is an upper bound and the bootstrap will land under it.** 141 open rows use a
blocker word; 86 yield an extractable referent (11 an owner ruling, 52 an RFC filename, 23 a
`[[D<n>]]` item) and 55 do not. Bootstrap assigns `blocked` **only where the referent resolves
live** — an RFC that has since been archived, or an item that is now `done`, produces `untriaged`
instead. This is deliberate: bootstrap must not produce a red tree, so it under-reports `blocked`
and over-reports `untriaged`. That direction of error is the honest one.

**Rule 1's evidence field is where honesty costs something.** Of the 573 `✅` rows, **33** name a
commit sha in their disposition cell, **138** name a repository path, and **402 name neither**.
`done` requires evidence, so bootstrap records `evidenceKind` as `commit` (33), `path` (138) or
**`closeout-prose`** (402) — and the census prints the `closeout-prose` count separately, because
*"a row somebody marked green"* is a weaker fact than *"a row with a sha"* and the difference must
not be laundered by a schema that accepts both silently.

**Rule 2 lands three items that are red on their own required field.** No `⛔` row names a ruling.
Bootstrap sets `ruling: "unruled"` for exactly those three, W4 counts them, and the census prints
them as the [[D1320]] backlog they are. The implementing change set closes them or converts them —
it does not paper over them.

**Why `untriaged` and not `todo` for the remaining 817.** A default of `todo` for 817 rows is a
lie: it asserts that 817 things are going to happen, which nobody decided and which the last three
enumerations already disproved. `untriaged` asserts only *recorded, unclassified*, which is
exactly true. **817 of 968 open rows is 84.4%** — the sibling number to [[D1528]]'s 89%, arrived at
independently over a different population, and the point of the migration is that it becomes
**visible on every run** instead of requiring a fourth audit to find.

The ceiling is initialised to the bootstrap's own untriaged count. From then on it only falls.

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
the named defect class [[D444]] / [[D984]] / [[D1274]]; criteria 2, 5 and 13 are **red at HEAD
today**, which is the cheapest available proof that this list is falsifiable.

1. **Population is joined, not re-parsed.** `tools/work-state.mjs` imports `parseLedgerRows` from
   `tools/work-index.mjs`. **RED:** append a ledger row without running `--sync` (W1 lists it as
   missing); delete a ledger row and leave its entry (W1 lists it as extra); replace the import
   with a local regex and the fixture that pins the two parsers to the same population fails.
2. **Malformed rows are caught.** **RED at HEAD:** `design/BACKLOG.md:95` (`D1534`) carries no
   status glyph, so W2 fails on the tree as it stands. The implementing change set repairs that one
   row; re-deleting the glyph makes it red again. A fixture pins all **11** observed glyphs and one
   glyphless row.
3. **The parser survives the ledger's real shapes.** A permanent fixture contains one row of each
   observed shape: 2 cells, 3 cells, 10 cells, a backticked `|` inside the description, and a
   lettered id (`D123a`). **RED:** narrow the row parser to `split("|")` with a 3-cell assumption
   and 53 rows change identity, failing W1 and W7.
4. **Vocabulary is derived.** The owner set is read from `planning/roadmap-1.0.json`. **RED:** set
   an item's owner to `claude` or `marco`; rename a roadmap capability's owner without syncing.
   **RED:** set a state to `in-progress` or `wontfix`.
5. **`refused` requires a ruling.** **RED at HEAD:** all three `⛔` rows carry `ruling: "unruled"`
   after bootstrap and W4 reports them by id. Greens only when each names a live ledger row
   recording the ruling.
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
11. **The cross-store join holds.** **RED:** mark a ledger row `done` while a UX item listing it in
    `uxItems` is still `queued` in `planning/work-items-1.0.json`; **RED:** a live UX item citing
    `[[D<n>]]` where that row is `refused`.
12. **The ratchet only turns one way.** **RED:** raise `untriagedCeiling` above its value at
    `HEAD`; **RED:** add three ledger rows in one commit without giving them states, so the
    untriaged count exceeds the ceiling. The check degrades to skipped — not passed silently — in
    a non-git fixture root, and that skip path is itself fixtured.
13. **The census cannot be narrowed silently ([[D1525]]).** The run prints the scope sentence, the
    parsed population, all six counts, the per-owner live counts, the `closeout-prose` evidence
    count, and `untriaged / live` as a percentage. **RED at HEAD's first bootstrap:** the printed
    line must read `817 untriaged of 968 live (84.4%)`; a build that prints a smaller denominator
    by scoping to a section of the ledger fails the population equality assertion. **RED:** make
    the census print only on failure.
14. **Bootstrap is idempotent and derived.** Running `--bootstrap` twice on identical ledger bytes
    produces byte-identical JSON. **RED:** any rule in §9 that consults wall-clock time, file
    mtime, or map iteration order.
15. **Bootstrap produces a green tree.** Immediately after `--bootstrap` on `495645ee` plus
    criterion 2's one-glyph repair, `node tools/work-state.mjs` exits 0. **RED:** any §9 rule that
    assigns `blocked` on an unresolvable referent, or `done` without an `evidenceKind`.
16. **`work-index` is unchanged and still green.** `git diff` shows no change to
    `tools/work-index.mjs`, and `make work-index` still reports its own numbers. **RED:** any edit
    to that file; any change to its reported counts.
17. **Governance wiring.** `make work-state` exists, is part of `verify-governance`, and appears in
    `PROCESS_CONTRACT_TARGETS`. **RED:** delete it from either list — the pre-commit snapshot then
    accepts a commit that adds an unstated ledger row.
18. **No product change.** `git diff` contains no file under `apps/`, `packages/`, `schemas/`,
    `content/` or `archive/`. `make register-check` reports **C1–C8** green ([[D1526]]: naming
    C1–C7 omits exactly the check that fires on a `none` claims block, which is what this RFC
    declares). `make status-parity` reports P1–P7 green.
19. **Closeout.** The implementing commit flips the `design/BACKLOG.md` rows it ships, appends its
    entry to `planning/exploration/log.md`, re-runs the intent-amendment check of §Deviations, and
    proposes — without applying — the `governance.state` roadmap flip and the correction of the
    ledger header's false glyph vocabulary.

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
3. **Who triages the 817?** This RFC deliberately does not say. It creates the state and makes the
   number visible; commissioning the triage is an owner act, and specifying it here would be the
   same overreach [[D476]] recorded when an RFC implied it could commission a wave. The census
   prints the per-owner live counts so the commission can be made against a real distribution.
4. **Does `blocked` need a `since` too, to expose blockers that never move?** Deferred, with the
   reason stated: it is cheap to add and W5 already makes a *dead* blocker red, which is the
   failure that actually recurs. Routed to open question 4 of this RFC's own planning doc rather
   than to a new ledger row, per [[D1503]].

## Proposed ledger rows — not written by this RFC

Per [[D1503]] the D1130 numbering convention is retired; these are unnumbered and
`design/BACKLOG.md` is not written by this change set.

- **`design/BACKLOG.md:95` records a ledger row with no status glyph, and both readers of the
  ledger treat it as open by accident.** `D1534`'s column 1 is `D1534 — **The accepted
  runtime-opening RFC's…`, so `parseLedgerRows` captures the entire description as the row's
  status string. One row of 1,544; nothing in the repository would ever have found it.
- **The ledger header declares a status vocabulary the ledger does not use.** It documents
  `💡 → 📐 → 🔬 → 📜 → ⛔`; column 1 holds eleven glyphs, and `📐` and `📜` appear zero times.
- **All three `⛔` rows are unruled, and one contradicts itself on its own line.** `D1193`'s
  column 1 says rejected and its column 3 says `💡 open`. [[D1320]]'s defect, sitting in the
  ledger that records [[D1320]].
- **`design/BACKLOG.md` is not reliably three-celled.** 53 of 1,544 rows have a cell count other
  than three, so any future tool that splits the row on `|` will silently mis-read them.

## Changelog

- 2026-08-26: created.
