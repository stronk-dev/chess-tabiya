// DISPOSABLE proof of D2329: this arbitrary string compiles because the
// production projection array has widened from literal ids to `string`.
import { STRUCTURAL_EVENT_PROJECTION_IDS } from "../../packages/runtime/src/evidence-catalog.js";

const escapedProjection: (typeof STRUCTURAL_EVENT_PROJECTION_IDS)[number] = "not.a.registered.projection";
void escapedProjection;
