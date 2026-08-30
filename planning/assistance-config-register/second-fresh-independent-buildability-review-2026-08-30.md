# AssistanceConfig register — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/assistance-config-register.md` after the D2037/D2038 third-return repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make assistance-register-second-fresh-review` — 5/5 blocker arms
- **Prior contracts:** `make assistance-register-contract assistance-register-repeat-review
  assistance-register-final-review` remain green (7 + 7 + 6)
- **Production status:** untouched; C9, the register/history, v5 claim transfer and product config
  remain unauthorized

The two-commit checkout and the intent to derive rather than trust changed-source tokens are sound.
The fresh pass tested the proposed census against the current v4 persistence implementation and the
already-specified v5 landing. It exposed a phase contradiction and four completeness gaps. As
written, the process-only landing cannot satisfy its own real-tree acceptance, and a later parser,
writer or default/permission change can still escape the versioned resource.

## B1 — process landing requires product state that does not exist yet ([[D2113]])

The census contract says `loadAssistance` must delegate parsed unknown bytes to the sole runtime
`parseAssistanceConfig` export and may contain no local type guard, version switch or field-domain
validation. At HEAD there is no `packages/runtime/src/assistance-codec.ts`; `loadAssistance` reaches
local `validV4` and `migrate`, including every v1–v3 version switch. Criterion 15 requires the real
repository to prove the post-v5 shape, while criterion 8 and §6 forbid this process RFC from editing
runtime/browser product bytes.

**Required repair:** make the census explicitly phase-aware. The bootstrap must admit and seal the
actual v4 legacy authority; the claimed v5 transition may require centralization and prove the old
local authority disappears. Cross current v4, valid v5, and a v5 landing that leaves both codecs.

## B2 — the persistence writer is outside the supposedly closed authority ([[D2114]])

`saveAssistance` writes `JSON.stringify(value)` to `assistanceKey(kind)` and is used by both the
settings surface and live drill screen. The three-root census names only `loadAssistance` and calls
it the sole namespace reader. A writer can change keying or serialization independently without
entering the claimed closure.

**Required repair:** include every production read and write operation over the assistance
namespace in one executable registry/census. Bind load/save to the same key and serialized head,
and cross a second writer plus key/serializer drift.

## B3 — same-head codec, migration and namespace drift is invisible ([[D2115]])

The registered digest contains only numeric head plus resolved field names/literal domains. C9.6's
source comparison runs only on a head advance. Changing `tabiya.assistance.v1`, a v1–v4 migration
default, unknown-field policy or parser behavior at head 4 leaves the tree digest unchanged and
requires no claim, despite changing the persisted contract this register says it protects.

**Required repair:** include canonical persistence/codec semantics in resource identity, or require
any authority-closure change to consume the next lane even when the TypeScript interface is
unchanged. Cross key, legacy migration, unknown-field and serializer changes at a fixed head.

## B4 — the v5 claim is not complete for the v5 contract it gates ([[D2116]])

The exact four tokens cover two interface properties, the proposed parser and `loadAssistance`.
Adding `hintDistance` necessarily also changes `SILENT_ASSISTANCE` and the exhaustive
`permittedAssistance` record; the product RFC additionally requires preference round-trip and the
Advanced/settings projection. Those source authorities are absent while C9.6 says its changed set
is complete. Either a correct v5 landing fails set equality, or the register passes an incomplete
consumer/persistence propagation.

**Required repair:** define which construction, permission, persistence and Advanced-config
operations are part of the shared resource and derive their exact transition set. If product
consumers remain a separate contract, name its executable discharge rather than calling four roots
the complete assistance delta.

## B5 — “transitive closure” has no executable source grammar ([[D2117]])

The RFC says one root token represents its complete reachable declaration/import closure and that
direct or indirect aliases fail, while scanning TypeScript and Svelte. It does not define node/edge
types, Svelte preprocessing, alias resolution, body-versus-type changes, canonical closure bytes or
how an extra authority inside an already-named root changes the token set. The author harness
hardcodes four strings and appends a fifth; it never derives a source graph.

**Required repair:** publish a small executable authority-graph model: admitted operation kinds,
module/symbol identity, import/call edges, Svelte handling, closure hashing and exact change
classification. Use it in author fixtures against real source snippets, not a caller-provided
string array.

## Re-review order

1. Separate the current-v4 bootstrap rules from post-v5 central-codec rules.
2. Define one executable read/write/config authority graph and its identity.
3. Decide and encode fixed-head authority drift policy.
4. Re-derive the v5 claim from the actual required transition, including its consumer discharge.
5. Invert all five arms, preserve the prior 7 + 7 + 6 checks, run governance and full verification,
   then request another fresh review.

No checker, workflow, register, claim, runtime, web, schema, content, archive or protected-design
byte is authorized for implementation by this return.
