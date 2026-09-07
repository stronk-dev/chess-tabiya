# Shared-resource register bootstrap — second bounded collision-core author repair

- **Date:** 2026-09-07
- **Repairs:** [[D3131]], [[D3132]], [[D3133]]
- **Gate:** `make shared-resource-bootstrap-collision-core-second-author-repair`
- **Verdict:** author repair complete; genuinely fresh review still gates acceptance

The seven-resource/three-reader cut is unchanged. The repair makes the already-ruled boundary
buildable: path-source authority is repository-root-resolved realpath plus export regardless of the
reader-kind label; `parseResourceCatalogue` receives that root explicitly; and the synthetic
extension fixture now uses `synthetic2-schema` and asserts the digit rather than matching prose.

The predecessor author/review controls remain executable. No catalogue, production checker,
register, product, schema, migration, vocabulary or content byte changed. Because this is a Codex
author repair, it is not an independent acceptance review.
