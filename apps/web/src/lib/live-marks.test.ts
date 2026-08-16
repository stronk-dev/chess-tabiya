import { describe,expect,it } from "vitest";

import { markAttribution,relayedMarkShapes } from "./live-marks.js";

const mark=(handle?:string)=>({scope:"position" as const,brush:"green" as const,orig:"e4",...(handle===undefined?{}:{drawnBy:{learnerId:handle,handle}}),at:"2026-08-16T12:00:00.000Z"});

describe("live mark projection",()=>{
  it("renders every attribution arm and the truncation statement",()=>{
    expect(markAttribution({marks:[]})).toBe("");
    expect(markAttribution({marks:[mark("alice")]})).toBe("Marks drawn by @alice.");
    expect(markAttribution({marks:[mark("alice"),mark("bob")],marksTruncated:true})).toBe("Marks drawn by @alice and @bob. Showing the 128 most recent.");
    expect(markAttribution({marks:[mark()]})).toBe("Some marks were drawn by an account that no longer exists.");
  });

  it("projects relayed marks as read-only chessground shapes",()=>{
    expect(relayedMarkShapes({marks:[{...mark("alice"),dest:"e5",brush:"red"}]})).toEqual([{orig:"e4",dest:"e5",brush:"red"}]);
  });
});
