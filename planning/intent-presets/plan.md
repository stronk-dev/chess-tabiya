# Intent-preset implementation plan

**RFC:** `rfc/intent-presets.md`
**State:** blocked on the RFC's registered dependencies and fresh review

## Live implementation boundary

- [[D3158]] — make the compiled preset the sole activation authority before claiming the Academy
  Guided default. The current label comes from `workflowContextPolicy("academy")`, while effective
  primitive defaults still come from `PROFILE_DEFAULTS.academy = SILENT_ASSISTANCE`; patching that
  one profile directly would duplicate the compiler the RFC exists to install.

No production preset activation is authorized while the RFC remains draft.
