import type { WorkbenchOpenMessage } from "../../contracts/messages";

interface RouterDependencies {
  ensureAndSend(
    tabId: number,
    message: WorkbenchOpenMessage
      | { type: "workbench/pick-image" }
      | { type: "workbench/open-linked-image"; payload: { linkUrl: string } }
  ): Promise<void>;
}

export function createWorkbenchRouter(dependencies: RouterDependencies) {
  return {
    openImage(input: {
      tabId: number;
      sourceUrl: string;
      pageUrl: string;
      pageTitle: string;
    }): Promise<void> {
      assertInjectable(input.pageUrl);
      return dependencies.ensureAndSend(input.tabId, {
        type: "workbench/open",
        payload: {
          sourceType: "image",
          sourceUrl: input.sourceUrl,
          pageUrl: input.pageUrl,
          pageTitle: input.pageTitle
        }
      });
    },

    show(tabId: number, pageUrl: string): Promise<void> {
      assertInjectable(pageUrl);
      return dependencies.ensureAndSend(tabId, { type: "workbench/show" });
    },

    openScreenshot(input: {
      tabId: number;
      imageDataUrl: string;
      pageUrl: string;
      pageTitle: string;
    }): Promise<void> {
      assertInjectable(input.pageUrl);
      return dependencies.ensureAndSend(input.tabId, {
        type: "workbench/open-screenshot",
        payload: {
          sourceType: "screenshot",
          imageDataUrl: input.imageDataUrl,
          pageUrl: input.pageUrl,
          pageTitle: input.pageTitle
        }
      });
    }
  };
}

function assertInjectable(pageUrl: string): void {
  if (!pageUrl || /^(chrome|chrome-extension|edge|about|brave|opera):/i.test(pageUrl)) {
    throw Object.assign(
      new Error("当前页面不允许浏览器扩展注入工作台"),
      { code: "PAGE_NOT_INJECTABLE" }
    );
  }
}
