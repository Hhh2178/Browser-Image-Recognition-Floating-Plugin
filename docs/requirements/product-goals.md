# 产品目标（Product Goals）

## 愿景

让任何人在任意网页上，用自己的视觉模型接口分析图片，并在可拖动的悬浮工作台中沉淀可复用的结果。

## 长期目标

1. **不绑定服务商**：保持 OpenAI Chat Completions 兼容接口的开放接入，支持多服务商、多模型与每日额度自动切换。
2. **入口无处不在**：图片右键、工具栏手动选图、`Ctrl+Shift+Y` 页面截图、可选图片悬停按钮，覆盖常见识图触发场景。
3. **结果可复用**：自定义/导入/导出提示词模板与团队配置，本地保留最近 50 条成功记录并支持增量导出。
4. **隐私优先**：API Key 只存浏览器本地；生产 Manifest 默认不声明永久 `<all_urls>`；不提供中转服务器。
5. **可迭代的工程底座**：以 `npm run check`、`harness:verify`、Vitest、Playwright 构成的验证链支撑持续改进与优化。

## 非目标（Non-Goals）

- 不做医疗、法律、金融等高风险专业结论（见 `docs/USE_CASES.md`）。
- 不做人脸身份确认、年龄或敏感属性推断。
- 不做视频逐帧分析、大规模无人值守批处理。
- 不做截取浏览器外屏幕内容的独立截图伴侣（已评估并放弃，见 `docs/decisions/0003-abandon-screenshot-companion.md`）。
- 不做离线处理；模型请求必然发送到用户配置的第三方服务商。
- 不做云同步、账号系统；团队配置导出由用户自行传递。
- 不承诺 Chrome Web Store 自动安装与全量覆盖式自动更新（需单独审批，见 `docs/decisions/0002-no-auto-overwrite-updates.md`）。

## 关系文档

- 阶段范围与约束：`docs/requirements/scope.md`
- 验收条件：`docs/requirements/acceptance-criteria.md`
- 场景边界细节：`docs/USE_CASES.md`
