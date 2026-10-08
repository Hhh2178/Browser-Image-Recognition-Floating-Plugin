# 0003 放弃独立截图伴侣与屏幕外截图能力

- 状态：已采纳（取代归档计划中对需求 1 的路线 B 决策）
- 日期：2026-09-23

## 背景

三需求迭代计划（`docs/superpowers/plans/2026-09-23-companion-screenshot-prompts-presets.md`）中，需求 1“截取浏览器外内容并自动进入待识别区”已完成方案选型：在插件内截屏（desktopCapture，无法区域框选）与独立软件连接（路线 B：Electron 区域框选 + 本地 WebSocket）之间选定路线 B。

## 决策

**放弃需求 1 的全部实施**：

- 不新增 `offscreen` / `desktopCapture` / `nativeMessaging` 权限；
- 不开发 `companion/` 独立软件与 `external/screenshot` 消息契约；
- 截图能力维持现状：`Ctrl+Shift+Y` 仅截取当前浏览器可视区域（`captureVisibleTab`）；
- 归档计划中需求 1 相关章节仅作历史记录，不再按阶段推进。

## 影响

- 扩展权限面保持 5 项不变（`assert-manifest.mjs` 断言无需变更）；
- “截取浏览器外屏幕内容”列为非目标，见 `docs/requirements/product-goals.md` 非目标列表；
- 若未来重新立项，需新建决策编号并重新评估当时的技术约束。
