# R18 release-platform browser probe

Disposable research instrument for platform-alignment R18. It inspects a running committed build;
it does not import product code or mutate the repository's product/content state.

```sh
node tools/r18-release-platform-harness/run.mjs \
  http://127.0.0.1:43180 \
  planning/platform-alignment/release-platform/browser-results.json
```

The probe registers its own disposable learner, records no password or session token, starts the
named Anti-Caro pack, and writes mechanical DOM/accessibility, focus, viewport and PWA facts. It
cannot establish screen-reader-user usability.
