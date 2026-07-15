import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Hhh Prompt Studio Next",
    description: "分析网页图片和截图，并生成可复用的视觉提示词。",
    permissions: ["contextMenus", "storage", "activeTab", "scripting"],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    commands: {
      "analyze-screenshot": {
        suggested_key: { default: "Ctrl+Shift+Y" },
        description: "分析当前页面截图"
      }
    }
  }
});
