# 0001 轻量文档日志模式（lightweight doc-log harness）

- 状态：已采纳
- 日期：2026-07-16（原记录于 `docs/logbooks/daily/2026-07-16.md`，2026-09-23 迁入决策目录）

## 背景

项目需要一套让 Agent 跨会话持续工作的治理层：规则、需求、现状、证据。候选方案包括引入可查询的 Ledger/数据库模式，或维持纯 Markdown 文档 + 日志。

## 决策

采用**轻量文档日志模式**：

- 规则在 `AGENTS.md` 与 `docs/governance/`；需求在 `docs/requirements/`；现状在 `docs/current-state.md`；证据在 `docs/logbooks/`；持久选择在 `docs/decisions/`。
- 校验只用确定性脚本 `scripts/verify-harness-contract.mjs`（`harness:verify:project` / `harness:verify:release`），不引入外部服务。
- 不引入 Ledger、上下文数据库或全局钩子。

## 影响

- 每个事实只有一个权威来源，新增文档族必须同步 `docs/INDEX.md` 与校验脚本。
- 若项目规模、审计风险显著上升，可重新评估 Ledger 模式（届时新建决策编号取代本条）。
