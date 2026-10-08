# 三需求迭代实施计划（已归档）

> **状态：已归档·暂缓实施（archived, execution paused）**
> 归档日期：2026-09-23
> 路线决策：需求 1 采用**路线 B——独立软件 + 本地 WebSocket**，v1 能力=区域框选截图（经用户两轮问答确认）
> 关联输入：`docs/logbooks/validations/attachments/2026-09-23-extracted-presets.redacted.json`（已安装版本的服务商/提示词提取证据，无 API Key）
> 恢复方式：用户发起推进后，按阶段 0→6 顺序执行；实施前先重读 `AGENTS.md` 与 `docs/current-state.md`
> 审批记录：方案选型问答（路线 B/能力=区域框选）+ 文件级步骤均经用户审阅，因优先级调整暂缓

## 需求背景

1. **需求 1（截图能力）**：自动把截图加载进插件待识别区；支持截取浏览器之外的内容。已选定独立软件方案（插件内 desktopCapture 方案因不支持区域框选被排除）。
2. **需求 2（提示词模板优化）**：以自定义模板「电商海报类反推」的六段式框架为参考，重构全部 5 个内置模板。
3. **需求 3（模型预设固化）**：把已运行版本的服务商/模型配置固化为开发版默认预设，API Key 一律留空。

## 阶段 0：准备（~10 分钟）

1. 把预设提取数据拷入 `docs/logbooks/validations/attachments/2026-09-23-extracted-presets.redacted.json`（若已入库则跳过；入库前校验全文无 `apiKey` 字段）。
2. 确认基线绿：`npm run harness:verify:project` + `npm run check` 全绿，从干净基线开始。

## 阶段 1：需求 3——模型预设固化

**Step 1.1 修改 `src/features/settings/settings-schema.ts` 的 `DEFAULT_SETTINGS`**（数据源=入库 JSON，已含真实 id）：

- `providers[1]` ModelScope：`enabled: true`；models 去重——删除重复的 `model-7f6e8bb3-9ebe-42e8-b05a-5f2857fc9ec7`（与 `model-e295ad0c-...` 同为 `Qwen/Qwen3.8-27B`），保留 3 个模型：`model-modelscope-qwen-vl`（Qwen/Qwen3.8-Flash-Next）、`model-0025d3ee-6b03-46aa-9b1c-19ebaaaa7925`（DeepSeek-V4.1-Flash）、`model-e295ad0c-5f09-4d9c-bbff-ee6c71e702fd`（Qwen/Qwen3.8-27B），各 `dailyLimit: 50`、`apiKey: ""`。
- `providers[0]` OpenAI：`enabled: false`、GPT-4o、`apiKey: ""`（现状已符合，确认不动）。
- `activeProviderId: "provider-modelscope"`、`activeModelId: "model-modelscope-qwen-vl"`（该 id 存在于激活服务商 models 中，能过 `superRefine`）。
- `hoverEnabled: false`、`theme: "system"`（与运行版一致）。

**Step 1.2 测试** `src/features/settings/settings-schema.test.ts` 追加 3 例：

- `settingsSchema.safeParse(DEFAULT_SETTINGS)` 成功；
- 所有 provider `apiKey === ""`；ModelScope 激活、OpenAI 停用；
- `Qwen/Qwen3.8-27B` 恰好出现 1 次（去重防回归）。

**Step 1.3** `npx vitest run src/features/settings` 绿；`npm run test:e2e` 确认既有 e2e 不被新默认破坏，若断言旧默认值则**只改期望值不改行为**。

**Step 1.4 文档影响判定**：README 配置表格是"填写示例"不声称默认值、CONFIGURATION 无默认值声明 → **no update needed**（记入日志）。

## 阶段 2：需求 2——提示词模板六段式重构

**Step 2.1 新建 `src/features/prompts/sections.ts`**（共享脚手架，全部段落只允许 `{{outputFormat}}/{{sourceType}}/{{pageTitle}}` 三个变量，否则 `renderPrompt` 抛错）：

- `outputProtocol()`：zh/en/json 显式三分支行为定义 + 集中负面清单（禁解释/分析过程/Markdown/代码块/标题/前言）；
- `confidenceRules()`：证据优先、不虚构品牌/型号/人物/IP/字体/器材、无法读取的文字降级为视觉描述；
- `lengthFloor(zhMin, enMin)`：字数下限 + 安全阀成对句（"信息较少时不需要为满足字数刻意扩写…"句式）；
- `jsonSkeleton(fields: string[])`：字段空数组骨架 + "值必须为具体字符串数组"规则；
- `organizationOrder(chain)`：箭头链组织顺序句；
- `closingCheck()`：收尾自检句（"不停留在画面里有什么，而要反推如何构成"）。

