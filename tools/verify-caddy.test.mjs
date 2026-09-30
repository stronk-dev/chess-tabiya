import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { requireEarlyUploadResponse } from "./verify-caddy.mjs";

for (const profile of ["appliance", "hosted"]) {
  test(`${profile} requires a live full-duplex directive, not a comment or an omitted option`, () => {
    const file = readFileSync(new URL(`../deploy/Caddyfile.${profile}`, import.meta.url), "utf8");
    assert.doesNotThrow(() => requireEarlyUploadResponse(file, profile));
    assert.throws(() => requireEarlyUploadResponse(file.replace("enable_full_duplex", ""), profile), /full duplex/);
    assert.throws(() => requireEarlyUploadResponse(file.replace("enable_full_duplex", "# enable_full_duplex"), profile), /full duplex/);
  });
}

test("verification validates inert rendered fixtures rather than invoking operator deployment", () => {
  const makefile = readFileSync(new URL("../Makefile", import.meta.url), "utf8");
  const target = /^verify-deployment:\n((?:\t[^\n]*\n)+)/mu.exec(makefile)?.[1];
  assert.ok(target);
  assert.match(target, /node tools\/verify-caddy\.mjs/u);
  assert.doesNotMatch(target, /deployment-check/u);
});
