// @vitest-environment happy-dom
import { mount, tick, unmount } from "svelte";
import { afterEach, expect, it } from "vitest";
import BoardNotation from "./BoardNotation.svelte";
import { BoardInputController, boardInputPosition } from "./board-input.js";
afterEach(() => document.body.replaceChildren());

it("keeps invalid text and grounded refusal accessible inside its modal, then releases background on Escape", async () => {
  const outside=document.body.appendChild(document.createElement("button"));outside.textContent="Outside";
  const target=document.body.appendChild(document.createElement("div"));
  const controller=new BoardInputController(boardInputPosition("8/8/8/8/8/8/4P3/4K2k w - - 0 1","white",false,false));
  const component=mount(BoardNotation,{target,props:{disabled:false,popup:true,onSubmit:text=>controller.dispatch({type:"text_move",value:text})}});await tick();
  const summary=target.querySelector<HTMLElement>("summary")!;summary.click();await tick();
  expect(outside.inert).toBe(true);
  const input=target.querySelector<HTMLInputElement>("input")!;input.value="e5";input.dispatchEvent(new Event("input",{bubbles:true}));await tick();
  target.querySelector("form")!.dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true}));await tick();
  expect(input.value).toBe("e5");expect(target.querySelector("details")!.open).toBe(true);
  const message=target.querySelector('[role="status"]')!.textContent!;expect(message).toBe(controller.state.lastAnnouncement);expect(message).not.toBe("");
  expect(input.getAttribute("aria-describedby")).toBe(target.querySelector('p[id]')!.id);
  input.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await tick();
  expect(outside.inert).toBe(false);expect(document.activeElement).toBe(summary);
  summary.click();await tick();expect(input.value).toBe("e5");
  input.value="e4";input.dispatchEvent(new Event("input",{bubbles:true}));await tick();
  target.querySelector("form")!.dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true}));await tick();
  expect(input.value).toBe("");expect(target.querySelector("details")!.open).toBe(false);expect(outside.inert).toBe(false);
  await unmount(component);
});
