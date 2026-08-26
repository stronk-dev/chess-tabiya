# Bot guard and dependent-trait contract

**Question:** What exact evidence authority can make the measured D969 error guard and guarded
`pawn_move ×4` policy safe to compile and execute in production?

**Feeds:** D1602–D1606, `rfc/bot-policy.md`, `rfc/bot-roster.md`, shared candidate evidence,
opponent selection.

**Method:** current-code audit plus a disposable Node-24 contract instrument. No production bytes,
profile declarations or chess judgements were authored. The instrument uses the runtime's shipped
legal-move boundary rather than a second chess implementation.

## 1. The live authority is insufficient

`BotPolicyCandidateInput` currently admits a bare `guardLossCp?: number` and caller-owned
`traits?: string[]`; `ControlledTraitLayer.classifier` is also a free string. The composer treats
every finite loss vector as priced and applies a later controlled trait even after
`provider_unavailable` or `empty_after_mask` guard abstention. `BOT_POLICY_PROFILES` remains empty
and the composer has no non-test call site. [V] (`apps/server/src/bot-policy-catalog.ts`, interfaces
and `composeBotPolicySelection`; `planning/bot-roster/buildability-return-2026-08-26.md`)

Those shapes cannot prove the D969 population's actual guard contract: one Stockfish 18 request,
Threads 1, Hash 16, cleared state, exact candidate `searchmoves`, `MultiPV = candidate count`, fixed
depth 8, final typed scores in root-side perspective, and whole-guard abstention outside one exact
cp domain. The measured population only licenses pawn weighting after that guard: it removed all
measured severe mass, while `pawn_x4_guarded` changed pawn rate by 12.2784 percentage points and
passed all registered gates; forcing and quiet traits failed. [V]
(`planning/platform-alignment/bot-policy/d969-depth8-abstain-results.md`)

## 2. One receipt, not candidate annotations

The executable repair has one acquisition request and one sealed receipt. The request binds:

- root FEN, side to move and full-history digest;
- the canonical exact legal candidate set;
- the dedicated `stockfish-guard@1` profile and its engine/version/options/bound;
- root-side score perspective; and
- final-only score rows. [V] (`tools/d1602-bot-guard-contract-harness/bot-guard-contract.ts`)

The receipt compiler refuses the entire guard on provider absence, deadline, illegal/extra,
duplicate or missing rows, bounded scores, mixed cp/mate domains, or an all-mate domain. It derives
`bestCp - candidateCp` only after those checks. The consumer verifies the receipt seal, root,
history and candidate-set identity again before applying the threshold. A structurally matching
caller object fails at the seal boundary; a real receipt for another history returns
`root_mismatch`. [V] (`bot-guard-contract.test.ts`, 10/10 arms)

This makes the score source authoritative without pretending its values are universally portable:
engine/version/depth/perspective are data, and deadline/provider failure are typed abstentions.
The combined Maia-plus-guard target and intervention threshold remain a separate production-chain
measurement; this pass deliberately does not turn D969's observed 499.1 ms maximum into a portable
deadline. [V] (`planning/bot-roster/buildability-return-2026-08-26.md` §6)

## 3. Traits are registered board facts

The smallest honest classifier registry is currently exactly one versioned classifier,
`pawn_move@1 → pawn_move`. Its adapter accepts a root FEN and candidate set, canonicalizes every
move through `exactMoveIdentity`, reads the moving role from `exactLegalMoves`, and emits a sealed
view. It classifies ordinary pawn moves, pawn captures and promotions; castling and non-pawn moves
are hard negatives. Illegal and duplicate candidates fail before classification. No API accepts a
caller-provided trait list. [V] (`tools/d1602-bot-guard-contract-harness/`)

The set of catalogued trait values and classifier outputs is mechanically set-equal. That is a
one-member result, not permission to add unmeasured personality adjectives as classifiers. New
traits require their own registered board semantics and the existing controlled-trait measurement
gate. [M]

## 4. Guard success is a dependency, not an earlier loop iteration

For the licensed pawn-forward family, composition is:

1. normalize the human-policy distribution;
2. apply the sealed guard mask;
3. only if the guard applied, multiply registered pawn candidates by four; and
4. normalize and sample.

If the guard abstains for any reason—including timeout, mixed domain, bounded row or empty mask—the
mask and dependent trait both record abstention and the unchanged normalized human-policy
distribution survives. The provider-off and deadline fixtures compare the returned mass object
exactly with the base distribution. [V] (`bot-guard-contract.test.ts`)

This is narrower than letting every trait name arbitrary prerequisites. The measured roster needs
one explicit `dependsOn: error_guard` edge; a general dependency language has no evidence here. [M]

## 5. Authoring and implementation consequences

The next author pass can now make D1602–D1604 able to fail without choosing chess truth:

- delete bare caller-owned guard losses and trait strings from the production composer input;
- name the sealed receipt and registered trait view as the only authorities;
- pin `stockfish-guard@1` as the dedicated request identity;
- make dependent-trait abstention part of the decision record; and
- require the positive/provider-off/deadline/mixed/bounded/missing/duplicate/empty/forged fixtures.

D1605 is not discharged: the run create/resume → Maia → guard → composition → persistence → card
route still needs production-boundary research and an acceptance-critical fixture. D1606 is only
half discharged: request semantics are pinned, while the combined latency budget still requires a
benchmark of the exact production chain. [V]

No RFC is accepted by this dossier, and no profile may be registered from it directly.
