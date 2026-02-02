import { signal, computed, effect } from './signals.js';
import { h, list, mount, navigate } from './dom.js';

export function ArbitraryTest() {
  // Render
  const render = () => {
    return h("div", { class: "p-[15px] bg-[#435453] w-[300px]" }, [h("h1", { class: "text-[24px] text-[#fff]" }, "Hello Arbitrary Values"), h("p", { class: "mt-[2rem] text-[#ccc]" }, "Testing arbitrary value support"), h("div", { class: "flex gap-[1.5rem] py-[10px]" }, [h("span", { class: "rounded-[8px] bg-[#667788] p-[8px]" }, "Badge 1"), h("span", { class: "rounded-[8px] bg-[#889900] p-[8px]" }, "Badge 2")]), h("button", { class: "mt-[20px] px-[16px] py-[8px] border-[2px] border-[#fff] rounded-[4px]" }, "Click Me")]);
  };

  return render;
}