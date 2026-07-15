import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function BootstrapWorkbench() {
  return <main className="workbench">Hhh Prompt Studio Next</main>;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  registration: "runtime",
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "hhh-workbench",
      position: "inline",
      anchor: "body",
      onMount(container) {
        const root = createRoot(container);
        root.render(<BootstrapWorkbench />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      }
    });
    ui.mount();
  }
});
