// @vitest-environment happy-dom
// rfc/verifiable-runtime-distribution.md §9: every shell with chrome carries one persistent
// "Licence & source" link to the server-rendered About route.
import { createRawSnippet, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";

import ShellFrame from "./ShellFrame.svelte";

const mounted: ReturnType<typeof mount>[] = [];
afterEach(() => {
  for (const component of mounted.splice(0)) unmount(component);
  document.body.innerHTML = "";
});

describe("ShellFrame licence/source entry", () => {
  it("renders exactly one Licence & source link to /about, as a full-page navigation", () => {
    const navigated: string[] = [];
    mounted.push(mount(ShellFrame, {
      target: document.body,
      props: {
        route: { name: "home" },
        onNavigate: (path: string) => navigated.push(path),
        children: createRawSnippet(() => ({ render: () => "<p>content</p>" })),
      },
    }));
    const links = [...document.querySelectorAll("a")].filter((link) => link.textContent?.trim() === "Licence & source");
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute("href")).toBe("/about");
    expect(links[0]!.getAttribute("rel")).toBe("license");
    links[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(navigated).toEqual([]);
  });
});
