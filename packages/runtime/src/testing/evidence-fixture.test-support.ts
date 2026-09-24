/**
 * TEST-ONLY compiler fixture (rfc/evidence-value-authority.md §1, §8).
 *
 * Renderer and consumer-boundary tests need sealed wrappers around synthetic payloads. They get
 * them here, under an explicit test authority, instead of through production code. Production
 * modules may never import this file (`make evidence-value-authority` enforces it), and a fixture
 * is never a semantic positive: semantic authority cases use the real factories.
 */
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { declareEvidence, type DeclaredEvidence } from "../evidence-contract.js";

const FIXTURE_AUTHORITY = Object.freeze({ factory: "test:evidence-fixture", inputDigest: "0".repeat(64), sourceDigests: Object.freeze([]) as readonly string[] });

/** Seals `payload` under the exact catalogue projection `id@version`, with its declared producer. */
export function fixtureEvidence<T>(route: string, payload: T): DeclaredEvidence<T> {
  const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => `${candidate.id}@${candidate.version}` === route);
  if (projection === undefined) throw new TypeError(`Fixture names no catalogue projection ${route}`);
  return declareEvidence(projection.producer, { id: projection.id, version: projection.version }, payload, FIXTURE_AUTHORITY);
}

export function fixtureEvidenceList<T>(route: string, payloads: readonly T[]): readonly DeclaredEvidence<T>[] {
  return Object.freeze(payloads.map((payload) => fixtureEvidence(route, payload)));
}
