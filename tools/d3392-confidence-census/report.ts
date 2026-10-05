/** Read-only disposable instrument. No flags modify catalogue, confidence or source metadata. */
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { confidenceCensus } from "./census.js";
console.log(JSON.stringify({ schemaVersion: 1, purpose: "D3391/D3392 contract diagnosis, not implemented inheritance",
  manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, ...confidenceCensus(PRIMARY_EVIDENCE_MANIFEST) }, null, 2));
