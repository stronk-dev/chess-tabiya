import { randomUUID } from "node:crypto";

import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";

import type { Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import { ShapeRegistry } from "./shape-registry.js";
import { validateShapeEntry, type ShapeValidationResult } from "./shape-validation.js";
import { SQLiteRunStorage, type StoredShapeDraft } from "./storage.js";

function semver(value: string): readonly number[] {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value);
  if (match === null) throw new ServerError("INVALID_REQUEST", `Invalid semver: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
function greater(leftValue: string, rightValue: string): boolean {
  const left=semver(leftValue),right=semver(rightValue);for(let i=0;i<3;i+=1)if(left[i]!==right[i])return left[i]!>right[i]!;return false;
}

export interface ShapeDraftView extends StoredShapeDraft { readonly validation: ShapeValidationResult; }

export class ShapeStudio {
  constructor(readonly storage: SQLiteRunStorage, readonly registry: ShapeRegistry) {}

  async hydrate(): Promise<void> {
    for (const row of this.storage.registeredShapes()) await this.registry.add(row.document as ShapeEntryDefinition,"community",row.publisherHandle,row.digest);
  }
  list(principal: Principal): readonly ShapeDraftView[] { return Object.freeze(this.storage.shapeDrafts(principal.learnerId).map((row)=>this.#view(row))); }
  required(id:string,principal:Principal):ShapeDraftView{const row=this.storage.shapeDraft(id,principal.learnerId);if(row===undefined)throw new ServerError("RUN_NOT_FOUND",`Unknown shape draft: ${id}`);return this.#view(row);}
  async create(principal:Principal,document:unknown,at=new Date().toISOString()):Promise<ShapeDraftView>{const raw=structuredClone(document) as Record<string,unknown>;const row:StoredShapeDraft=Object.freeze({id:randomUUID(),shapeId:String(raw.id??"untitled"),ownerLearnerId:principal.learnerId,document:raw,digest:await digestShapeEntry(raw),state:"draft",createdAt:at,updatedAt:at});this.storage.createShapeDraft(row);return this.#view(row);}
  lint(document:unknown,probeFen?:string):ShapeValidationResult{return validateShapeEntry(document,{...(probeFen===undefined?{}:{probeFen})});}
  async update(id:string,principal:Principal,expectedDigest:string,document:unknown,at=new Date().toISOString()):Promise<ShapeDraftView>{const current=this.required(id,principal);const digest=await digestShapeEntry(document);if(!this.storage.updateShapeDraft(id,principal.learnerId,expectedDigest,document,digest,at))throw new ServerError("DRAFT_STALE","Draft changed in another editor",{details:{digest:current.digest}});return this.required(id,principal);}
  async register(id:string,principal:Principal,at=new Date().toISOString()){const draft=this.required(id,principal);const validation=validateShapeEntry(draft.document);if(!validation.valid||validation.document===undefined)throw new ServerError("PACK_INVALID","Shape draft has validation errors",{details:{issues:validation.issues}});const document=validation.document;if(this.registry.get(document.id)?.channel==="official")throw new ServerError("SHAPE_ID_RESERVED",`Shape id ${document.id} is official`);const rows=this.storage.registeredShapes().filter((row)=>row.shapeId===document.id);if(rows.some((row)=>row.version===document.version))throw new ServerError("SHAPE_VERSION_EXISTS","That shape version already exists");if(rows.some((row)=>row.publisherLearnerId!==principal.learnerId))throw new ServerError("SHAPE_ID_NOT_YOURS","This shape id belongs to another publisher");if(rows.length>0&&!rows.every((row)=>greater(document.version,row.version)))throw new ServerError("SHAPE_VERSION_NOT_INCREASING","A new version must increase");this.storage.registerShapeDraft({shapeId:document.id,version:document.version,digest:draft.digest,document,publisherHandle:principal.handle,publisherLearnerId:principal.learnerId,draftId:id,registeredAt:at});return this.registry.add(document,"community",principal.handle,draft.digest);}
  export(id:string,principal:Principal){const row=[...this.storage.registeredShapes()].reverse().find((candidate)=>candidate.shapeId===id&&candidate.publisherLearnerId===principal.learnerId);if(row===undefined)throw new ServerError("SHAPE_NOT_FOUND",`Unknown community shape: ${id}`);return Object.freeze({format:"chess-tabiya-shape",version:1,document:row.document,digest:row.digest,publisherHandle:row.publisherHandle});}
  #view(row:StoredShapeDraft):ShapeDraftView{return Object.freeze({...row,validation:validateShapeEntry(row.document)});}
}
