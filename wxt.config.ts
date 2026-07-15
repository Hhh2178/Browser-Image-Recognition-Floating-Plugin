import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Hhh Prompt Studio Next",
    description: "分析网页图片和截图，并生成可复用的视觉提示词。",
    permissions: ["contextMenus", "storage", "activeTab", "scripting"],
    host_permissions: process.env.E2E === "1" ? ["<all_urls>"] : [],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png"
    },
    action: {
      default_title: "打开 Hhh Prompt Studio Next",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png"
      }
    },
    commands: {
      "analyze-screenshot": {
        suggested_key: { default: "Ctrl+Shift+Y" },
        description: "分析当前页面截图"
      }
    }
  }
});
