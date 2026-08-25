// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";

import DistillDraftForm from "./DistillDraftForm.svelte";

describe("distilled draft title form", () => {
  it("requires and submits the author's trimmed title", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const onSubmit = vi.fn();
    const component = mount(DistillDraftForm, { target, props: { onSubmit, onCancel: vi.fn() } });
    const submit = target.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);

    const input = target.querySelector<HTMLInputElement>("input")!;
    input.value = "  My minority-attack branches  ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(submit.disabled).toBe(false);
    target.querySelector<HTMLFormElement>("form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    expect(onSubmit).toHaveBeenCalledWith("My minority-attack branches");
    await unmount(component);
    target.remove();
  });
});
