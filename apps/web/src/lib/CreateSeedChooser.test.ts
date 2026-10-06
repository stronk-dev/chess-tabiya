// @vitest-environment happy-dom
import { mount, tick, unmount } from "svelte";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@lichess-org/chessground", () => ({ Chessground: () => ({ set:vi.fn(),destroy:vi.fn(),state:{selected:undefined,dom:{bounds:{clear:vi.fn()}}} }) }));
import CreateSeedChooser from "./CreateSeedChooser.svelte";
afterEach(() => document.body.replaceChildren());

it("notation advances the seed without submitting a draft, and the explicit create action still submits", async () => {
  const onPosition=vi.fn();const target=document.body.appendChild(document.createElement("div"));
  const component=mount(CreateSeedChooser,{target,props:{packs:[],runs:[],onPosition,onGame:vi.fn(),onRun:vi.fn(),onPack:vi.fn(),onClearError:vi.fn()}});
  await tick();
  [...target.querySelectorAll("button")].find(b=>b.textContent?.startsWith("Position"))!.click();await tick();
  const title=target.querySelector<HTMLInputElement>('input[placeholder="What consequence will this rehearse?"]')!;
  title.value="My seed";title.dispatchEvent(new Event("input",{bubbles:true}));
  const input=target.querySelector<HTMLInputElement>(".text-move input")!;
  input.value="e4";input.dispatchEvent(new Event("input",{bubbles:true}));await tick();
  target.querySelector<HTMLFormElement>(".text-move form")!.dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true}));await tick();
  expect(onPosition).not.toHaveBeenCalled();
  expect(target.querySelector('form form')).toBeNull();
  const fen=target.querySelector<HTMLInputElement>('input[aria-invalid]')!.value;
  expect(fen).toContain("4P3");expect(fen).toContain(" b ");
  const create=[...target.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent==="Create ten-field draft")!;
  const owner=create.form!;expect(owner).not.toBeNull();
  owner.dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true,submitter:create}));await tick();
  expect(onPosition).toHaveBeenCalledExactlyOnceWith({title:"My seed",fen,side:"white"});
  await unmount(component);
});
