# D1163 engine-composed bot harness — disposable

Research instrument under RFC-0000's exploration gate. It reads the frozen R11 capture and writes
only the named planning results when explicitly enabled.

```sh
TABIYA_R11_INPUT_DIR=/path/to/r11 TABIYA_D1163_WRITE=1 \
  pnpm exec vitest run --config tools/d1163-engine-composed-bot-harness/vitest.config.ts
```

Without `TABIYA_R11_INPUT_DIR`, only the arithmetic controls run.
