#!/usr/bin/env bash
# Explicit disposable research; never downloads implicitly or changes the frozen population.
set -euo pipefail
cd "$(dirname "$0")/../.."
compressed=.cache/bot-calibration/lichess-2026-06-prefix.zst
node_command="${CI_NODE:-node}"
expected="$($node_command --input-type=module -e 'import m from "./tools/d2236-bot-calibration-verdict-contract/manifest.json" with {type:"json"}; process.stdout.write(m.humanReference.compressedSha256.slice(7));')"
if [[ ! -f "$compressed" ]] || [[ "$(shasum -a 256 "$compressed" | cut -d ' ' -f 1)" != "$expected" ]]; then
  printf 'Missing or changed pinned source. Run make bot-calibration-population first.\n' >&2
  exit 1
fi
./node_modules/.bin/esbuild tools/d2236-bot-calibration-verdict-contract/opening-capacity-stream.ts \
  --bundle --platform=node --format=esm --alias:chessops=./apps/server/node_modules/chessops/dist/esm \
  --outfile=.cache/bot-calibration/opening-capacity-stream.mjs --log-level=warning
set +e
zstd --decompress --stdout "$compressed" | "$node_command" .cache/bot-calibration/opening-capacity-stream.mjs .cache/bot-calibration/opening-capacity.json
statuses=("${PIPESTATUS[@]}")
set -e
# A partial compressed frame is admitted ONLY by the exact complete decompressed checksum.
if [[ "${statuses[1]}" -ne 0 ]] || [[ "${statuses[0]}" -ne 0 && "${statuses[0]}" -ne 1 ]]; then
  printf 'Opening census failed: zstd=%s node=%s\n' "${statuses[0]}" "${statuses[1]}" >&2
  exit 1
fi
