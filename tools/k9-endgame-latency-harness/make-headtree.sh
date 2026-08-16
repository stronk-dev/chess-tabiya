#!/usr/bin/env bash
# DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
#
# Builds a pristine copy of the repository AT HEAD outside the repo, so the
# latency arms measure a named commit rather than a working tree that a
# concurrent session was editing (schemas/drill_pack.schema.json,
# packages/schema, apps/server/src/pack-validation.ts and five sourcing files
# were all uncommitted-modified while this ran).
#
#   <tree>/                        = `git archive HEAD`, byte-identical to the commit
#   <tree>/node_modules            -> the repo's, EXCEPT @chess-tabiya/* which is
#                                     re-pointed at <tree>/packages so no dirty
#                                     workspace source is bundled
#   <tree>/content/drafts          emptied: NODE_ENV=development otherwise loads all 56
#   <tree>/packs/<id>.json         the endgame drafts as committed, served one at a
#                                   time through DRAFT_PACK_FILE
set -euo pipefail

REPO="/Users/stronk/repos/chess-drills"
TREE="$1"; shift

rm -rf "$TREE"
mkdir -p "$TREE"
git -C "$REPO" archive HEAD | tar -x -C "$TREE"

link_modules() { # <package-relative-path>
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
"$REPO/node_modules/.bin/esbuild" "$TREE/apps/server/src/pack-check.ts" \
  --bundle --platform=node --format=esm --outfile="$TREE/apps/server/dist/pack-check.js" >/dev/null
cp -R "$REPO/apps/web/dist" "$TREE/apps/web/dist"
echo "headtree ready at $TREE (packs: $*)"
