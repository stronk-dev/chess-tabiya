# Drill Client — implementation plan (foundations-first, owner-confirmed order)

RFC: `rfc/drill-client.md` (accepted 2026-08-12). Assignee: codex.
`[x]` flips only with the exercising test. Layers land IN ORDER — no screen
work before its plumbing exists.

## 1. Server surface (backend foundation — zero pixels)

- [x] Pack registry: load schemas/ fixtures + content/packs at boot; lint on
      load, refuse failures; serve GET /packs (summary) + GET /packs/:id;
      server-side RFC-8785 digest
- [x] Pack-aware orchestration: POST /runs takes packId; per committed move,
      inside the same mutation: checkpoint triggers → reachCheckpoint,
      objective rules → evaluateObjective; atomic emitted-event response
- [x] Auto-enqueued per-move eval job (ratified 100ms profile)
- [x] Server-side feedbackPolicy withholding on /graph, /events, /evidence
      (rules-derived evidence exempt); tests per policy mode
      (delayed_checkpoint, segment_end; blunder_guard rejected as v1 pack)
- [x] GET /runs/:id/pgn?branches= (pack-merged when possible; filename header)
- [x] Evidence-ref grammar constructors in runtime (rules:*, pack:*, engine:*)

## 2. Client plumbing (browser foundation — no product screens)

- [x] Typed REST client for the whole surface; writer id per run in
      localStorage; resume-on-refresh; NOT_ACTIVE_WRITER → read-only mode
- [x] Run-state store from mutation-returned events (+ evidence polling 1s
      while pending, followers /events at 2s)
- [x] Bare chessground board component: orientation from start.side, legal
      move input, promotion picker, last-move/check highlights
- [x] Evidence sentence table covering every v1-emittable ref (enumerated
      CI test per RFC contract)

## 3. Screens (thin composition over 1+2)

- [ ] Pack list (mode, band, reviewStatus badge)
- [ ] Drill screen: board center + objective line; bottom timeline with
      checkpoint markers (click-preview, confirm rewind); right branch rail
      (label, divergent move, objective chip); checkpoint sheet
- [ ] Why-banner (never bare; sentence table)
- [ ] Compare view: dual boards on compare() payload, synced stepper,
      absent-side dimming, objective/checkpoint strips
- [ ] Keyboard map + ? overlay; a11y focus smoke

## 4. Packaging + acceptance (rides along, blocks nothing above)

- [ ] Playwright flow vs mock opponent; make test-browser + separate CI job
- [ ] compose.yaml (healthchecked maia via /ready entrypoint self-test,
      profiles default/engines) + make up / up-engines / down
- [ ] release.yml → GHCR multi-arch {version, sha}; compose digest-pinned
- [ ] Devcontainer sharing the toolchain (stockfish included)
- [ ] In-browser latency budgets measured → log.md
- [ ] THE WALKTHROUGH: owner plays the Najdorf fixture vs Maia end-to-end
      (make up-engines → play → R → branch → Tab → E); notes + screenshots in
      log.md
