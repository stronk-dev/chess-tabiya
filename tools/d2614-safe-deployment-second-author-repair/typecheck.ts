import { compileDeploymentConfig, parseDeploymentOperationId, type DeploymentSuccessReceipt } from "./contract.js";

const compiled = compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local"}', { absolute: true, regular: true, symlink: false, sameInode: true, mode: 0o600 });
void compiled;
void parseDeploymentOperationId("123e4567-e89b-42d3-a456-426614174000");
// @ts-expect-error success receipts cannot accept arbitrary string operation ids
const forged: DeploymentSuccessReceipt = { operationId: "x" };
void forged;
