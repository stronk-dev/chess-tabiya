import { describe, expect, it } from "vitest";

import { prefersHtmlToJson } from "./http-representation.js";

describe("the existing Rating API and document share Accept, not authentication state", () => {
  it.each([
    [null, false], ["*/*", false], ["application/json", false], ["text/html", true],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", true],
    ["text/html;q=0, */*;q=1", false], ["text/html;q=0.1, application/json;q=1", false],
    ["application/json;q=0, text/*;q=0.5", true], ["text/html;q=0.5, application/json;q=0.5", false],
    ["text/html, */*", true], ["TEXT/HTML;Q=0.8, APPLICATION/JSON;Q=0.2", true],
    ['text/html; charset="utf-8";q=0.8, application/json;q=0.4', true],
    ['text/html;foo="a,b";q=1,application/json;q=0.1', false],
    ["text/html;q=2", false], ["text/html;q=-1", false], ["text/html;q=0.1234", false],
    ["text/html;q=NaN", false], ["not-a-media-type,text/html;q=0.2", true],
    ["*/html", false],
    ["text/html;charset=utf-8;q=0, text/html;q=1, */*;q=1", false],
  ])("%s selects HTML=%s", (accept, expected) => {
    expect(prefersHtmlToJson(accept)).toBe(expected);
  });
});
