#!/bin/sh
# Isolated research input; never replace the operator's global engine installation.
set -eu
cd "$(dirname "$0")/../.."
destination=.cache/bot-calibration/stockfish-18
if [ "$(uname -s)" = Linux ]; then
  exec sh tools/install-stockfish-linux.sh "$destination"
fi
if [ "$(uname -s)" != Darwin ] || [ "$(uname -m)" != arm64 ]; then
  echo "Use an actual Stockfish 18 executable through BOT_CALIBRATION_SF_CMD on this platform." >&2
  exit 1
fi
archive=stockfish-macos-m1-apple-silicon.tar
# Official sf_18 release asset digest, read from GitHub's release metadata 2026-10-05.
expected=4d77c4aa3ad9bd1ea8111f2ac5a4620fe7ebf998d6893bf828d49ccd579c8cb0
mkdir -p "$destination"
if [ ! -f "$destination/$archive" ]; then
  curl --fail --location --show-error --silent --output "$destination/$archive.partial" \
    "https://github.com/official-stockfish/Stockfish/releases/download/sf_18/$archive"
  actual=$(shasum -a 256 "$destination/$archive.partial" | awk '{print $1}')
  if [ "$actual" != "$expected" ]; then echo "Stockfish 18 archive checksum mismatch; partial capture preserved." >&2; exit 1; fi
  mv "$destination/$archive.partial" "$destination/$archive"
fi
actual=$(shasum -a 256 "$destination/$archive" | awk '{print $1}')
if [ "$actual" != "$expected" ]; then echo "Stockfish 18 archive checksum mismatch." >&2; exit 1; fi
if [ ! -e "$destination/stockfish" ]; then tar -xf "$destination/$archive" -C "$destination"; fi
identity=$("$destination/stockfish/stockfish-macos-m1-apple-silicon" --help)
case "$identity" in "Stockfish 18 by "*) ;; *) echo "Actual Stockfish 18 identity is required." >&2; exit 1;; esac
printf 'Verified isolated Stockfish 18 archive: sha256:%s\n' "$actual"
