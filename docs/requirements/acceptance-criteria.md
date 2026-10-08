# 验收条件（Acceptance Criteria）

任何“完成”的改进或修复，在合入/发布前必须满足下列条件。命令均在项目根目录执行。

## 门禁（每次有意义变更）

| # | 条件 | 验证命令 |
| --- | --- | --- |
| A1 | Harness 文档契约通过 | `npm run harness:verify:project` |
| A2 | Lint、类型检查、单元测试、生产构建、Manifest 断言全部通过 | `npm run check` |

## 行为门禁（改动触及扩展运行时）

| # | 条件 | 触发范围 | 验证 |
| --- | --- | --- | --- |
| B1 | 真实扩展流程 E2E 通过 | 启动、content script、右键菜单、工作台流程 | `npm run test:e2e` |
| B2 | 生产 Manifest 不含 E2E 临时权限 | 构建配置或权限改动 | `npm run check:manifest`（含于 `npm run check`） |
| B3 | 密钥与诊断不泄露 | analysis/settings/诊断输出改动 | 人工审查：不得打印 Authorization、完整 Data URL、完整 Prompt |

## 发布门禁

| # | 条件 | 验证 |
| --- | --- | --- |
| C1 | 版本号符合 semver 且发布日志存在 | `npm run harness:verify:release` |
| C2 | 发布流程按 `docs/governance/release-version-policy.md` 执行 | 该文档「Release Flow」 |
| C3 | 发布证据写入 `docs/logbooks/releases/vX.Y.Z.md` | 人工检查 |

## 质量底线

- 不回退用户已有改动；不删除用户创建的提示词预设、模型设置、历史数据。
- 不提交 API Key、token、`.env`、私钥、浏览器配置到仓库。
- UI 改动遵守 `docs/systems/workbench/frontend-design/` 的设计令牌与组件注册表。
- 新增或修改的接口、消息契约、权限、存储行为，同步更新 `docs/systems/` 对应系统文档。

## 失败处理

任一门禁失败：修复后重跑；无法立即修复的，在 `docs/logbooks/validations/` 记录失败原因与阻塞范围，并在 `docs/current-state.md` 的风险段落登记，不得标记为完成。
