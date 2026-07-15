export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "analyze-image",
        title: "分析这张图片",
        contexts: ["image"]
      });
    });
  });
});
