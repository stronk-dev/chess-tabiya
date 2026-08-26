# AssistanceConfig register log

## 2026-08-26 — Draft opened

Research gate passed in `design/research/assistance-config-shared-resource.md`. Draft specifies a
format/order-insensitive AST digest, one sequential head+1 writer, twelve able-to-fail mutation
classes and no product-byte changes. Guided Hint is the proposed sole v5 owner; presets retain a
dependency rather than a second claim. Awaiting independent process/buildability review.

## 2026-08-26 — Pre-review buildability corrections

The first self-review found three exact contract gaps before the independent pass. [[D1627]]:
syntax-only direct-union extraction would reject v5's already-specified
`"off" | HintRung`, whose domain resolves through an imported readonly tuple. The draft now uses a
workspace TypeScript `Program`/`TypeChecker`, normalizes resolved literal domains and fails on broad
or non-literal residue. [[D1628]]: RFC-0000 is already generic, so naming one current resource there
would create a prose inventory; it is removed from the file boundary. [[D1630]]: the shipped
`derivedOutput` fallback assumes every non-schema/non-migration resource is `evidence-kinds`, so
the RFC now pins the assistance output branch and fixture.

The adjacent v5 product seam is separately ledgered as [[D1629]]: registration alone does not bind
the hand-written browser parser/migrations to runtime's type. `hint-distance` now requires one pure
runtime codec consumed by web and a TypeChecker-derived persistence conformance matrix. The process
register remains product-byte-free and ready for independent review; implementation is not
authorised yet.
