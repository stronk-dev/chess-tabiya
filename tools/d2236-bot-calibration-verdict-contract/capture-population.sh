#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p .cache/bot-calibration
compressed=.cache/bot-calibration/lichess-2026-06-prefix.zst
node_command="${CI_NODE:-node}"
expected="$($node_command --input-type=module -e 'import m from "./tools/d2236-bot-calibration-verdict-contract/manifest.json" with {type:"json"}; process.stdout.write(m.humanReference.compressedSha256.slice(7));')"
source_url="$($node_command --input-type=module -e 'import m from "./tools/d2236-bot-calibration-verdict-contract/manifest.json" with {type:"json"}; process.stdout.write(m.humanReference.sourceUrl);')"
source_range="$($node_command --input-type=module -e 'import m from "./tools/d2236-bot-calibration-verdict-contract/manifest.json" with {type:"json"}; process.stdout.write(m.humanReference.compressedRange.replace("bytes=", ""));')"
hash_file() { shasum -a 256 "$1" | cut -d ' ' -f 1; }
if [[ ! -f "$compressed" ]] || [[ "$(hash_file "$compressed")" != "$expected" ]]; then
  scratch="$(mktemp -d .cache/bot-calibration/capture.XXXXXX)"
  curl --fail --location --range "$source_range" --max-filesize 268435456 --output "$scratch/source.zst" "$source_url"
  actual="$(hash_file "$scratch/source.zst")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'Calibration compressed source drift: %s; capture retained at %s\n' "$actual" "$scratch" >&2
    exit 1
  fi
  mv "$scratch/source.zst" "$compressed"
  rmdir "$scratch"
fi
./node_modules/.bin/esbuild tools/d2236-bot-calibration-verdict-contract/extract-stream.ts \
  --bundle --platform=node --format=esm --alias:chessops=./apps/server/node_modules/chessops/dist/esm \
  --outfile=.cache/bot-calibration/extract-stream.mjs
set +e
zstd --decompress --stdout "$compressed" | "$node_command" .cache/bot-calibration/extract-stream.mjs .cache/bot-calibration/human-reference-population.json
statuses=("${PIPESTATUS[@]}")
set -e
# As in D1329/D2903, the pinned range ends inside a frame. The independently verified complete
# decompressed checksum, not acceptance of decoder exit 1, is what admits this exact prefix.
if [[ "${statuses[1]}" -ne 0 ]] || [[ "${statuses[0]}" -ne 0 && "${statuses[0]}" -ne 1 ]]; then
  printf 'Calibration extraction failed: zstd=%s node=%s\n' "${statuses[0]}" "${statuses[1]}" >&2
  exit 1
fi
