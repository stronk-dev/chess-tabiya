# Learner identity and authorization implementation plan

RFC: `rfc/learner-identity-and-authorization.md`.

The owner authorized implementation on 2026-08-12. F3 lands completely before F2 begins.

- [ ] §1 Storage migration 2, learner/session/grant persistence, and atomic lease transfer
- [ ] §2 Authentication and authorization services with typed HTTP errors
- [ ] §3 Run service and REST boundary; no writer credential in read responses
- [ ] §4 Client session gate, lease claim/resume, role and possession projections
- [ ] §5 Acceptance tests, browser coverage, canonical docs, and full verification

Checkboxes flip only in commits that contain the exercising tests.
