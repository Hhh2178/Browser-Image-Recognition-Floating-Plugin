# 架构说明

## 入口边界

- background：右键菜单、工具栏、快捷键、截图、权限、模型请求和共享历史。
- content：Shadow DOM React 工作台，不持有 API Key。
- hover.content：只有启用可选权限后才注册。
- options：模型设置、权限、团队配置和提示词模板管理。

## 核心模块

- analysis：Endpoint、请求、解析、超时和诊断。
- media：图片验证、缩放、压缩和 Data URL。
- prompts：内置模板、自定义模板、变量和旧格式迁移。
- settings：schema、密钥分离、权限与持久化。
- history：扩展 Origin 下的 Dexie 数据库和 50 条保留策略。
- workbench：悬浮/停靠共享组件树和用户交互状态。

## 安全边界

API Key 只由 background 从扩展本地存储读取。诊断不包含 Authorization Header、API Key、完整 Data URL 或完整 Prompt。生产 Manifest 默认没有 host_permissions，只声明 HTTP/HTTPS 可选权限。

## 测试

核心模块使用 Vitest，React 组件使用 Testing Library，真实扩展流程使用 Playwright persistent Chromium context 和本地 Mock API。E2E 测试构建临时加入 127.0.0.1 权限，生产构建不会包含该权限。
