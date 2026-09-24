# Proposed intent amendment — `design/03` B1 and B4 after intent-presets Checkpoint A

**Filed:** 2026-09-24 · **By:** claude (intent-presets implementation lane) · **For:** OWNER
**Trigger:** `CLAUDE.md`, clause added 2026-08-24 ([[D1505]]): *a change set that falsifies a
sentence in `design/00`–`06` adds a proposed intent amendment (the file, the exact sentence, and
what is now true) to `planning/platform-alignment/` in the same commit.*
**Change set:** implementation of `rfc/intent-presets.md` Checkpoint A (receipt:
`planning/intent-presets/checkpoint-a-implementation-2026-09-24.md`).
**Law 5 holds:** nothing in `design/` is edited by this pass. This file reports that intent now
disagrees with the tree. It does not enact anything.

---

## 1. Falsified: `design/03-product-breadth.md:323` (B1, status cell)

**Exact phrase:**

> The true residual is quality, not capability: unstyled natives, no presets, checkbox-above-label

**What is now true.** `/settings` has presets. Each of the eight workflow contexts has one **Help
style** select that offers exactly that context's `allowedPresets` (Quiet, Guide me, Theory only,
Support, Analyze; for example, Match offers Quiet only). The 72 raw primitives (9 fields × 8
contexts) and a ten-module include/exclude list sit under a collapsed **Advanced** disclosure per
context. The run's topbar pill chooses among the same presets, and the choice changes the default
modules and config through the server compiler (`POST /runs/:id/assistance`). A raw value above the
chosen preset shows as **Custom**.

**Suggested wording.** Replace "no presets" with "presets ship as validation-gated candidates
(intent-presets Checkpoint A, 2026-09-24; names, promises and defaults await owner use per
Discharge D1)".

## 2. Narrowed: `design/03-product-breadth.md:326` (B4, status cell)

**Exact phrase:**

> Feedback Stage 2 + F5's module eligibility/presets remain

**What is now true.** The preset half of F5 has a compiler and a surface. The module half does not
yet deliver: no module renders through `compiled.modules`, because `module-registration` is still a
draft with `requirements_only` artifacts. That remaining half is intent-presets' Checkpoint B
(Discharge D5).

**Suggested wording.** "Feedback Stage 2 and F5's module eligibility/delivery remain; the preset
compiler and surface shipped 2026-09-24 (Checkpoint A)."