**Step 2.2 重写 `builtins.ts` 两个现行模板**（仅动 `content`，**id/name/description/tags/taskType/supportedFormats 一律不变**）：

- `builtin:image-analysis`（86→约 2800 字符）六段式：①角色与任务重定义 ②outputProtocol ③confidenceRules ④编号维度约 10 章（主体与关系/服饰与材质/姿态与神情/环境与空间/布光/镜头与构图/色彩/风格气质/文字条件章"如图中有文字…"/成片约束），每章三件套=作用句+词表枚举+注意事项 ⑤分格式规格：lengthFloor(400,700)+organizationOrder 链+JSON 9 字段骨架（`subject/style/composition/lighting/color/environment/camera/typography/quality`——**字段名与章节名一一映射**，条件字段 typography 注明"无文字则留空数组"）+逐字段说明 ⑥closingCheck。
- `builtin:screenshot-analysis`（89→约 2200 字符）：恢复 legacy 的**界面类/图片类双分支**各配词表；消费 `{{pageTitle}}` 与 `{{sourceType}}`（元信息句"素材类型 {{sourceType}}，页面标题 {{pageTitle}}"）；lengthFloor(300,550)；JSON 8 字段（subject/style/composition/lighting/color/layout/ui/quality）含字段说明；负面清单+组织顺序。

**Step 2.3 重写 `legacy-builtins.ts` 3 个模板的 `content`**（id/name 等元数据不变）：

- `legacy-high-fidelity-image`：450 字硬下限→`lengthFloor` 安全阀句式；`quality` 的硬编码"无文字"改条件句（"原图无文字则保持干净，不得添加乱码/随机 Logo"）；补"上述维度依次对应 JSON 的 ×× 字段"映射句；维度三件套补齐。
- `legacy-screenshot-visual`：双分支各扩为三件套+JSON 8 字段逐字段说明+组织顺序+confidenceRules。
- `legacy-art-blueprint`：硬编码 `subtitle: "FULL-SPECTRUM BLUEPRINT V4"` 改为"根据图片气质自拟的纯中文副标题"规则；其余数值规则（colors 5 色值、reversePrompt 260-420 汉字）保留并补安全阀精神句。

**Step 2.4 新建 `src/features/prompts/builtins.test.ts`**：

- 5 个模板全过 `promptSchema.array().parse`；
- id/name 集合断言（防漂移：期望恰为 5 个既有 id）；
- 逐模板 `renderPrompt(content, {outputFormat:"json"|"zh", sourceType:"image", pageTitle:"t"})` 不抛；
- 含 json 的模板 content 含 JSON 骨架标记与 `lengthFloor` 固定短语（实现时选定稳定断言词）。

**Step 2.5** `npx vitest run src/features/prompts`（含既有 prompt-migration 3 名断言应绿）→ 读 `docs/USAGE.md` 模板段，文案冲突才改（no update needed 则记录）。

## 阶段 3：需求 1——扩展侧

**Step 3.1 契约** `src/contracts/messages.ts` 的 `RuntimeMessage` 联合新增：

```ts
| { type: "external/screenshot"; payload: { imageDataUrl: string; source: "companion" } }
| { type: "companion/set-enabled"; payload: { enabled: boolean } }
| { type: "companion/get-status" }  // 响应 { connected: boolean; lastSeen: number }
```

**Step 3.2 新模块 `src/features/companion/`**：

- `companion-protocol.ts`：帧类型（`{type:"auth",token}` / `{type:"screenshot",dataUrl}` / `{type:"ping"}`）、`DEFAULT_PORT = 39871`、storage keys（`hhhCompanion`、`hhhCompanionStatus`）；注释与 `companion/src/shared/protocol.ts` 互指为同一协议的两端。
- `companion-schema.ts`（zod）：`{ enabled: boolean, port: 1..65535, token: string }` + `DEFAULT_COMPANION_SETTINGS`；单测：默认值、非法 port 拒绝。
- `companion-repository.ts`：`hhhCompanion` 读写 + `hhhCompanionStatus` 读（offscreen 写）。
- `validate-external-screenshot.ts`：校验 `^data:image/(png|jpeg);base64,` 前缀 + 长度 ≤15MB 字符上限；单测 4 例（合法/缺前缀/超长/非字符串）。
- `ensure-offscreen.ts`：`chrome.offscreen.hasDocument/createDocument/closeDocument` 封装（url=`chrome.runtime.getURL("offscreen.html")`，reason 选值实现时对照 `chrome.offscreen.Reason` 合法枚举并注释理由）。

**Step 3.3 offscreen 接收端** `entrypoints/offscreen.html` + `entrypoints/offscreen.ts`（WXT unlisted 页面；html 内 `<script type="module" src="./offscreen.ts">`；**实现时验证输出路径确为根 `offscreen.html`**，不符则回退 `public/` 静态 html 方案并记决策）：

