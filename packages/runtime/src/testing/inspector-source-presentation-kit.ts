/** Unsealed-constructor test kit only; no ConsumerEvidenceView or presentation/source issuer. */
import { evidenceValueReceipt } from "../evidence-contract.js";
import { factStatementOperand, type PresentationKit } from "../presentation-contract.js";

const unused = (): never => { throw new Error("Unexpected kit method in bounded Inspector constructor proof"); };
export const inspectorSourcePresentationKit: PresentationKit = {
  fact: factStatementOperand,
  factRef: evidence => `sha256:${evidenceValueReceipt(evidence).payloadDigest}`,
  convention: (evidence, basis, perspective) => ({ producer: { ...evidence.producer }, sourceProjection: { ...evidence.projection },
    sourceEvidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`, perspective, basis }),
  declared: (evidence, convention, perspective = "not_applicable") => ({ producer: { ...evidence.producer }, sourceProjection: { ...evidence.projection },
    sourceEvidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`, perspective, basis: { kind: "declared", convention } }),
  searchConvention: unused,
  squareSet: (evidence, squares, brush, caption) => ({ id: "square_set", operand: {
    squares: [...new Set(squares)], brush, owner: { factRef: `sha256:${evidenceValueReceipt(evidence).payloadDigest}` },
    ordered: false, caption,
  } }),
  structuredDocument: unused,
  grounding: unused,
  citation: unused,
};
