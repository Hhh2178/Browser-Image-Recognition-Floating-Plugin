export const IMAGE_MENU_ID = "analyze-image";

export const CONTEXT_MENU_DEFINITIONS: chrome.contextMenus.CreateProperties[] = [
  {
    id: IMAGE_MENU_ID,
    title: "Hhh：悬浮窗分析图片",
    contexts: ["image", "link"]
  }
];
