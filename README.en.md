# Hhh Prompt Studio Next

A Chrome Manifest V3 extension that analyzes webpage images and visible-tab screenshots with your own OpenAI Chat Completions-compatible vision endpoint. Results appear in a movable in-page workbench.

[简体中文](README.md) · [Installation](docs/INSTALL.md) · [User guide](docs/USAGE.md) · [Use cases](docs/USE_CASES.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)

> Current version: `0.2.0` (public beta). Installation is currently available through Chrome's “Load unpacked” flow; the extension is not yet published in the Chrome Web Store.

## Highlights

- Analyze a webpage image from its context menu.
- Pick an image from the current page by clicking the extension icon.
- Capture and analyze the visible tab with `Ctrl+Shift+Y`.
- Generate reusable image prompts, webpage visual reviews, or JSON output.
- Manage custom prompt templates and share key-free team configurations.
- Configure multiple providers and models with optional daily usage limits.
- Keep the 50 most recent successful results locally and export pending results.
- Enable an optional hover action without granting permanent access to every site by default.

## Typical uses

AI image creators can reverse-engineer visual references; UI and frontend teams can review screenshot hierarchy and visual systems; marketing teams can break down ads and product imagery; model evaluators can compare multiple compatible vision models with the same source and prompt.

See [Use cases](docs/USE_CASES.md) for workflows, limitations, and cases where the extension is not appropriate.

## Quick start

Node.js 20+ and npm are required.

```bash
git clone https://github.com/Hhh2178/Browser-Image-Recognition-Floating-Plugin.git
cd Browser-Image-Recognition-Floating-Plugin
npm install
npm run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `.output/chrome-mv3`.

Open the extension settings and enter a Chat Completions-compatible Base URL, API key, and a model ID that supports image input. Save the configuration and run the connection test. The extension does not include an API key or model credits.

Right-click a regular webpage image, choose **Hhh: analyze image in floating window**, select a template and output format, then start the analysis.

## Privacy and security

API keys, settings, templates, and recent history stay in the browser's extension storage. During an analysis, the selected image and prompt are sent directly to the model endpoint you configured; this project does not operate a relay server. Exported team configurations exclude API keys.

Read [PRIVACY.md](PRIVACY.md) before use. Never post API keys, Authorization headers, or sensitive source images in an Issue.

## Compatibility

- Primary target: desktop Google Chrome with Manifest V3.
- Other Chromium browsers may work but are not release targets yet.
- Protected pages such as `chrome://` and the Chrome Web Store do not allow the floating workbench to be injected.
- The endpoint must accept OpenAI-style Chat Completions requests with `image_url` content blocks. “OpenAI-compatible” does not always mean vision-compatible.

## Documentation

- [Documentation center](docs/INDEX.md)
- [Installation and updates](docs/INSTALL.md)
- [User guide](docs/USAGE.md)
- [Provider configuration](docs/CONFIGURATION.md)
- [Use cases and scope](docs/USE_CASES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Development

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run check
npm run zip
```

## License

This project is available under the [MIT License](LICENSE).
