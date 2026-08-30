# Pack capability contract — D2152–D2156 fourth author repair

- **Repaired:** 2026-08-30
- **Input:** `third-fresh-independent-review-2026-08-30.md`
- **Rows:** [[D2152]]–[[D2156]]
- **RFC state:** draft; fresh independent buildability review required
- **Production/corpus state:** untouched; lanes 0.28–0.30 and [[D560]] remain held

## Result

The return is repaired at the author-contract boundary, without landing a schema or changing a
pack.

1. `rfc/contracts/pack-capability-schema-transition-v1.json` is now a cumulative three-stage
   authority. It seals exact 0.28, 0.29 and 0.30 source/post-images in owner order. The final image
   contains typed graduation clearance, corpus provenance, `provenance_note`, `citable_text` and
   required capability declarations.
2. The applicability authority is derived from that final 0.30 image, not the legacy 0.27 schema.
   It publishes all **397** target source identities literally (106 enum nodes / 321 members plus
   16 discriminated unions / 76 members), and a deterministic checked generator expands every row
   to one collision-free public capability id.
3. All 14 unconditional evaluator rows, their dependencies and all 16 constant/convention roots
   carry exact repository-relative `module#symbol` sites. The checker refuses zero or multiple
   declarations.
4. External chess behavior is inside the semantic boundary. `chessops@0.15.1`, its exact
   `sha512` integrity, lockfile key and all four manifest pins are one typed package-dependency
   source; an upgrade fixture fails.
5. Withdrawal has two closed forms: a typed successor, or `successor:null` plus typed refusal.
   Successor traversal reaches current; lawful no-successor remains visible debt; wrong-subject and
   cycle cases fail.

## Sealed images

| lane | canonical bytes | SHA-256 |
|---|---:|---|
| 0.28 | 84,113 | `c4132e4c9268a964d229323e0b6ec8dfc8723b976bd272f0b56dbe5003fcfafe` |
| 0.29 | 85,581 | `55c0095dfe381cfd5750cd4c6bdb71d2f80337f6c22616419cba798a3368a605` |
| 0.30 | 87,000 | `f7818f5ea08dd6c63efb422508174baa07868e3e11cd91a60891f151df0f25db` |

Applicability source inventory:
`f645ee0e677a9fa3aa340b0ba4f76d7a4d66eb997255c711116bcae6fbf14257`.
Expanded 397-row mapping:
`a4b424ee765f4ae556f399895f90de5a5d469722214d753c2ac53fc4d8fd86a7`.

## Executable evidence

`make pack-capability-author-contract` is green:

- closure: **7/7**;
- repeat author contract: **11/11**;
- first-return author contract: **6/6**;
- second-return author contract: **7/7**;
- fourth author repair: three cumulative stages, 397 mappings, 14 unconditional roots, 16
  constant roots and the pinned external dependency.

Repository verification also passes: `make verify` completed with **1,085 software tests**, **2
performance tests**, **172 real-content tests**, zero type errors/warnings, successful production
builds, schema/scaffold/packaging checks, and green register/status/work/roadmap/intent parity.

The third independent return instrument remains unchanged as historical evidence. Its asserted old
failure shapes are inverted by the new positive contract rather than edited away.

## Boundary

This is author repair only. It changes no production schema, runtime registry, pack, sidecar,
digest, API, client, content, archive or protected-design byte. Fresh independent review remains
required before acceptance; accepted status remains required before implementation; [[D560]] still
holds the corpus apply.
