#!/usr/bin/env bash
# DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
# Not production code.
#
# Same job as make-headtree.sh, with ONE correction that matters for a layout
# re-measurement: make-headtree.sh copies `$REPO/apps/web/dist`, which is
# whatever the working tree last built. The D507 fix lives in
# apps/web/src/lib/DrillScreen.svelte, so reusing a working-tree bundle would
# measure the implementer's uncommitted CSS rather than the commit. This script
# runs `vite build` INSIDE the extracted tree, so the served CSS is the named
# commit's and nothing else.
#
#   <tree>/               = `git archive <commit>`, byte-identical to that commit
#   <tree>/apps/web/dist  = built from <tree>/apps/web/src
#   <tree>/packs/*.json   = the named packs, copied aside
#   <tree>/content/drafts = emptied, then refilled by the caller
set -euo pipefail

REPO="/Users/stronk/repos/chess-drills"
TREE="$1"; shift
COMMIT="$1"; shift

rm -rf "$TREE"
mkdir -p "$TREE"
git -C "$REPO" archive "$COMMIT" | tar -x -C "$TREE"

link_modules() {
  local relative="$1" source="$REPO/$1/node_modules" target="$TREE/$1/node_modules"
  [ -d "$source" ] || return 0
  mkdir -p "$target"
  for entry in "$source"/*; do
    local name; name=$(basename "$entry")
    if [ "$name" = "@chess-tabiya" ]; then
      mkdir -p "$target/@chess-tabiya"
      for workspace in "$entry"/*; do
        ln -sfn "$TREE/packages/$(basename "$workspace")" "$target/@chess-tabiya/$(basename "$workspace")"
      done
    else
      ln -sfn "$entry" "$target/$name"
    fi
  done
  [ -e "$source/.bin" ] && ln -sfn "$source/.bin" "$target/.bin"
  return 0
}

ln -sfn "$REPO/node_modules" "$TREE/node_modules"
link_modules apps/server
link_modules apps/web
link_modules packages/runtime
link_modules packages/schema

mkdir -p "$TREE/packs"
for pack in "$@"; do cp "$TREE/content/drafts/$pack.json" "$TREE/packs/$pack.json"; done
rm -f "$TREE"/content/drafts/*.json

mkdir -p "$TREE/tools/k9-endgame-latency-harness"
cp "$REPO/tools/k9-endgame-latency-harness/serve.ts" "$TREE/tools/k9-endgame-latency-harness/serve.ts"

"$REPO/node_modules/.bin/esbuild" "$TREE/tools/k9-endgame-latency-harness/serve.ts" \
  --bundle --platform=node --format=esm --outfile="$TREE/apps/server/dist/serve.js" >/dev/null
"$REPO/node_modules/.bin/esbuild" "$TREE/apps/server/src/fen-walk.ts" \
  --bundle --platform=node --format=esm --outfile="$TREE/apps/server/dist/fen-walk.js" >/dev/null

# The one difference from make-headtree.sh: build the client from THIS tree.
( cd "$TREE/apps/web" && "$REPO/node_modules/.bin/vite" build >/dev/null )

echo "headtree ready at $TREE (commit $COMMIT, packs: $*)"
grep -c "16dvh" "$TREE"/apps/web/dist/assets/*.css >/dev/null 2>&1 \
  && echo "D507 clamp present in built CSS" \
  || echo "WARNING: D507 clamp NOT found in built CSS"
