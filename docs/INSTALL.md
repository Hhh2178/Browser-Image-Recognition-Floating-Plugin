# 安装、更新与卸载

## 系统要求

- 桌面版 Google Chrome。
- 从源码构建时需要 Node.js 20 或更高版本及 npm。
- 一个支持图片输入的 OpenAI Chat Completions 兼容模型接口。

当前版本尚未发布到 Chrome 网上应用店，因此需要通过开发者模式加载。不要从未知来源下载带有预置 API Key 的第三方安装包。

## 从源码安装

```bash
git clone https://github.com/Hhh2178/Browser-Image-Recognition-Floating-Plugin.git
cd Browser-Image-Recognition-Floating-Plugin
npm install
npm run build
```

构建成功后：

1. 打开 `chrome://extensions`。
2. 启用右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择项目的 `.output/chrome-mv3` 目录。
5. 建议把扩展固定到工具栏，方便使用手动选图入口。

## 配置与验证

打开扩展详情或设置页，在“模型与接口”中填写 Base URL、API Key 和视觉模型标识，保存后点击“测试当前模型”。具体字段见[配置说明](CONFIGURATION.md)。

在普通网页中测试右键图片分析。安装前已打开的页面可能需要刷新后才能使用扩展脚本。

## 更新

```bash
git pull --ff-only
npm install
npm run build
```

然后回到 `chrome://extensions`，点击该扩展卡片上的刷新按钮，并刷新正在使用的网页。

只要扩展 ID 和浏览器资料未变化，重新构建和刷新通常会保留本地配置、模板和历史。更新前仍建议导出重要结果与团队配置。

## 开发模式

```bash
npm run dev
```

WXT 会生成开发构建。具体加载路径以终端输出为准。开发结束或准备交付时，运行 `npm run check` 验证生产构建。

## 打包

```bash
npm run zip
```

压缩包属于构建产物，不应代替源码、tag 和发布说明成为唯一来源。公开分发前还应确定许可证、版本、隐私披露和发布渠道。

## 卸载

卸载前导出需要保留的历史和团队配置。然后在 `chrome://extensions` 中点击“移除”。Chrome 通常会同时删除该扩展的本地存储和 IndexedDB，项目不提供云端恢复。

## 默认入口

- 图片右键菜单“Hhh：悬浮窗分析图片”。
- 工具栏图标：从当前页面选择图片。
- `Ctrl+Shift+Y`：分析当前可见标签页截图。
- 设置页“行为与权限”：可选启用网页图片悬停分析。

Chrome 内部页面、Chrome 网上应用店和其他禁止注入的页面无法打开悬浮工作台。
