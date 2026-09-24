# Proposed intent amendment: `design/02` and `design/03` after provider health landed

**Filed:** 2026-09-24 · **By:** claude (provider-health implementation lane) · **For:** OWNER
**Trigger:** `CLAUDE.md` clause added 2026-08-24 ([[D1505]]). A change set that falsifies a sentence
in `design/00`–`06` must add a proposed intent amendment to `planning/platform-alignment/` in the
same commit. The amendment names the file, the exact sentence, and what is now true.
**Change set:** `rfc/provider-health-degradation.md`, one claim-free checkpoint (receipt:
`planning/provider-health-degradation/implementation-receipt-2026-09-24.md`).
**Law 5 holds:** nothing in `design/` is edited. This file reports that intent now disagrees with
the tree. It changes nothing by itself.

---

## 1. Falsified: `design/02-product-shape.md:73`

**Exact phrase:**

> capabilities stay green on Maia loss

**What is now true.** `/capabilities` reads the live provider-health registry and does not probe.
When the Maia sidecar exits, the supervisor reports it and `maia-inference` becomes `unavailable`,
or `degraded_cached_only` while exact cached selections remain. The human-style modes then report
that state in `providerHealth.policyModes`. A new position gets a typed 503 `PROVIDER_UNAVAILABLE`
inside the 4 s compiled budget. The warmed position is served once more, labelled `cached_exact`.
This is the permanent R18 fixture in `apps/server/src/opponent-selector-health.test.ts`.

Two parts of the floor are still open. The release-profile proof on the digest-pinned CPU tier is
Discharge D1 / F12-H. `/readyz` does not exist yet (F12-A).

**Suggested wording.** Remove "capabilities stay green on Maia loss" from the list of R18 findings
below the floor, or mark it "repaired 2026-09-24 by `provider-health-degradation`, with the
release-profile proof owned by F12-H".

## 2. Falsified: `design/03-product-breadth.md:330` (B8 row)

**Exact phrase:**

> Maia loss leaves capabilities green

**What is now true.** The same repair as §1. In the client, a failed opponent pauses the run before
any opponent move is committed and offers Retry and Change opponent. Provider-backed controls stay
in place with their reason and do not disappear.

**Suggested wording.** Remove "Maia loss leaves capabilities green" from the B8 residual list, and
keep the other floor items as they are.
