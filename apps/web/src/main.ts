import { mount } from "svelte";

import App from "./App.svelte";
import "./accessibility.css";

const target = document.querySelector<HTMLElement>("#app");

if (!target) {
  throw new Error("Missing #app mount target");
}

mount(App, { target });
