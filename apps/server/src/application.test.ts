import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";

describe("development application mock opponent", () => {
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
    const summaries = (await (await fetch(`${origin}/shapes`)).json()) as { shapes: { id: string; channel: string }[] };
    expect(summaries.shapes).toEqual(expect.arrayContaining([expect.objectContaining({ id: "carlsbad", channel: "official" })]));
    const detail = await fetch(`${origin}/shapes/carlsbad`);
    expect(detail.status).toBe(200); expect(detail.headers.get("x-shape-digest")).toMatch(/^sha256:/);
    expect(await detail.json()).toMatchObject({ id: "carlsbad", channel: "official" });
    const pack = await fetch(`${origin}/packs/carlsbad-minority-attack`);
    const projected = await pack.json() as Record<string, unknown>;
    expect(projected.shapes).toEqual(["carlsbad"]);
    expect(projected).not.toHaveProperty("planClasses");
    expect(projected).not.toHaveProperty("successConditions");
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

  it("imports a private repertoire, scans ranked gaps, and enters one atomically",async()=>{
    application=await createApplication({development:true,engineMode:"mock",cookieSecure:false});await new Promise<void>((resolve,reject)=>{application!.server.once("error",reject);application!.server.listen(0,"127.0.0.1",resolve);});const address=application.server.address() as AddressInfo,origin=`http://127.0.0.1:${address.port}`;
    const registered=await fetch(`${origin}/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"repertoire_owner",password:"repertoire-owner-password"})}),cookie=registered.headers.get("set-cookie")!.split(";",1)[0]!;
    const created=await fetch(`${origin}/repertoires`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({name:"Black repertoire",side:"black",targetElo:1600,coverageDenominator:10,source:{kind:"pgn",pgn:"1. d4 d5 *"}})});expect(created.status,await created.clone().text()).toBe(201);const repertoire=(await created.json() as any).repertoire;
    expect((await fetch(`${origin}/repertoires/${repertoire.id}/scan`,{method:"POST",headers:{"content-type":"application/json",cookie},body:"{}"})).status).toBe(202);
    let page:any;for(let index=0;index<20;index++){page=await (await fetch(`${origin}/repertoires/${repertoire.id}/gaps`,{headers:{cookie}})).json();if(page.status==="ready")break;await new Promise((resolve)=>setTimeout(resolve,5));}
    expect(page.scan.guard).toBe("These counts say what this population played, not what is good");expect(page.scan.gaps[0]).toMatchObject({replySan:"e4",state:"open"});
    const entered=await fetch(`${origin}/repertoires/${repertoire.id}/gaps/enter`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({gapKey:page.scan.gaps[0].key})});expect(entered.status,await entered.clone().text()).toBe(201);const result=await entered.json() as any;expect(result).toMatchObject({alreadyEntered:false,runId:expect.stringMatching(/^gap-/),writerId:expect.stringMatching(/^writer-/)});
    const repeated=await fetch(`${origin}/repertoires/${repertoire.id}/gaps/enter`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({gapKey:page.scan.gaps[0].key})});expect(await repeated.json()).toMatchObject({alreadyEntered:true,runId:result.runId});
    const outsider=await fetch(`${origin}/auth/register`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({handle:"repertoire_outsider",password:"repertoire-outsider-password"})}),otherCookie=outsider.headers.get("set-cookie")!.split(";",1)[0]!;expect((await fetch(`${origin}/repertoires/${repertoire.id}`,{headers:{cookie:otherCookie}})).status).toBe(404);
  });
});
