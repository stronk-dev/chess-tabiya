import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePackDocument } from "./pack-validation.js";
import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { validatePrincipleEntry } from "./principle-validation.js";
import { validateClaimBindings } from "./sourcing/claim-binding.js";

describe("principle registry",()=>{
  it("loads every official entry and rejects malformed entries",async()=>{
    const registry=await PrincipleRegistry.loadDefault();
    expect(registry.list().length).toBeGreaterThan(1);
    expect(registry.required("result-not-moves").document.counterCase.length).toBeGreaterThan(0);
    expect(validatePrincipleEntry({...registry.required("result-not-moves").document,counterCase:""}).valid).toBe(false);
    expect(validatePrincipleEntry({...registry.required("result-not-moves").document,standsOn:"taste"}).valid).toBe(false);
    expect(validatePrincipleEntry({...registry.required("result-not-moves").document,provenance:{licence:"",sources:[],attribution:[]}}).valid).toBe(false);
  });

  it("requires unique claim ids and resolving principle references",async()=>{
    const registry=await PrincipleRegistry.loadDefault();
    const pack=JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"),"utf8"));
    const duplicate=structuredClone(pack); duplicate.feedbackClaims.push({...duplicate.feedbackClaims[0]});
    expect(validatePackDocument(duplicate,{principles:registry}).issues).toContainEqual(expect.objectContaining({code:"CLAIM_ID_DUPLICATE"}));
    const missing=structuredClone(pack); delete missing.feedbackClaims[0].principles;
    expect(validatePackDocument(missing,{principles:registry}).issues).toContainEqual(expect.objectContaining({code:"CLAIM_PRINCIPLE_MISSING"}));
    const unknown=structuredClone(pack); unknown.feedbackClaims[0].principles=["missing-principle"];
    expect(validatePackDocument(unknown,{principles:registry}).issues).toContainEqual(expect.objectContaining({code:"CLAIM_PRINCIPLE_UNKNOWN"}));
  });

  it("projects the real prose-preserving Philidor binding at registration",async()=>{
    const principles=await PrincipleRegistry.loadDefault();
    const document=JSON.parse(await readFile(resolve(resolvePackPath("philidor-third-rank-hold")),"utf8"));
    const ledger=JSON.parse(await readFile(resolve("content/drafts/philidor-third-rank-hold.evidence.json"),"utf8"));
    const issues:any[]=[]; const bindings=validateClaimBindings(document,ledger,issues);
    expect(issues,JSON.stringify(issues)).toEqual([]); expect(bindings).toHaveLength(1);
    const registry=await PackRegistry.loadDefault({development:true,principles});
    const pack=registry.required("philidor-third-rank-hold");
    expect(pack.boundClaimIds.has("philidor-is-drawn")).toBe(true);
    expect(pack.claimBackings.get("philidor-is-drawn")).toMatchObject({binding:"author_attributed",rendered:expect.arrayContaining([expect.stringContaining("Syzygy")]),principles:[expect.objectContaining({id:"authored-teaching-is-declared"})]});
    expect(pack.document.feedbackClaims?.find((claim)=>claim.id==="philidor-is-drawn")?.text).toContain("This exact position is a tablebase draw");
  });
});