- 读 `hhhCompanion`，未启用 → `window.close()`；
- 连 `ws://127.0.0.1:{port}` → open 发 auth → 收到 screenshot 帧先过 validate → `chrome.runtime.sendMessage(external/screenshot)`；
- 每 10s ping 并把 `{connected:true,lastSeen:Date.now()}` 写 `hhhCompanionStatus`；断连/鉴权失败（1008）→ 写 disconnected → 3s 退避重连；token/端口变更经 `chrome.storage.onChanged` 重连。

**Step 3.4 background** `entrypoints/background.ts`：

- onMessage 链（在 `workbench/open-from-hover` 分支前）加 `external/screenshot`：validate 失败→`sendResponse({ok:false,error})`；成功→`chrome.tabs.query({active:true,currentWindow:true})` 取 tab → `router.openScreenshot({tabId, imageDataUrl, pageUrl:tab.url??"", pageTitle:tab.title??""})`（内部 `assertInjectable` 把关）→ resolve 后 sendResponse；无活 tab/不可注入 → `{ok:false, message:"当前页面不支持注入，请切到普通网页"}`；`return true`。
- 加 `companion/set-enabled`：保存 `hhhCompanion.enabled` → `enabled ? ensureOffscreen() : closeOffscreen()`。
- 加 `companion/get-status` → 读 `hhhCompanionStatus` sendResponse。
- background 侧单测较难，验证走 e2e + validate 单测（沿用项目既有测试哲学）。

**Step 3.5 权限**：

- `wxt.config.ts` `permissions` 加 `"offscreen"`（Chrome 文档：`chrome.offscreen` 需要该 manifest 权限；实现时二次核对）；
- `scripts/assert-manifest.mjs:10` 数组同步加 `"offscreen"`（否则 `npm run check` 必挂——这是硬编码断言）；
- 回环 host 权限走现有 optional：UI 侧先 `requestEndpointPermissions(["http://127.0.0.1:"+port])`（复用 `endpointOriginPattern` 与 permissions.ts 正则，已兼容带端口 origin）→ 再 `companion/set-enabled`。**permissions.ts 需加单测覆盖带端口 pattern**。

**Step 3.6 UI** `src/features/workbench/WorkbenchSettings.tsx` **behavior tab** 追加"截图伴侣"区块（复用 `inline-toggle-row` 模式，遵守"设置在悬浮窗内"治理）：

- 开关（先请求权限再 set-enabled，失败 notice 说明）；token 行：生成按钮（`crypto.randomUUID`）+只读 input+复制按钮；端口 number input（改动提示需重启伴侣与重开开关）；状态灯：`chrome.storage.onChanged` 订阅 `hhhCompanionStatus` 显示 已连接/未连接+lastSeen 相对时间；
- 新样式类加进 `src/styles/workbench.css`（只用 design-tokens 既有变量：暗玻璃、cyan accent）；内联区块非新组件 → 不强制登记 visual/functional registry（实现时按注册表规则复核）。

**Step 3.7 e2e** `tests/e2e/workbench.spec.ts` 加 2 用例：

- `delivers external companion screenshot into pending area`：SW evaluate 发 `external/screenshot`（TINY_PNG dataUrl，仿 `injectAndOpenScreenshot`）→ 断言待识别区出现该图；
- 负例：malformed dataUrl → `{ok:false}`。
- 真实 WS 链路不进 e2e（记为 D1 手动门禁）。

## 阶段 4：需求 1——companion 独立软件 `companion/`

**Step 4.0（最先做，防根检查误伤）**：根 `tsconfig.json` 加 `"exclude": ["companion"]`；`eslint.config.js` ignores 加 `companion/**`；根 `.gitignore` 的 `node_modules/` 通配已覆盖。否则 `npm run check` 的 lint/tsc 会扫 Electron 代码必挂。

**Step 4.1 骨架**（独立 package.json，不挂根脚本）：

```
companion/
  package.json        # name hhh-companion, private, electron + ws + electron-builder(可选)
  tsconfig.json
  src/shared/protocol.ts   # 与扩展 companion-protocol.ts 同构（注释互指）
  src/main/index.ts        # Electron 主进程：控制窗生命周期
  src/main/server.ts       # ws.Server 绑 127.0.0.1:39871；auth 帧 10s 超时校验，错则 1008 close；连接事件→控制窗状态
  src/main/config.ts       # %APPDATA%/hhh-companion/config.json {token, port}
  src/overlay/window.ts    # 全屏透明置顶覆盖层
  src/overlay/capture.ts   # 将各屏截图铺进 overlay（desktopCapturer 一次抓取），拖框后对铺图 nativeImage.crop → PNG buffer
  src/ui/control.html      # 控制窗：token 输入/保存、端口、连接状态、[开始框选]、说明、退出
  test/protocol.test.mjs   # node:test：auth/screenshot 帧构造校验、config 读写(tmpdir)
  README.md
```

