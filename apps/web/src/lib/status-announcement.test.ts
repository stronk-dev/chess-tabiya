// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, expect, it } from "vitest";

import StatusAnnouncement from "./StatusAnnouncement.svelte";

afterEach(() => document.body.replaceChildren());

it("exposes one atomic text-only status", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(StatusAnnouncement, {
    target,
    props: {
      message: "Waiting for the position",
    },
  });
  await tick();

  const status = document.querySelector<HTMLElement>('[data-status-announcement]')!;
  expect(status.getAttribute("role")).toBe("status");
  expect(status.getAttribute("aria-live")).toBe("polite");
  expect(status.getAttribute("aria-atomic")).toBe("true");
  expect(status.textContent).toBe("Waiting for the position");
  expect(status.querySelector("button, a, input, select, textarea, [tabindex]")).toBeNull();
  await unmount(component);
});
