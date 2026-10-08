// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { DrillApi } from "./api.js";

const confirmations = [
  { path: "/auth/import", invoke: (api: DrillApi) => api.importAccount("wrong-password", {}) },
  { path: "/auth/export", invoke: (api: DrillApi) => api.exportAccount("wrong-password") },
  { path: "/auth/delete", invoke: (api: DrillApi) => api.deleteAccount("wrong-password", "preview") },
] as const;

describe("password confirmation versus session expiry", () => {
  for (const confirmation of confirmations) {
    for (const sessionStatus of [200, 401]) {
      it(`${confirmation.path} preserves the original refusal and ${sessionStatus === 200 ? "keeps a valid session" : "announces actual expiry"}`, async () => {
        let announced = 0;
        const onExpired = () => { announced += 1; };
        window.addEventListener("tabiya:unauthenticated", onExpired);
        const calls: { url: string; method: string | undefined; credentials: RequestCredentials | undefined }[] = [];
        const api = new DrillApi("http://tabiya.test", async (input, init) => {
          const url = String(input);
          calls.push({ url, method: init?.method, credentials: init?.credentials });
          if (url.endsWith("/auth/session")) return Response.json({}, { status: sessionStatus });
          return Response.json({ error: { code: "UNAUTHENTICATED", message: "Invalid handle or password" } }, { status: 401 });
        });
        try {
          await expect(confirmation.invoke(api)).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED", message: "Invalid handle or password" });
          expect(announced).toBe(sessionStatus === 401 ? 1 : 0);
          expect(calls).toEqual([
            { url: `http://tabiya.test${confirmation.path}`, method: "POST", credentials: "same-origin" },
            { url: "http://tabiya.test/auth/session", method: "GET", credentials: "same-origin" },
          ]);
        } finally {
          window.removeEventListener("tabiya:unauthenticated", onExpired);
        }
      });
    }
  }

  for (const unavailable of ["network", "proxy"] as const) {
    it(`does not infer session expiry from a ${unavailable} failure checking confirmation`, async () => {
      let announced = 0;
      const onExpired = () => { announced += 1; };
      window.addEventListener("tabiya:unauthenticated", onExpired);
      const api = new DrillApi("http://tabiya.test", async input => {
        if (String(input).endsWith("/auth/session")) {
          if (unavailable === "network") throw new TypeError("Network unavailable");
          return new Response("Proxy unavailable", { status: 502 });
        }
        return Response.json({ error: { code: "UNAUTHENTICATED", message: "Invalid handle or password" } }, { status: 401 });
      });
      try {
        await expect(api.importAccount("wrong-password", {})).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED" });
        expect(announced).toBe(0);
      } finally {
        window.removeEventListener("tabiya:unauthenticated", onExpired);
      }
    });
  }

  it("still announces an ordinary protected-resource 401 without a confirmation probe", async () => {
    let announced = 0;
    const onExpired = () => { announced += 1; };
    window.addEventListener("tabiya:unauthenticated", onExpired);
    const calls: string[] = [];
    const api = new DrillApi("http://tabiya.test", async input => {
      calls.push(String(input));
      return new Response("Unauthorized", { status: 401 });
    });
    try {
      await expect(api.accountInventory()).rejects.toMatchObject({ status: 401, code: "HTTP_ERROR" });
      expect(announced).toBe(1);
      expect(calls).toEqual(["http://tabiya.test/auth/account-inventory"]);
    } finally {
      window.removeEventListener("tabiya:unauthenticated", onExpired);
    }
  });
});
