// Accepted six-detail supplier. Projection factories remain below the runtime boundary;
// server page compilation supplies only an original complete source and closed detail request.
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { INSPECTOR_DETAIL_SOURCES, type InspectorDetailKind, type InspectorDetailPayload, type InspectorDetailScope } from "./inspector-detail.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

export function collectInspectorDetailSource(source: DeclaredEvidence<unknown>, projection: string,
  scope: InspectorDetailScope, start: number): DeclaredEvidence<InspectorDetailPayload> {
  assertDeclaredEvidence(source);
  const kind = (Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]).find(row => `derived.inspector.detail.${row}@1` === projection);
  if (kind === undefined || `${source.projection.id}@${source.projection.version}` !== INSPECTOR_DETAIL_SOURCES[kind]) throw new TypeError("Inspector detail crosses its exact original source");
  // The sole factory rechecks the genuine source, closed scope, page and complete members.
  return invokeEvidenceValueRoute(projection as never, { source, scope, start } as never) as DeclaredEvidence<InspectorDetailPayload>;
}
