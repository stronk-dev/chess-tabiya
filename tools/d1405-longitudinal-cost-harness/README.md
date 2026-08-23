# D1405 longitudinal projection cost harness

Disposable research instrument for
`planning/longitudinal-store/d1405-cost-preregistration.md`.

It performs no engine, provider, network or database calls. A binding result must be generated
from a clean extraction and given an explicit output directory. Run the four timing arms
**sequentially** so they do not contend for CPU, then aggregate their receipts:

```sh
for arm in 20 40 80 bulk; do
  D1405_ARM="$arm" D1405_COMMIT="$(git rev-parse HEAD)" \
    D1405_RESULT_DIR=/absolute/path/to/planning/longitudinal-store \
    pnpm exec vitest run --config tools/d1405-longitudinal-cost-harness/vitest.config.ts
done
D1405_ARM=aggregate D1405_COMMIT="$(git rev-parse HEAD)" \
  D1405_RESULT_DIR=/absolute/path/to/planning/longitudinal-store \
  pnpm exec vitest run --config tools/d1405-longitudinal-cost-harness/vitest.config.ts
```

The result is a lower bound over the committed one-edge semantic compiler. It does not simulate
the missing complete-population or recorded-path adapters identified by review blocker B2.
