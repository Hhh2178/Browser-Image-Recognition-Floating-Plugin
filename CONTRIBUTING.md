# 贡献指南

感谢你改进 Hhh Prompt Studio。小型修复可以直接提交 Pull Request；较大的功能、权限变化、存储迁移或产品方向调整，建议先创建 Issue 讨论。

## 开发环境

- Node.js 20 或更高版本
- npm
- 桌面版 Google Chrome

```bash
npm install
npm run dev
```

## 提交前检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:manifest
```

修改扩展启动、content script、工作台或关键用户流程时，还应运行：

```bash
npm run test:e2e
```

文档或治理文件变更应运行：

```bash
npm run harness:verify:project
```

## 代码原则

- 遵循现有 WXT、React、TypeScript、Vitest 和 Playwright 模式。
- 跨 background、content、options 的消息先定义在 `src/contracts`。
- 不在 content script 中读取或保存 API Key。
- 不记录 Authorization Header、完整 Data URL 或完整私人提示词。
- 新权限必须有明确用户功能、最小范围和相应文档。
- 用户数据格式变化必须考虑迁移与失败提示。
- UI 变更应兼顾键盘焦点、窄屏布局、浅色/深色主题和真实扩展 E2E。

## Pull Request 内容

请说明问题、解决方式、用户可见变化、验证命令和结果。UI 变化建议附脱敏截图。不要提交 `.env`、API Key、浏览器资料、`node_modules`、`.output` 或测试生成物。

## 文档同步

- 用户安装方式变化：更新 `README.md` 和 `docs/INSTALL.md`。
- 模型、权限或传输行为变化：更新 `docs/CONFIGURATION.md` 与 `PRIVACY.md`。
- 架构或消息边界变化：更新 `docs/ARCHITECTURE.md` 和相关系统文档。
- 有意义的工作：在 `docs/logbooks/daily/` 添加或更新当天记录。

