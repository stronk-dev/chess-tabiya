# Authored explanation surface — implementation plan

RFC: `rfc/authored-explanation-surface.md` revision 3.

Checkboxes flip only in commits carrying their exercising tests. The initial-
opponent prerequisite lands separately before the authored-feedback browser
acceptance test.

## 0. Lifecycle

- [x] RFC accepted after adversarial review
- [x] Planning job opened and RFC status set to implementing

## 1. Initial-opponent prerequisite

- [x] Start a writer-owned run with an opponent ply when the FEN turn differs from `start.side`
- [x] Do the same on writer resume when no checkpoint blocks; never for followers
- [x] Give the mock selector a deterministic Pack A path
- [x] Load Pack A in the browser harness without assuming exactly one registered pack

## 2. Server projection and transport

- [x] Add typed authored pack fields and the tail-prose warning
- [x] Project supported items path-relatively with occurrence attribution and deterministic ordering
- [x] Bind `GET /runs/:id/authored-feedback` and cover delayed/segment/rewind/sibling/extraction cases

## 3. Client surface

- [ ] Add the typed REST client and session-state loading
- [ ] Render exact-occurrence checkpoint feedback and post-reveal timeline markers
- [ ] Render only the coarse withheld-content status
- [ ] Pass the Pack A Playwright acceptance

## 4. Close implementation

- [ ] Update `docs/explanation-grounds.md`, including the Maia correction
- [ ] `ENGINES_REQUIRED=1 make verify` and `make test-browser` green
- [ ] Append final measurements/findings to `log.md`
