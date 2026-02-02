import { signal, computed, effect } from './signals.js';
import { h, list, mount, navigate } from './dom.js';

export function Counter() {
  // State
  const $count = signal(0);

  // Render
  const render = () => {
    return h("div", { class: "counter-rnr4" }, [h("h1", null, ["Count: ", $count]), h("div", { class: "buttons-rnr4" }, [h("button", { onclick: () => { $count.value--; } }, "-"), h("button", { onclick: () => { $count.value = 0; } }, "Reset"), h("button", { onclick: () => { $count.value++; } }, "+")]), $count.value > 10 ? [h("p", { class: "warning-rnr4" }, "Getting high!")] : []]);
  };

  return render;
}