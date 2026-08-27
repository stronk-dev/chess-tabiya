# Semantic-convention register log

## 2026-08-27 — Draft opened

D1722's executable census now supplies an exact 39-member initial set. The process draft adds a
distinct sorted `id@version` membership grammar, per-member collision detection, a narrowly bounded
empty-before-first-landing state and a future TypeScript-derived tree reader. It changes no product
bytes and waits on independent process/buildability review.

## 2026-08-27 — Independent review return

The review returned three buildability gaps. Full-ref collision keys allow two RFCs to advance one
convention lineage concurrently ([[D1917]]); the member-only tree projection cannot observe the
same-version semantic rewrite C10 claims to catch ([[D1918]]); and the only executable initial seed
is a private constant inside a file labelled disposable, with no durable authority specified for
C10 ([[D1919]]). A three-arm falsifier reproduces all three. [[D1920]] separately corrects the
resource count: semantic conventions would be the eighth registered resource, not the seventh.
Exact return: `independent-buildability-review-2026-08-27.md`.
