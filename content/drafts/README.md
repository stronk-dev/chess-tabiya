# Pack drafts

This committed directory is the shared author/reviewer workspace for unfinished
pack JSON. Drafts remain versionable because owner review and revision are part
of the measured content-production pipeline; they are not ignored scratch
files.

The server reads JSON files here only when `NODE_ENV=development`. Production
startup ignores this directory, and an explicit `DRAFT_PACK_FILE` is rejected
unless development mode is enabled. Move a reviewed pack to `content/packs/`
only through the content-era review process.

Use:

```sh
make pack-check FILE=content/drafts/my-pack.json
make pack-preview FILE=content/drafts/my-pack.json
```

Preview uses the deterministic mock deployment by default and restarts the
local application when the selected file changes.
