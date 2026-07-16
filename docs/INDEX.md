# 文档中心

## 用户文档

| 我想要…… | 阅读 |
| --- | --- |
| 安装、更新或卸载扩展 | [`INSTALL.md`](INSTALL.md) |
| 完成第一次分析并了解全部入口 | [`USAGE.md`](USAGE.md) |
| 判断项目是否适合自己的任务 | [`USE_CASES.md`](USE_CASES.md) |
| 配置接口、模型、图片传输和权限 | [`CONFIGURATION.md`](CONFIGURATION.md) |
| 解决悬浮窗、接口或图片分析问题 | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |
| 了解本地数据和第三方模型数据流 | [`../PRIVACY.md`](../PRIVACY.md) |
| 从旧版插件迁移 | [`MIGRATION.md`](MIGRATION.md) |

## 项目参与者

| 主题 | 文档 |
| --- | --- |
| 贡献代码或文档 | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| 私下报告安全问题 | [`../SECURITY.md`](../SECURITY.md) |
| 扩展架构与安全边界 | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| 治理与发布规则 | [`governance/`](governance/) |
| 系统接口与验证 | [`systems/`](systems/) |
| 工作与发布记录 | [`logbooks/`](logbooks/) |

以下内容面向项目维护 Agent 和核心贡献者。

## Fast Path

For a new task, read:

1. `AGENTS.md`
2. `README.md`
3. This index
4. Latest daily log in `docs/logbooks/daily/`
5. Relevant system document under `docs/systems/`

## Source Of Truth

| Topic | Canonical Location |
| --- | --- |
| Install and Chrome loading path | `docs/INSTALL.md` |
| End-user workflows and product scope | `docs/USAGE.md`, `docs/USE_CASES.md` |
| Model/provider configuration | `docs/CONFIGURATION.md` |
| Troubleshooting and privacy | `docs/TROUBLESHOOTING.md`, `PRIVACY.md` |
| Runtime architecture | `docs/ARCHITECTURE.md`, `docs/systems/extension/README.md` |
| Migration from legacy extension | `docs/MIGRATION.md` |
| Specs and implementation plans | `docs/superpowers/specs/`, `docs/superpowers/plans/` |
| Governance and release rules | `docs/governance/` |
| Harness verification | `docs/systems/harness/README.md` |
| Work and release evidence | `docs/logbooks/` |

## Document Families

- `docs/governance/`: durable rules for releases, worktree safety, documentation, and engineering guardrails.
- `docs/systems/`: runtime systems, interfaces, permissions, data flow, and verification.
- `docs/logbooks/`: append-only evidence for daily work, releases, validations, and incidents.
- `docs/superpowers/`: product specs and execution plans.

## Update Rules

- Update this index when adding, moving, or retiring a documentation family.
- Update system docs when message contracts, storage, permissions, provider behavior, or UI shell behavior changes.
- Update release logs for every version tag.
- Update daily logs for meaningful implementation, debugging, migration, or governance work.

## Verification

- `npm run harness:verify:project`
- `npm run harness:verify:release`
- `npm run check`
