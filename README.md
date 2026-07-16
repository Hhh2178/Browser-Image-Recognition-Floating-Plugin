# Hhh Prompt Studio Next

在任意网页上选择图片或截取当前页面，通过你自己的视觉模型接口进行分析，并在可拖动的悬浮工作台中获得可复用结果。

[English](README.en.md) · [安装指南](docs/INSTALL.md) · [使用手册](docs/USAGE.md) · [应用场景](docs/USE_CASES.md) · [故障排查](docs/TROUBLESHOOTING.md)

> 当前版本：`0.2.0`（公开测试阶段）。目前通过“加载已解压的扩展程序”安装，尚未发布到 Chrome 网上应用店。

## 它能做什么

Hhh Prompt Studio Next 是一个 Chrome Manifest V3 浏览器扩展。它把网页图片、链接缩略图或当前标签页截图交给 OpenAI Chat Completions 兼容的视觉模型分析，不绑定单一模型服务商。

- 在图片右键菜单中直接打开分析悬浮窗。
- 点击扩展图标，从当前网页手动选择图片。
- 使用 `Ctrl+Shift+Y` 分析当前可见页面截图。
- 使用内置模板生成图片反推提示词、网页视觉分析或结构化 JSON。
- 创建、导入和导出自己的提示词模板与团队配置。
- 配置多个服务商和多个模型，并按可选的每日额度自动切换。
- 在本机保存最近 50 条成功记录，并导出尚未导出的结果。
- 可选启用图片悬停按钮；默认不申请全部网站访问权限。

## 适合谁

| 用户 | 常见用途 |
| --- | --- |
| AI 图片创作者 | 从参考图提取主体、构图、镜头、光线、材质和风格提示词 |
| UI/UX 与前端团队 | 分析网页截图的信息层级、组件、色彩、留白和视觉重点 |
| 电商与广告团队 | 拆解商品图、海报、Banner 和竞品素材的视觉表达 |
| 内容运营与研究人员 | 将网页图片批量转成结构化观察结果，保留本地历史 |
| 提示词工程与模型测试人员 | 使用同一图片和模板比较不同兼容视觉模型的输出 |

更完整的场景、限制与不适用范围见[应用场景](docs/USE_CASES.md)。

## 快速开始

### 1. 构建扩展

需要 Node.js 20 或更高版本，以及 npm。

```bash
git clone https://github.com/Hhh2178/Browser-Image-Recognition-Floating-Plugin.git
cd Browser-Image-Recognition-Floating-Plugin
npm install
npm run build
```

### 2. 加载到 Chrome

1. 打开 `chrome://extensions`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目中的 `.output/chrome-mv3` 目录。

### 3. 配置模型

打开扩展设置，在“模型与接口”中填写：

| 字段 | 示例 | 说明 |
| --- | --- | --- |
| API 地址 | `https://api.example.com/v1` | 兼容 Chat Completions 的 Base URL |
| Endpoint 模式 | `Base URL` | 扩展会补全 `/chat/completions` |
| API Key | `••••••••` | 只保存在当前浏览器的扩展本地存储中 |
| 模型标识 | 服务商提供的模型 ID | 必须支持图片输入 |
| 图片传输 | `自动` | 优先发送浏览器已读取的 Data URL |

保存后点击“测试当前模型”。扩展不附带 API Key 或模型额度，使用成本和数据处理规则取决于你选择的服务商。

### 4. 第一次分析

在普通网页图片上右键，选择“Hhh：悬浮窗分析图片”，选择模板与输出格式，然后点击“开始分析”。如果右键目标只是一个缩略图链接，扩展会尽量解析并打开其实际图片；解析失败时可使用工具栏的手动选图入口。

## 数据与隐私

- API Key、设置和提示词模板保存在 `chrome.storage.local`。
- 最近 50 条成功历史保存在扩展自己的 IndexedDB 中。
- 分析时，提示词和图片会发送到你配置的模型接口；本项目不提供中转服务器。
- 团队配置导出不包含 API Key。
- 扩展默认不声明永久的 `<all_urls>` 权限。悬停分析需要用户主动授予可选网站访问权限。

请在使用前阅读[隐私说明](PRIVACY.md)。不要在 Issue、日志或截图中提交 API Key、Authorization Header 或包含敏感信息的原始图片。

## 浏览器与接口兼容性

- 主要支持：桌面版 Google Chrome，Manifest V3。
- 可能兼容但尚未作为发布目标验证：其他 Chromium 浏览器。
- 不支持注入悬浮窗：`chrome://` 页面、Chrome 网上应用店、浏览器受保护页面及页面策略禁止注入的场景。
- 模型接口：OpenAI Chat Completions 兼容请求，图片以 `image_url` 内容块发送；并非所有“OpenAI 兼容”接口都支持视觉输入。

## 文档

| 文档 | 内容 |
| --- | --- |
| [文档中心](docs/INDEX.md) | 所有用户文档和开发文档的入口 |
| [安装与更新](docs/INSTALL.md) | 环境要求、安装、更新和卸载 |
| [使用手册](docs/USAGE.md) | 每个入口、模板、历史和团队配置的操作方法 |
| [模型配置](docs/CONFIGURATION.md) | Endpoint、图片传输、多模型和权限说明 |
| [应用场景](docs/USE_CASES.md) | 适用范围、示例工作流和边界 |
| [故障排查](docs/TROUBLESHOOTING.md) | 常见报错、诊断顺序与反馈信息 |
| [架构说明](docs/ARCHITECTURE.md) | 扩展上下文、数据流、安全边界和测试 |
| [贡献指南](CONTRIBUTING.md) | 开发流程、检查项与提交规范 |
| [安全策略](SECURITY.md) | 私下报告安全问题的方法 |

## 开发

```bash
npm run dev              # WXT 开发模式
npm run lint             # ESLint
npm run typecheck        # TypeScript 严格检查
npm test                 # Vitest 单元与组件测试
npm run test:e2e         # Playwright 真实扩展流程
npm run check            # 发布前完整检查
npm run zip              # 生成分发压缩包
```

生产构建位于 `.output/chrome-mv3`。详细模块边界见[架构说明](docs/ARCHITECTURE.md)。

## 反馈与贡献

发现缺陷或有功能建议，请先搜索[现有 Issues](https://github.com/Hhh2178/Browser-Image-Recognition-Floating-Plugin/issues)，再创建新 Issue。请提供浏览器版本、扩展版本、复现步骤、预期结果和脱敏后的实际结果。

欢迎提交 Pull Request。开始前请阅读[贡献指南](CONTRIBUTING.md)。

## 当前限制

- 尚无 Chrome Web Store 自动安装与更新渠道。
- 不包含视频逐帧分析、云同步、Eagle 集成或服务商原生专用协议。
- 分析质量、速度、费用和内容政策由所配置的第三方模型服务决定。

## 许可证

本项目采用 [MIT License](LICENSE)。
