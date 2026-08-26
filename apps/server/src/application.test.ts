import type { AddressInfo } from "node:net";

import { CORPUS_GUARD } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";

describe("development application mock opponent", { timeout: 15_000 }, () => {
  let application: ChessTabiyaApplication | undefined;

  afterEach(async () => {
    await application?.close();
    application = undefined;
  });

  it("plays the deterministic Pack A opponent spine from its black-to-move root", async () => {
    application = await createApplication({
      development: true,
      engineMode: "mock",
      cookieSecure: false,
    });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address() as AddressInfo;
    const origin = `http://127.0.0.1:${address.port}`;
    const registered = await fetch(`${origin}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "engine_test", password: "engine-test-password" }),
    });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const packs = (await (await fetch(`${origin}/packs`)).json()) as {
      id: string;
      digest: string;
    }[];
    const pack = packs.find((candidate) => candidate.id === "anti-caro-advance-c5-race");
    expect(pack).toBeDefined();

    const choose = async (historyUci: readonly string[]) => {
      const response = await fetch(`${origin}/select-move`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          startFen:
            "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
          historyUci,
          policy: {
            mode: "human_common",
            policyConfigDigest: pack!.digest,
            targetElo: 1800,
          },
          seed: 23,
        }),
      });
      const text = await response.text();
      expect(response.status, text).toBe(200);
      return JSON.parse(text) as { moveUci: string };
    };

    await expect(choose([])).resolves.toMatchObject({ moveUci: "c8f5" });
    await expect(choose(["c8f5", "g1f3"])).resolves.toMatchObject({
      moveUci: "e7e6",
    });
    await expect(
      choose(["c8f5", "g1f3", "e7e6", "f1e2"]),
    ).resolves.toMatchObject({ moveUci: "c6c5" });
  });

  it("serves the official shape catalogue and only the pack's public shape references", async () => {
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    const address = application.server.address() as AddressInfo;
    const origin = `http://127.0.0.1:${address.port}`;
    const summaries = (await (await fetch(`${origin}/shapes`)).json()) as { shapes: { id: string; channel: string; usedByPacks: number }[] };
    expect(summaries.shapes).toEqual(expect.arrayContaining([expect.objectContaining({ id: "carlsbad", channel: "official", usedByPacks: expect.any(Number) })]));
    const detail = await fetch(`${origin}/shapes/carlsbad`);
    expect(detail.status).toBe(200); expect(detail.headers.get("x-shape-digest")).toMatch(/^sha256:/);
    expect(await detail.json()).toMatchObject({ id: "carlsbad", channel: "official" });
    const pack = await fetch(`${origin}/packs/carlsbad-minority-attack`);
    const projected = await pack.json() as Record<string, unknown>;
    expect(projected.shapes).toEqual(["carlsbad"]);
    expect(projected).not.toHaveProperty("planClasses");
    expect(projected).not.toHaveProperty("successConditions");
  });

  it("serves the sorted principle catalogue through the production boundary", async () => {
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    const address = application.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/principles`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = await response.json() as { principles: { id: string; name: string; statement: string; phases: string[]; licence: string; usedByPacks: number }[] };
    expect(body.principles.length).toBeGreaterThan(0);
    expect(body.principles.map((principle) => principle.id)).toEqual(
      [...body.principles.map((principle) => principle.id)].sort(),
    );
    expect(body.principles[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      statement: expect.any(String),
      phases: expect.any(Array),
      licence: expect.any(String),
      usedByPacks: expect.any(Number),
    }));
  });

  it("does not advertise tablebase modes for the empty mock provider", async () => {
    application = await createApplication({ engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/capabilities`);
    expect(response.status).toBe(200);
    const descriptor = await response.json() as {
      providers: { tablebase: string };
      policyModes: string[];
    };
    expect(descriptor.providers.tablebase).toBe("none");
    expect(descriptor.policyModes).not.toContain("perfect_tablebase");
    expect(descriptor.policyModes).not.toContain("practical_resistance");
  });

  it("routes every rating API family through the production application boundary", async () => {
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    const address = application.server.address() as AddressInfo;
    const origin = `http://127.0.0.1:${address.port}`;
    const registered = await fetch(`${origin}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "rating_boundary", password: "rating-boundary-password" }),
    });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;

    const expectations = [
      ["/rated-games", 404],
      ["/rating", 200],
      ["/rating/history", 200],
      ["/marks", 200],
      ["/cohorts/not-a-classroom/standing", 404],
    ] as const;
    for (const [path, status] of expectations) {
      const response = await fetch(`${origin}${path}`, { headers: { cookie } });
      const body = await response.text();
      expect(response.status, `${path}: ${body}`).toBe(status);
      expect(response.headers.get("content-type"), path).toContain("application/json");
      expect(body, path).not.toContain("<!doctype html>");
    }
  });

  it("serves exact opening identity through the production boundary and reports honest catalogue failure", async () => {
    application = await createApplication({ engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    let address = application.server.address() as AddressInfo;
    let origin = `http://127.0.0.1:${address.port}`;
    const exact = await fetch(`${origin}/opening-identity?fen=${encodeURIComponent("rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R b KQkq - 1 1")}&ply=1`);
    expect(exact.status, await exact.clone().text()).toBe(200);
    expect(await exact.json()).toMatchObject({ currentEndpoint: { kind: "matched", eco: "A00", name: "Amar Opening" }, catalogueMembership: { kind: "member" } });
    const invalidFen = await fetch(`${origin}/opening-identity?fen=not-a-fen&ply=1`);
    expect(invalidFen.status).toBe(400);
    expect(await invalidFen.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    const invalidPly = await fetch(`${origin}/opening-identity?fen=${encodeURIComponent("rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R b KQkq - 1 1")}&ply=-1`);
    expect(invalidPly.status).toBe(400);
    await application.close();

    application = await createApplication({ engineMode: "mock", cookieSecure: false, openingCataloguePath: "/definitely/missing/runtime-opening-catalogue.json" });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    address = application.server.address() as AddressInfo;
    origin = `http://127.0.0.1:${address.port}`;
    const unavailable = await fetch(`${origin}/opening-identity?fen=${encodeURIComponent("rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R b KQkq - 1 1")}&ply=1`);
    expect(unavailable.status).toBe(200);
    expect(await unavailable.json()).toEqual({ currentEndpoint: { kind: "abstained", projectionId: "theory.opening.current_endpoint@1", reason: "artifact_missing" }, catalogueMembership: { kind: "abstained", projectionId: "theory.opening.catalogue_membership@1", reason: "artifact_missing" } });
    const capabilities = await (await fetch(`${origin}/capabilities`)).json() as { evidenceManifest: { availability: { producerId: string; state: string; reason: string }[] } };
    expect(capabilities.evidenceManifest.availability.find((row) => row.producerId === "theory.opening.runtime")).toEqual({ producerId: "theory.opening.runtime", version: 1, state: "unavailable", reason: "artifact_missing" });
  });

  it("imports a private repertoire, scans ranked gaps, and enters one atomically",async()=>{
    application=await createApplication({development:true,engineMode:"mock",cookieSecure:false});await new Promise<void>((resolve,reject)=>{application!.server.once("error",reject);application!.server.listen(0,"127.0.0.1",resolve);});const address=application.server.address() as AddressInfo,origin=`http://127.0.0.1:${address.port}`;
    const registered=await fetch(`${origin}/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"repertoire_owner",password:"repertoire-owner-password"})}),cookie=registered.headers.get("set-cookie")!.split(";",1)[0]!;
    const created=await fetch(`${origin}/repertoires`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({name:"Black repertoire",side:"black",targetElo:1600,coverageDenominator:10,source:{kind:"pgn",pgn:"1. d4 d5 *"}})});expect(created.status,await created.clone().text()).toBe(201);const repertoire=(await created.json() as any).repertoire;
    expect((await fetch(`${origin}/repertoires/${repertoire.id}/scan`,{method:"POST",headers:{"content-type":"application/json",cookie},body:"{}"})).status).toBe(202);
    let page:any;for(let index=0;index<20;index++){page=await (await fetch(`${origin}/repertoires/${repertoire.id}/gaps`,{headers:{cookie}})).json();if(page.status==="ready")break;await new Promise((resolve)=>setTimeout(resolve,5));}
    expect(page.scan.guard).toBe(CORPUS_GUARD);expect(page.scan.gaps[0]).toMatchObject({replySan:"e4",state:"open"});
    const entered=await fetch(`${origin}/repertoires/${repertoire.id}/gaps/enter`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({gapKey:page.scan.gaps[0].key})});expect(entered.status,await entered.clone().text()).toBe(201);const result=await entered.json() as any;expect(result).toMatchObject({alreadyEntered:false,runId:expect.stringMatching(/^gap-/),writerId:expect.stringMatching(/^writer-/)});
    const repeated=await fetch(`${origin}/repertoires/${repertoire.id}/gaps/enter`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({gapKey:page.scan.gaps[0].key})});expect(await repeated.json()).toMatchObject({alreadyEntered:true,runId:result.runId});
    const outsider=await fetch(`${origin}/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"repertoire_outsider",password:"repertoire-outsider-password"})}),otherCookie=outsider.headers.get("set-cookie")!.split(";",1)[0]!;expect((await fetch(`${origin}/repertoires/${repertoire.id}`,{headers:{cookie:otherCookie}})).status).toBe(404);
  });
});
