# Bounded-policy targets — third fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/bounded-policy-targets.md` after the D2202–D2205 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make bounded-target-third-fresh-review` — 3/3 blocker arms
- **Production status:** untouched and unauthorized

The primary-manifest identity, sealed threat anchor, central value-receipt requirement and named
service protocol are good repairs. Three cross-file seams still make the promised validation and
public/private boundaries impossible to implement as written.

## B1 — the validation authority admits only one of three projections ([[D2340]])

This RFC requires semantic-validation profiles set-equal to all three bounded-target factory routes.
The dependency's root inventory explicitly selects only projections whose role is `event`. Here,
`immediate` is an event, while `named_material_target` and `bounded_return` are readings. The latter
two can receive value-factory receipts, but no positive, negative, orientation or population profile
under the cited authority. Construction provenance is not chess-semantic validation.

**Required repair:** either widen semantic-validation through its own reviewed reading-profile
amendment or name a separate executable semantic authority for reading projections. Keep all three
value routes, but do not claim they satisfy a profile system whose root set excludes them.

## B2 — the public-protocol typecheck is a false local model ([[D2341]])

The RFC says a runtime-subpath-only fixture imports and exhaustively switches the public family.
`protocol.typecheck.ts` imports nothing; it defines local lookalikes. Those bytes already disagree:
the fixture uses `preserved/cause:null` and `attacker_moved`, while the RFC uses
`preserved/cause:"preserved"`, `target_moved` and `capture_illegal`. Its green result therefore proves
neither importability nor exhaustiveness of the proposed protocol.

**Required repair:** generate exact proposed declarations into a test module or, after acceptance,
import the actual runtime subpath. Compile every consumer and crossed negative against those same
bytes; ban hand-written test copies.

## B3 — value factories are required across a module boundary but forbidden to export ([[D2342]])

The central value-authority registry must import the three exact factory symbols from an internal
factory module. The normative declarations omit `export`, while the author check explicitly fails
if `export function` appears in the operation section. TypeScript modules cannot import a private
binding from another module. The text simultaneously requires and forbids the only buildable seam.

**Required repair:** export each factory from a package-internal module but omit it from the public
barrel/package subpath. Prove the central route registry is the only non-test importer and that
application consumers receive only the service/assertion surface.

## Re-review order

1. Resolve reading semantic authority with `semantic-validation-authority`.
2. Generate/import one exact public protocol in the type fixture.
3. Make internal factory exports and the sole-registry import explicit.
4. Invert all three arms, preserve every prior contract and request fourth fresh review.

No runtime, manifest, schema, pack, content, API, client, archive or protected-design implementation
is authorized by this return.
