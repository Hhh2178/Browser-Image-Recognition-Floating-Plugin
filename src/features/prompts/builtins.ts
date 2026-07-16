import type { PromptPreset } from "./prompt-schema";
import { LEGACY_BUILTIN_PROMPTS } from "./legacy-builtins";

export const BUILTIN_PROMPTS: PromptPreset[] = [
  {
    id: "builtin:image-analysis",
    name: "通用图片反推",
    taskType: "image_analysis",
    description: "提取主体、构图、光线、色彩、材质与风格。",
    tags: ["通用", "图片"],
    content: [
      "分析当前图片，提取主体、构图、镜头、光线、色彩、材质、环境与整体风格。",
      "目标输出格式为 {{outputFormat}}。",
      "只返回可直接复用的最终结果，不要输出分析过程。"
    ].join("\n"),
    supportedFormats: ["zh", "en", "json"],
    source: "builtin",
    schemaVersion: 1,
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "builtin:screenshot-analysis",
    name: "网页截图分析",
    taskType: "screenshot_analysis",
    description: "识别布局、层级、组件、留白与视觉重点。",
    tags: ["网页", "截图"],
    content: [
      "分析当前网页截图的布局、信息层级、组件风格、留白、色彩和视觉重点。",
      "页面标题为 {{pageTitle}}，目标输出格式为 {{outputFormat}}。",
      "只返回最终结果。"
    ].join("\n"),
    supportedFormats: ["zh", "en", "json"],
    source: "builtin",
    schemaVersion: 1,
    createdAt: 0,
    updatedAt: 0
  },
  ...LEGACY_BUILTIN_PROMPTS
];
