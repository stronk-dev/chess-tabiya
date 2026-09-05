import { generateStorageOperationId, parseApplicationRevision, type ApplicationRevision, type StorageOperationId } from "./contract.js";

const operationId: StorageOperationId = generateStorageOperationId(new Uint8Array(16));
const revision: ApplicationRevision = parseApplicationRevision("dev+dirty");
void operationId;
void revision;

// @ts-expect-error plain strings cannot cross operation identity boundaries
const invalidOperation: StorageOperationId = "00112233-4455-4677-8899-aabbccddeeff";
// @ts-expect-error plain strings cannot cross application revision boundaries
const invalidRevision: ApplicationRevision = "latest";
void invalidOperation;
void invalidRevision;
