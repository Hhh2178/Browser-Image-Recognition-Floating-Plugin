# 配置说明

## 模型接口

插件使用 OpenAI Chat Completions 兼容协议。

- API 地址可以填写 Base URL，例如 https://api.example.com/v1。
- 也可以选择完整 Endpoint 并填写 chat/completions 地址。
- 模型名称必须与接口实际支持的视觉模型 ID 一致。
- API Key 只保存在本机 chrome.storage.local。

保存设置时，插件只申请对应 API Origin 的访问权限。

## 图片传输

- 自动：优先 Data URL，没有本地数据时使用源图片地址。
- Data URL：适合允许浏览器读取的图片和截图。
- 源地址：适合模型服务能够直接访问的公开图片。
- 仅文本：用于文本链路诊断。

## 团队配置

团队配置包含非敏感模型设置和自定义模板，不包含 API Key。导入后保留当前电脑上的 API Key。

## 权限

默认不申请 <all_urls>。启用悬停分析时，Chrome 会要求可选的网页访问权限；关闭功能后插件会撤销动态脚本和对应权限。
