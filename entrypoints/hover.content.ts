const BUTTON_ID = "hhh-hover-analyze";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  registration: "runtime",
  main() {
    let activeImage: HTMLImageElement | null = null;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "分析";
    Object.assign(button.style, {
      position: "fixed",
      zIndex: "2147483646",
      display: "none",
      border: "1px solid #b8c2cf",
      borderRadius: "6px",
      background: "#172033",
      color: "#ffffff",
      padding: "6px 10px",
      font: '12px/1.2 "Segoe UI", sans-serif',
      cursor: "pointer"
    });
    document.documentElement.append(button);

    document.addEventListener("pointerover", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.width < 120 || target.height < 80) {
        return;
      }
      activeImage = target;
      const rect = target.getBoundingClientRect();
      button.style.left = `${Math.max(8, rect.right - 58)}px`;
      button.style.top = `${Math.max(8, rect.top + 8)}px`;
      button.style.display = "block";
    }, true);

    button.addEventListener("click", () => {
      if (!activeImage) {
        return;
      }
      void chrome.runtime.sendMessage({
        type: "workbench/open-from-hover",
        payload: {
          sourceUrl: activeImage.currentSrc || activeImage.src,
          pageUrl: location.href,
          pageTitle: document.title
        }
      });
    });
  }
});
