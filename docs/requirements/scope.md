# 阶段范围（Scope）

> 当前阶段：`0.2.0` 公开测试（unpacked 手动安装），详细版本规则见 `docs/governance/release-version-policy.md`。

## 本阶段包含

- Manifest V3 Chrome 扩展：background / content / hover.content / options 四类入口。
- 图片、链接缩略图、可见页面截图三类输入的视觉模型分析。
- 可自定义的提示词模板（内置模板 + 导入/导出 + 旧格式迁移）。
- 多服务商、多模型配置，Endpoint 模式与图片传输策略可选，可选每日额度切换。
- 本地历史：IndexedDB（Dexie）保留 50 条成功记录，仅导出未导出结果到 TXT。
- 可选悬停按钮；默认不申请永久站点权限，按需申请 HTTP/HTTPS 可选宿主权限。
- 悬浮工作台（Shadow DOM）为主 UX 外壳，紧凑暗色玻璃风格。

## 本阶段约束

- 只支持桌面版 Google Chrome（其他 Chromium 浏览器不作为发布目标验证）。
- 不注入受保护页面：`chrome://`、Chrome 网上应用店、页面策略禁止注入的场景。
- 模型接口必须兼容 Chat Completions 且支持 `image_url` 视觉输入；不支持服务商原生专用协议。
- 安装渠道仅为“加载已解压的扩展程序”，无商店分发。
- E2E 构建临时加入 127.0.0.1 权限，生产构建不得包含该权限。

## 本阶段不含

见 `docs/requirements/product-goals.md` 的非目标列表，以及 README「当前限制」。

## 变更规则

扩大或收缩阶段范围时，先更新本文件与 `product-goals.md`，再调整 `acceptance-criteria.md` 中受影响的验收条件，并在 `docs/current-state.md` 记录当前阶段。