**Step 4.2 v1 能力严格=勾选的"区域框选"**：控制窗点[开始框选]→隐藏控制窗→全屏 overlay（暗罩+参考图铺底）→拖拽矩形→松手裁剪→WS 推送→控制窗回显"已发送 N KB / 未连接原因"；Esc/右键取消。**全局热键、托盘、整屏一键、开机自启=二期**（用户未勾选，scope.md 同步此边界）。

**Step 4.3 协议与配对**：

- 扩展设置页生成 token → 复制 → companion 控制窗粘贴保存（写 config）；
- server 常驻监听，扩展侧 offscreen 主动连（3s 退避），谁先开都行；
- 端口占用 → 控制窗红字报错并提示改端口（两端同步改）；
- 只绑 127.0.0.1 + token 鉴权 + 扩展侧 15MB 校验，双端防线。

**Step 4.4 验证**：`cd companion && npm install && npx tsc --noEmit && npm test`；Electron 下载失败排错写进 README（镜像变量）。

**Step 4.5 `companion/README.md`**：安装/启动/配对/排错（端口占用、未连接、扩展开关、防火墙回环）/能力边界/二期路线。

**Step 4.6 根 `README.md`「开发」段**：加 companion 三行（简介、`cd companion && npm start`、链接 README）→ 触发 README 更新规则。

## 阶段 5：文档与 harness 收尾

1. **权限/架构四件**（CONTRIBUTING 同步矩阵强制项）：
   - `docs/CONFIGURATION.md`：权限表加 `offscreen` 与回环可选权限；新增"截图伴侣"章节（开关/token 配对/端口/状态/断连排查）；
   - `PRIVACY.md`：数据流加"伴侣截图仅经 127.0.0.1 回环+token 鉴权传输，不出网"；
   - `docs/ARCHITECTURE.md`：入口边界加 offscreen、核心模块加 companion、安全边界加回环+token；
   - `docs/systems/extension/README.md`：Ownership 加 companion；Interfaces 表加 `external/screenshot`、`companion/set-enabled/get-status`、WS 协议行（含验证方式）；Permissions 段；Failure Modes 加端口占用/token 不符/active tab 不可注入/offscreen 承载 SW 保活。
2. **需求文档**：`scope.md`（包含+伴侣与外部截图源、约束+回环与 companion Windows-only、不含=热键/托盘/整屏/跨平台）；`acceptance-criteria.md`（B1 触发范围加"伴侣推图入站"，新增 D1 手动门禁=伴侣真实链路冒烟由用户执行）。
3. **现状与证据**：`current-state.md` 全量刷新（部署表加 companion、验证表回填、风险加端口占用/真实链路未自动化/Electron 体积、Next 更新）；`daily/2026-09-23.md` 追加实现区块；新建 `validations/2026-09-23-requirements-iteration.md`（各门禁结果+D1 待办+附件引用）。INDEX 不新增文档族 → 不动。

## 阶段 6：全量验证与交付

1. `npx wxt prepare` → **`npm run harness:verify:project`** → **`npm run check`**（lint/tsc/全部单测/生产构建/assert-manifest 含 offscreen）→ **`npm run test:e2e`**（7 既有+2 新）。
2. e2e 会把 `.output` 冲成 E2E 构建 → **最后重跑 `npm run build` + `npm run check:manifest`**，确保手动加载的是生产产物。
3. companion 三验：`tsc --noEmit`、`node --test`、可选 electron-builder。
4. `git status --short` 报告变更文件清单。
5. 交付说明：用户手动加载 `.output/chrome-mv3` → 工作台设置·行为 tab 开启伴侣并生成 token → `cd companion && npm start` 粘贴 token → [开始框选] 拖一块 → 看悬浮窗待识别区出现该图；结果反馈后补记 validation log。

## 风险与回退

- e2e/单测隐性依赖旧默认值 → 跑测现修，只改期望不断言行为；
- WXT offscreen 构建输出名不符 → 回退 `public/` 静态 html，durable 选择记 `docs/decisions/0003`；
- WS 权限 pattern 必须带端口 → `endpointOriginPattern` 单测覆盖；
- Electron 网络下载失败 → README 镜像排错；仍失败则与用户确认后降级 PowerShell 单脚本方案；
- 真实伴侣链路无法自动验证 → D1 手动门禁 + validation log 明示"未覆盖"；
- 全程不加载扩展进用户 Chrome（由用户执行）、不动已安装版本、版本号保持 0.2.0（未发布）。
