# Hhh Prompt Studio Next

面向创意小团队的浏览器图片与截图分析扩展。支持右键图片、工具栏、截图快捷键、可选悬停入口、提示词模板、OpenAI 兼容视觉模型、本地历史以及悬浮/停靠工作台。

## 快速开始

运行 npm install，然后运行 npm run dev。

生产交付前运行 npm run check，构建目录为 .output/chrome-mv3。在 Chrome 扩展管理页启用开发者模式后，选择“加载已解压的扩展程序”并打开该目录。

## 常用命令

- npm run dev：WXT 开发模式。
- npm run lint：ESLint 严格检查。
- npm run typecheck：TypeScript 严格类型检查。
- npm test：单元与组件测试。
- npm run test:e2e：真实 Chromium 扩展流程。
- npm run build：生产构建。
- npm run zip：生成可分发压缩包。

## 项目结构

- entrypoints：background、content、hover 和 options 入口。
- src/contracts：跨上下文消息与分析类型。
- src/features：设置、模板、媒体、分析、历史和工作台。
- src/styles：工作台设计令牌与布局。
- tests/e2e：真实扩展浏览器流程。
- docs：安装、配置、迁移和架构说明。

首版不包含视频拉片、美术提案、Eagle、云同步或 Gemini 原生接口。
