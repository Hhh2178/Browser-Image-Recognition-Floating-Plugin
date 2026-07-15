export const IMAGE_MENU_ID = "analyze-image";
export const PICK_MENU_ID = "pick-page-image";

export const CONTEXT_MENU_DEFINITIONS: chrome.contextMenus.CreateProperties[] = [
  {
    id: IMAGE_MENU_ID,
    title: "Hhh：分析这张图片",
    contexts: ["image"]
  },
  {
    id: PICK_MENU_ID,
    title: "Hhh：选择页面图片分析",
    contexts: ["page", "link"]
  }
];
