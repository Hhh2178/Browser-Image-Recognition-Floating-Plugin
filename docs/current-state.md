# 当前状态（Current State）

> 权威来源：当前阶段、活跃工作、风险、下一步。每次有意义的任务结束时更新。
> 最后更新：2026-09-23

## 部署

| 项 | 值 |
| --- | --- |
| 本地根目录 | `E:\Project\浏览器识图插件` |
| 上游 | `https://github.com/Hhh2178/Browser-Image-Recognition-Floating-Plugin`，`main` 分支 |
| 获取方式 | GitHub 源码 zip 快照（2026-09-23）；同日经 `git init` + fetch 上游 main 基线完成首次提交推送（见 daily log） |
| 上游最后推送 | 2026-07-16 |
| 版本 | `0.2.0`（公开测试，unpacked 安装） |
| 依赖 | `npm install` 已完成（561 包） |
| WXT 类型 | `.wxt/` 已生成；`package.json` 新增 `prepare` 脚本，后续安装自动生成 |
| 生产构建 | `.output/chrome-mv3` 构建成功，总量约 885 kB（含内置电商模板） |

## 当前阶段

轻量文档日志 harness 模式（见 `docs/decisions/0001-lightweight-doc-log-harness-mode.md`）。部署与 harness 建设已完成，准备进入改进与优化迭代。

## 本次验证（2026-09-23）

| 检查 | 结果 | 备注 |
| --- | --- | --- |
| `npm run harness:verify:project` | 通过 | 扩展后的契约覆盖 requirements/current-state/decisions |
| `npm run harness:verify:release` | 通过 | `v0.2.0` 发布日志存在 |
| `npm run check` | 通过 | ESLint 0 错误、TypeScript 通过、Vitest 18 文件 51 测试全绿、生产构建 849.9 kB、Manifest 断言 |
| `npm run test:e2e` | 通过 | 7/7 Playwright 扩展流程全绿（9.2s），Chromium 149 已下载至本机 |

详细证据：`docs/logbooks/validations/2026-09-23-deployment-harness.md`

## 环境事实

- Windows 10（win32 10.0.19044 x64），Node + npm 可用。
- git 由 Git for Windows 提供（v2.55.0，Git Bash 内可用；**未加入 Windows cmd 的 PATH**，cmd 下 `where git` 找不到属预期）。提交身份 `Hhh2178`，凭据管理器 `manager`。
- esbuild / spawn-sync 的 postinstall 被 npm allow-scripts 策略跳过；本次构建未受影响，若后续构建异常，先运行 `npm approve-scripts`。
- 访问 github.com：直连易超时；本仓库已配置本地 `http.proxy=http://127.0.0.1:7890`（FlClash），后续 fetch/push 需代理运行中。

## 风险

1. 开发版尚未在真实 Chrome 手动加载冒烟（E2E 已覆盖等价流程）；三需求迭代计划已归档暂缓，实施风险与回退见计划文档。
2. Chrome 未在本环境验证加载 `.output/chrome-mv3`；需要手动开发者模式加载确认。
3. 无 Chrome Web Store 渠道；安装更新均为手动（`docs/decisions/0002-no-auto-overwrite-updates.md`）。
4. 上游仓库若继续演进，快照部署需手动同步（无 git 时只能重新下载对比）。

## Next

1. **需求 3 预设固化已实施**（2026-09-23 第三轮）：`DEFAULT_SETTINGS` 固化 ModelScope 3 模型（激活、Key 留空）+ OpenAI 停用；「电商海报类反推」固化为第 6 个内置模板。**需求 2（五模板重构）与需求 1（截图伴侣）仍归档**：`docs/superpowers/plans/2026-09-23-companion-screenshot-prompts-presets.md` 按阶段 0→6 恢复。
2. 首次提交与推送已完成（hash 见 `docs/logbooks/daily/2026-09-23.md` 第二轮记录）；此后一切改动在 git 历史之上进行。
3. 待手动在 Chrome 加载 `.output/chrome-mv3` 完成真实识图冒烟（由用户执行）。
