#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/tabiya-d2903.XXXXXX")"
compressed="/private/tmp/tabiya-d2903-lichess-2026-06-prefix.zst"
expected="399d79b546e045fa3e6706efddd723202c6b00a4c335398e5526c73114abff4d"
cleanup() {
  local status="$?"
  if [[ "$status" -eq 0 ]]; then
    rm -rf "$scratch"
  else
    printf 'D2903 population scratch retained after failure: %s\n' "$scratch" >&2
  fi
}
trap cleanup EXIT

cd "$repo_root"
if [[ ! -f "$compressed" ]] || [[ "$(shasum -a 256 "$compressed" | cut -d ' ' -f 1)" != "$expected" ]]; then
  curl --fail --location --range 0-268435455 --max-filesize 268435456 \
    --output "$scratch/source.zst" \
    https://database.lichess.org/standard/lichess_db_standard_rated_2026-06.pgn.zst
  actual="$(shasum -a 256 "$scratch/source.zst" | cut -d ' ' -f 1)"
  if [[ "$actual" != "$expected" ]]; then
    printf 'D2903 compressed source drift: %s\n' "$actual" >&2
    exit 1
  fi
  mv "$scratch/source.zst" "$compressed"
fi

./node_modules/.bin/esbuild tools/d2903-human-endgame-reference/extract-stream.ts \
  --bundle --platform=node --format=esm --outfile="$scratch/extract-stream.mjs"
set +e
zstd --decompress --stdout "$compressed" | \
  node "$scratch/extract-stream.mjs" planning/bot-roster/d2903-human-endgame-population.json
pipeline_status=("${PIPESTATUS[@]}")
set -e

# The checksum-pinned HTTP range ends inside a Zstandard frame by construction. zstd exits 1 after
# emitting that complete 1.92-GB prefix; the extractor independently requires the exact historical
# decompressed digest before it publishes. No other decoder or extractor status is admissible.
if [[ "${pipeline_status[1]}" -ne 0 ]] || [[ "${pipeline_status[0]}" -ne 0 && "${pipeline_status[0]}" -ne 1 ]]; then
  printf 'D2903 extraction failed: zstd=%s node=%s\n' "${pipeline_status[0]}" "${pipeline_status[1]}" >&2
  exit 1
fi
