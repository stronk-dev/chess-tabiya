# D1724 square-denial and outpost boundary

Disposable research instrument. It compares current pawn control, same-file future pawn reach and
the shipped `maximal_pawn_reach@1` capture-migration convention; measures candidate versus occupied
outposts; and identifies exact pawn-move transitions that newly control squares used or occupied by
named enemy pieces. It changes no production classifier or authored content.

```sh
D1724_CENSUS=1 /opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1724-square-denial-harness/vitest.config.ts --reporter=dot
```
