# 2026-09-23 部署与 Harness 建设验证

## 范围

在 `E:\Project\浏览器识图插件` 完成上游源码快照部署、依赖安装、harness 补全后的全量验证。

## 环境

- Windows 10 win32 10.0.19044 x64；Node + npm；**无 git**（源码以 zip 快照获取，无历史）。
- 上游：`Hhh2178/Browser-Image-Recognition-Floating-Plugin` `main`，最后推送 2026-07-16。
- Playwright Chromium 149.0.7827.55 本次首次下载至 `C:\Users\LT5475\AppData\Local\ms-playwright`。

## 过程发现与处置

| 发现 | 处置 |
| --- | --- |
| 全新部署后 `npm run check` 在 lint 阶段失败：`tsconfig.json` 继承 `./.wxt/tsconfig.json`，但 `.wxt/` 未生成 → 11 个 `no-unsafe-*` 类型解析错误 | 运行 `npx wxt prepare` 生成类型；`package.json` 新增 `"prepare": "wxt prepare"`，后续 `npm install` 自动生成 |
| npm allow-scripts 跳过 esbuild / spawn-sync 的 postinstall | 本次构建未受影响；若后续构建异常先运行 `npm approve-scripts` |
| `AGENTS.md` 根路径指向旧机器 `D:\codex\...` | 已更新为 `E:\Project\浏览器识图插件`，并补记上游地址 |

## 验证结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| Harness 项目契约 | `npm run harness:verify:project` | ✅ 通过（契约已扩展：current-state、requirements×3、decisions） |
| Harness 发布契约 | `npm run harness:verify:release` | ✅ 通过（`v0.2.0` semver + 发布日志） |
| 完整发布检查 | `npm run check` | ✅ 通过：ESLint 0 错误；tsc 通过；Vitest 18 文件 / 51 测试全绿；`wxt build` 成功（849.9 kB）；Manifest 断言通过 |
| 真实扩展 E2E | `npm run test:e2e` | ✅ 7/7 通过（9.2s）：悬浮窗分析+历史、截图分析、页面选图、缩略图右键、设置与模板管理、缩放/窄屏回流、options 页 |

## 未覆盖

- 未在本环境手动加载 Chrome 验证 `.output/chrome-mv3`（E2E 已覆盖等价流程，但真实浏览器人工冒烟仍建议做一次）。
- 未验证真实第三方模型接口（E2E 使用本地 Mock API）。
- 无 git，无法执行 `git status`/提交/tag 类检查。
