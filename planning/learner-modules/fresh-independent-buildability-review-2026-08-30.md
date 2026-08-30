# Module registration — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/module-registration.md` after the D1863–D1869 author amendment
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make module-registration-fresh-review` — 7/7 blocker arms
- **Prior contract:** `make module-evidence-assembly` remains green (12/12)
- **Production status:** untouched; no module declaration, consumer, binding, assembler, route,
  component, seat or staged-move path is authorized

The amendment repairs the previous return's seven findings in intent. In particular, it stops
pretending that the server can read browser storage, retires the duplicate arrows consumer,
publishes the capability image, validates staged inputs and names the assembly operation that was
missing. The fresh pass tested whether those repaired nouns now determine executable bytes. They
do not yet: the 207-pair population is an acceptance inventory, not a complete execution,
manifest, reduction or delivery contract.

## B1 — the 117-projection execution plan has no callable population ([[D2120]])

§2.5 requires `MODULE_EVIDENCE_EXECUTION_PLAN` to carry `operationSymbol` and a callable
`operation`, with symbol/function identity checked at import. No literal plan is published and no
`apps/server/src/module-evidence-assembler.ts` exists. The D1865 harness instead assigns each
producer id one coarse stage string. It never imports, resolves or calls a collector/provider
operation. Thus all 117 accepted projections can remain unreachable while the advertised 12/12
assembly contract passes.

**Required repair:** publish the complete plan as an executable author fixture or generated
artifact, with an actual callable for every compiled projection, exact subject kind/timing and a
positive witness through every operation family. Make a missing, wrong-symbol, wrong-stage and
zero-reach operation fail independently.

## B2 — acceptance pairs do not determine complete F1 bindings ([[D2121]])

`EvidenceBinding` requires timing, roles, sessions, forms, answer content, latency and budget in
addition to producer/projection/consumer/adapter identity. The RFC derives only the 207
consumer/projection acceptance pairs. Module-level forms are a broad capability set and a
projection may support several forms; no rule derives the exact binding subset or the remaining
fields. Evidence-presentation then promises adapters for every *bound form*, but the module RFC
never says what those forms are.

**Required repair:** define one total binding compiler from module declaration plus projection
declaration to every required F1 field. Publish the exact intersection/narrowing rules and refuse
empty, widened and arbitrary selections. The author fixture must set-equal the resulting bindings,
not just the consumer/projection keys, and cross form, latency, budget, session, role and timing
drift.

## B3 — output budgets stop at facts, before output exists ([[D2122]])

The module contract declares `maxFacts`, `maxWords`, `maxMarks` and `maxArrows`. The reducer and A9
enforce only `maxFacts`; §6 adds an arrow clamp. `maxWords` and `maxMarks` have no counting unit,
ordering or overflow behavior. This is not cosmetic: one admitted fact may fan out into multiple
registered presentation components after reduction, so a two-fact packet can exceed both limits
without violating any current criterion. That recreates the overflowing raw-evidence UX the
module layer exists to replace.

**Required repair:** define a deterministic post-adapter fit pass that never truncates grounded
sentences or detaches marks from their owning component. Specify word-token and mark identities,
component priority, atomic drop behavior, loud reduction receipts and arrow/mark overlap. Cross one
fact producing multiple components and independent overflow of all four budgets.

## B4 — Review is an unbounded whole-run request ([[D2123]])

The review frame walks every distinct node/edge, computes recorded and derived facts and can invoke
optional providers. `ModuleQueryRequest` has only optional `nodeId`; it carries no cursor, limit,
snapshot extent or whole-job budget. `ModuleQueryPage` has no continuation. The top-eight Review
cap applies only after assembly and reduction, so it does not bound the expensive work. A long
import can monopolize one authenticated request or produce a response too large to deliver.

**Required repair:** bind review to an immutable run-prefix digest and specify bounded batching,
continuation identity, total/per-source budgets, cancellation and deterministic merge/reduction.
Cross a run longer than one page, a mutation between pages, duplicate/omitted boundary nodes,
provider cancellation and a final top-eight result equal to the single-pass oracle.

## B5 — the authorization role vocabularies do not join ([[D2124]])

`AssistanceContext.role` is `solo | host | participant | spectator`. Module/F1 ceilings use
`EvidenceRole`, whose learner-facing member is `learner`, not `solo`. The RFC says the server
derives role and applies the ceiling but defines no total translation. Comparing strings removes
every module from a solo run; inventing a call-site mapping creates an unregistered authorization
decision.

**Required repair:** publish one closed, reused role projection (at minimum `solo → learner` and
the identity cases), state how absent/author/operator identities are refused, and use the projected
role for both module and F1 binding checks. Cross every source role and an unknown value at the
route boundary.

## B6 — Full Inspector's empty state is unrepresentable ([[D2125]])

`ModuleEmptyBehavior.stated_absence` stores one sentence, and A8 requires a zero-eligible module to
render exactly its declared empty behavior. §5.2 instead promises `full_inspector` a per-family
absence line. There is no family-keyed empty declaration or source-result component in the module
contract. An implementer must either show one misleading aggregate sentence, omit partial family
absence, or invent a second UI contract.

**Required repair:** choose and type the intended behavior. If Inspector is family-partitioned,
declare the closed family set and one `available/no_witness/unavailable/not_requested/failed`
state per demanded family, joined to source receipts. If only whole-module empty is intended,
remove the per-family promise and provide an honest aggregate sentence. Cross mixed availability,
not merely all-empty.

## B7 — derived operations have ordering prose but no input graph ([[D2126]])

The author harness counts 64 accepted pair occurrences as `derived_after_inputs`. The RFC says
derived projections run only after literal inputs exist, but neither artifact declares which exact
projections (or alternatives) each derivation consumes, whether inputs must share subject/source
identity, or how abstention and failure propagate. A callable derived operation can therefore
recompute inputs, consume the wrong authority or run after a merely similarly named source while
the 117-projection closure stays green.

**Required repair:** publish an executable derivation DAG over versioned projection ids, including
AND/OR input alternatives, same-subject constraints, topological order, shared execution and total
result propagation. Set-equal it to every derived operation in the assembly plan and cross missing,
wrong-subject, cyclic, recomputed and unavailable-input cases.

## Re-review order

1. Publish the complete callable operation population and its derivation DAG.
2. Compile complete F1 binding fields and exact presentation forms from one authority.
3. Define all four output-budget semantics and family-partitioned empty behavior.
4. Bound and page whole-run Review, then close the role vocabulary join.
5. Invert all seven arms, preserve the existing 12 checks, run governance and full verification,
   then request another fresh review.

No production or protected-design byte is authorized by this return. Dependencies already marked
returned or owner-blocked remain independently blocking; this review does not treat their future
repair as evidence that these seven local contracts exist.
