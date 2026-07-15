# Image Analysis Browser Extension Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking, with a test-first change and verification before each commit.

**Goal:** Build a testable Manifest V3 browser extension for image and screenshot analysis with float/dock UI modes, prompt presets, OpenAI-compatible model configuration, local history, and least-privilege permissions.

**Architecture:** WXT owns extension entrypoints and packaging. React renders an isolated Shadow DOM workbench, while framework-free TypeScript modules own prompts, media preparation, requests, storage, diagnostics, and typed background messaging. Chrome-specific adapters sit at entrypoint boundaries so core behavior runs under Vitest.

**Tech Stack:** WXT 0.20.27, React 19, TypeScript, Zod 4, Dexie 4, Radix Dialog, Lucide React, Vitest 4, Testing Library, Playwright 1.61.

---

## File Map

- `package.json`: scripts and pinned dependency ranges.
- `wxt.config.ts`: Manifest V3 metadata, default permissions, commands, and React module.
- `vitest.config.ts`, `playwright.config.ts`: unit/component and extension E2E configuration.
- `entrypoints/background.ts`: context menus, commands, capture, permissions, request execution, and typed messages.
- `entrypoints/content/index.tsx`: on-demand Shadow DOM React mount.
- `entrypoints/hover.content.ts`: optional hover trigger registered only after permission is granted.
- `entrypoints/options/`: model, permission, import/export, and advanced settings UI.
- `src/contracts/`: shared Zod schemas and message/result types.
- `src/features/prompts/`: built-in and custom prompt library.
- `src/features/media/`: image validation, conversion, compression, and screenshot metadata.
- `src/features/analysis/`: endpoint normalization, request construction, response parsing, timeout, and diagnostics.
- `src/features/history/`: Dexie repository and 50-record retention policy.
- `src/features/settings/`: storage repository, secret separation, and import/export.
- `src/features/workbench/`: React state machine, shell, source, controls, result, history, and error UI.
- `src/styles/`: semantic tokens, workbench layout, themes, focus, and reduced-motion rules.
- `tests/fixtures/`: deterministic web page, images, and mock API.
- `tests/e2e/`: unpacked-extension user journeys.

### Task 1: Scaffold a Loadable WXT Extension

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `wxt.config.ts`
- Create: `vitest.config.ts`
- Create: `entrypoints/background.ts`
- Create: `entrypoints/content/index.tsx`
- Create: `entrypoints/content/style.css`
- Test: `src/smoke.test.ts`

- [x] **Step 1: Write the failing smoke test**

```ts
// src/smoke.test.ts
import { describe, expect, it } from "vitest";
import { APP_NAME } from "./app-meta";

describe("app metadata", () => {
  it("exposes the product name", () => {
    expect(APP_NAME).toBe("Hhh Prompt Studio Next");
  });
});
```

- [x] **Step 2: Create package and tool configuration**

```json
{
  "name": "hhh-prompt-studio-next",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "check": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.19",
    "dexie": "^4.4.4",
    "lucide-react": "^1.24.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.61.1",
    "@eslint/js": "^10.0.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/chrome": "^0.1.34",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@wxt-dev/module-react": "^1.2.2",
    "eslint": "^10.7.0",
    "fake-indexeddb": "^6.2.5",
    "jsdom": "^29.1.1",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.64.0",
    "vitest": "^4.1.10",
    "wxt": "^0.20.27"
  }
}
```

```ts
// wxt.config.ts
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Hhh Prompt Studio Next",
    description: "Analyze web images and screenshots with configurable vision models.",
    permissions: ["contextMenus", "storage", "activeTab", "scripting", "commands"],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    commands: {
      "analyze-screenshot": {
        suggested_key: { default: "Ctrl+Shift+Y" },
        description: "Analyze the visible page screenshot"
      }
    }
  }
});
```

- [x] **Step 3: Add strict compiler, lint, and test configuration**

```json
// tsconfig.json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

```ts
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".output/**", ".wxt/**", "coverage/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
);
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"]
  }
});
```

```ts
// src/test-setup.ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

- [x] **Step 4: Install dependencies and verify the test fails**

Run: `npm install`

Run: `npm test -- src/smoke.test.ts`

Expected: FAIL because `src/app-meta.ts` does not exist.

- [x] **Step 5: Add the minimum app and entrypoint code**

```ts
// src/app-meta.ts
export const APP_NAME = "Hhh Prompt Studio Next";
```

```ts
// entrypoints/background.ts
export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "analyze-image",
      title: "分析这张图片",
      contexts: ["image"]
    });
  });
});
```

```tsx
// entrypoints/content/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return <main className="workbench">Hhh Prompt Studio Next</main>;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  registration: "runtime",
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "hhh-workbench",
      position: "inline",
      anchor: "body",
      onMount(container) {
        const root = createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      }
    });
    ui.mount();
  }
});
```

```css
/* entrypoints/content/style.css */
:host {
  all: initial;
}

.workbench {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483647;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 16px;
  font: 14px/1.5 "Segoe UI", sans-serif;
}
```

- [x] **Step 6: Run baseline verification**

Run: `npm test -- src/smoke.test.ts`

Expected: PASS.

Run: `npm run lint && npm run typecheck && npm run build`

Expected: both commands exit 0 and `.output/chrome-mv3/` exists.

- [x] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json wxt.config.ts vitest.config.ts entrypoints src/smoke.test.ts src/app-meta.ts
git commit -m "chore: scaffold WXT extension"
```

### Task 2: Define Contracts and Least-Privilege Settings

**Files:**
- Create: `src/contracts/analysis.ts`
- Create: `src/contracts/messages.ts`
- Create: `src/features/settings/settings-schema.ts`
- Create: `src/features/settings/settings-repository.ts`
- Test: `src/features/settings/settings-schema.test.ts`

- [x] **Step 1: Write failing settings tests**

```ts
import { describe, expect, it } from "vitest";
import { exportSettings, settingsSchema } from "./settings-schema";

describe("settings", () => {
  it("rejects an invalid API URL", () => {
    expect(settingsSchema.safeParse({ apiUrl: "x", model: "gpt-4o" }).success).toBe(false);
  });

  it("never exports the API key", () => {
    const exported = exportSettings({
      apiUrl: "https://api.example.com/v1",
      apiKey: "secret",
      model: "gpt-4o",
      endpointMode: "base_url",
      imageTransport: "auto",
      hoverEnabled: false
    });
    expect(exported).not.toHaveProperty("apiKey");
  });
});
```

- [x] **Step 2: Run the tests and confirm RED**

Run: `npm test -- src/features/settings/settings-schema.test.ts`

Expected: FAIL because the settings module is missing.

- [x] **Step 3: Add shared schemas and repository**

```ts
// src/features/settings/settings-schema.ts
import { z } from "zod";

export const settingsSchema = z.object({
  apiUrl: z.url(),
  apiKey: z.string(),
  model: z.string().trim().min(1),
  endpointMode: z.enum(["base_url", "full_endpoint"]),
  imageTransport: z.enum(["auto", "data_url", "source_url", "text_only"]),
  hoverEnabled: z.boolean()
});

export type Settings = z.infer<typeof settingsSchema>;
export type ExportedSettings = Omit<Settings, "apiKey">;
export const exportSettings = ({ apiKey: _secret, ...safe }: Settings): ExportedSettings => safe;
```

```ts
// src/features/settings/settings-repository.ts
import type { Settings } from "./settings-schema";
import { settingsSchema } from "./settings-schema";

const KEY = "settings";

export async function loadSettings(): Promise<Settings | null> {
  const value = (await chrome.storage.local.get(KEY))[KEY];
  return value ? settingsSchema.parse(value) : null;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: settingsSchema.parse(settings) });
}
```

```ts
// src/contracts/analysis.ts
export type OutputFormat = "zh" | "en" | "json";
export type SourceType = "image" | "screenshot";

export interface AnalysisRequest {
  sourceType: SourceType;
  imageDataUrl: string;
  prompt: string;
  outputFormat: OutputFormat;
  model: string;
}
```

- [x] **Step 4: Run GREEN verification**

Run: `npm test -- src/features/settings/settings-schema.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit 0.

- [x] **Step 5: Commit**

```bash
git add src/contracts src/features/settings
git commit -m "feat: add typed settings and message contracts"
```

### Task 3: Build the Prompt Library

**Files:**
- Create: `src/features/prompts/prompt-schema.ts`
- Create: `src/features/prompts/builtins.ts`
- Create: `src/features/prompts/prompt-repository.ts`
- Create: `src/features/prompts/prompt-import.ts`
- Test: `src/features/prompts/prompt-library.test.ts`

- [x] **Step 1: Write failing schema, rendering, and legacy import tests**

```ts
import { describe, expect, it } from "vitest";
import { renderPrompt } from "./prompt-schema";
import { importPromptBundle } from "./prompt-import";

describe("prompt library", () => {
  it("renders supported variables", () => {
    expect(renderPrompt("Return {{outputFormat}} for {{sourceType}}", {
      outputFormat: "json",
      sourceType: "image",
      pageTitle: "Reference"
    })).toBe("Return json for image");
  });

  it("rejects unknown variables", () => {
    expect(() => renderPrompt("{{unknown}}", {
      outputFormat: "zh",
      sourceType: "image",
      pageTitle: ""
    })).toThrow("Unknown template variable: unknown");
  });

  it("imports the old preset shape", () => {
    const result = importPromptBundle(JSON.stringify([{ id: "old", name: "Old", prompt: "Analyze" }]));
    expect(result.imported[0]).toMatchObject({ id: "old", name: "Old", content: "Analyze" });
  });
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/prompts/prompt-library.test.ts`

Expected: FAIL because prompt modules do not exist.

- [x] **Step 3: Add the schema and strict variable renderer**

```ts
// src/features/prompts/prompt-schema.ts
import { z } from "zod";

export const promptSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  taskType: z.enum(["image_analysis", "screenshot_analysis"]),
  description: z.string(),
  tags: z.array(z.string()),
  content: z.string().trim().min(1),
  supportedFormats: z.array(z.enum(["zh", "en", "json"])).min(1),
  source: z.enum(["builtin", "custom"]),
  schemaVersion: z.literal(1),
  createdAt: z.number(),
  updatedAt: z.number()
});

const allowed = new Set(["outputFormat", "sourceType", "pageTitle"]);
export type PromptVariables = Record<"outputFormat" | "sourceType" | "pageTitle", string>;

export function renderPrompt(content: string, variables: PromptVariables): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (!allowed.has(key)) throw new Error(`Unknown template variable: ${key}`);
    return variables[key as keyof PromptVariables];
  });
}
```

- [x] **Step 4: Add legacy import and storage behavior**

```ts
// src/features/prompts/prompt-import.ts
import { promptSchema } from "./prompt-schema";

export function importPromptBundle(raw: string) {
  const parsed: unknown = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : [];
  const now = Date.now();
  const imported = rows.map((row: any) => promptSchema.parse({
    id: String(row.id),
    name: String(row.name),
    taskType: row.taskType ?? "image_analysis",
    description: row.description ?? "",
    tags: row.tags ?? [],
    content: row.content ?? row.prompt,
    supportedFormats: row.supportedFormats ?? ["zh", "en", "json"],
    source: "custom",
    schemaVersion: 1,
    createdAt: row.createdAt ?? now,
    updatedAt: now
  }));
  return { imported, errors: [] as Array<{ index: number; message: string }> };
}
```

```ts
// src/features/prompts/prompt-repository.ts
import { promptSchema, type PromptVariables } from "./prompt-schema";
import { BUILTIN_PROMPTS } from "./builtins";

const KEY = "customPrompts";
type Prompt = ReturnType<typeof promptSchema.parse>;

export async function listPrompts(): Promise<Prompt[]> {
  const stored = (await chrome.storage.local.get(KEY))[KEY] ?? [];
  return [...BUILTIN_PROMPTS, ...promptSchema.array().parse(stored)];
}

export async function savePrompt(prompt: Prompt): Promise<void> {
  const parsed = promptSchema.parse(prompt);
  if (parsed.source !== "custom") throw new Error("Builtin prompts are read-only");
  const custom = (await listPrompts()).filter((item) => item.source === "custom" && item.id !== parsed.id);
  await chrome.storage.local.set({ [KEY]: [...custom, parsed] });
}

export function duplicatePrompt(prompt: Prompt): Prompt {
  const now = Date.now();
  return {
    ...prompt,
    id: crypto.randomUUID(),
    name: `${prompt.name} 副本`,
    source: "custom",
    createdAt: now,
    updatedAt: now
  };
}
```

- [x] **Step 5: Run GREEN and commit**

Run: `npm test -- src/features/prompts/prompt-library.test.ts && npm run typecheck`

Expected: PASS and exit 0.

```bash
git add src/features/prompts
git commit -m "feat: add validated prompt preset library"
```

### Task 4: Add Media Validation and Preparation

**Files:**
- Create: `src/features/media/media-schema.ts`
- Create: `src/features/media/prepare-image.ts`
- Create: `src/features/media/canvas-adapter.ts`
- Test: `src/features/media/prepare-image.test.ts`

- [x] **Step 1: Write failing media tests**

```ts
import { describe, expect, it } from "vitest";
import { validateMedia } from "./media-schema";

describe("media validation", () => {
  it("accepts supported image input", () => {
    expect(validateMedia({ mimeType: "image/png", width: 1200, height: 800, bytes: 400_000 }).ok).toBe(true);
  });

  it("rejects oversized decoded dimensions", () => {
    expect(validateMedia({ mimeType: "image/png", width: 12000, height: 8000, bytes: 2_000_000 })).toMatchObject({
      ok: false,
      code: "IMAGE_DIMENSIONS_TOO_LARGE"
    });
  });
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/media/prepare-image.test.ts`

Expected: FAIL because `validateMedia` is missing.

- [x] **Step 3: Implement deterministic validation**

```ts
// src/features/media/media-schema.ts
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateMedia(input: { mimeType: string; width: number; height: number; bytes: number }) {
  if (!MIME_TYPES.has(input.mimeType)) return { ok: false as const, code: "UNSUPPORTED_IMAGE_TYPE" };
  if (input.width * input.height > 40_000_000) return { ok: false as const, code: "IMAGE_DIMENSIONS_TOO_LARGE" };
  if (input.bytes > 20_000_000) return { ok: false as const, code: "IMAGE_FILE_TOO_LARGE" };
  return { ok: true as const };
}
```

```ts
// src/features/media/canvas-adapter.ts
export interface CanvasAdapter {
  decode(input: Blob): Promise<{ width: number; height: number; source: CanvasImageSource }>;
  encode(source: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob>;
}
```

```ts
// src/features/media/prepare-image.ts
import type { CanvasAdapter } from "./canvas-adapter";
import { validateMedia } from "./media-schema";

const MAX_EDGE = 2048;
const MAX_BYTES = 4_000_000;

export async function prepareImage(input: Blob, adapter: CanvasAdapter) {
  const decoded = await adapter.decode(input);
  const validation = validateMedia({
    mimeType: input.type,
    width: decoded.width,
    height: decoded.height,
    bytes: input.size
  });
  if (!validation.ok) throw Object.assign(new Error(validation.code), { code: validation.code });

  const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
  const width = Math.round(decoded.width * scale);
  const height = Math.round(decoded.height * scale);
  for (const quality of [0.9, 0.8, 0.7, 0.6]) {
    const blob = await adapter.encode(decoded.source, width, height, quality);
    if (blob.size <= MAX_BYTES) return { blob, width, height, quality };
  }
  throw Object.assign(new Error("Prepared image exceeds 4 MB"), { code: "IMAGE_ENCODE_TOO_LARGE" });
}
```

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/media/prepare-image.test.ts && npm run typecheck`

Expected: PASS.

```bash
git add src/features/media
git commit -m "feat: validate and prepare image inputs"
```

### Task 5: Implement OpenAI-Compatible Requests and Diagnostics

**Files:**
- Create: `src/features/analysis/endpoint.ts`
- Create: `src/features/analysis/build-request.ts`
- Create: `src/features/analysis/parse-response.ts`
- Create: `src/features/analysis/diagnostics.ts`
- Create: `src/features/analysis/execute-request.ts`
- Test: `src/features/analysis/analysis-core.test.ts`

- [x] **Step 1: Write failing request and redaction tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeEndpoint } from "./endpoint";
import { redactDiagnostic } from "./diagnostics";

describe("analysis core", () => {
  it("normalizes a base URL", () => {
    expect(normalizeEndpoint("https://api.example.com/v1/", "base_url"))
      .toBe("https://api.example.com/v1/chat/completions");
  });

  it("redacts secrets and data URLs", () => {
    const value = redactDiagnostic({
      authorization: "Bearer secret",
      image: "data:image/png;base64,abc",
      model: "gpt-4o"
    });
    expect(value).toEqual({ authorization: "[REDACTED]", image: "[IMAGE_DATA]", model: "gpt-4o" });
  });
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/analysis/analysis-core.test.ts`

Expected: FAIL because analysis modules do not exist.

- [x] **Step 3: Implement endpoint and response contracts**

```ts
// src/features/analysis/endpoint.ts
export function normalizeEndpoint(url: string, mode: "base_url" | "full_endpoint"): string {
  const clean = url.replace(/\/+$/, "");
  if (mode === "full_endpoint") return clean;
  if (/\/v1$/i.test(clean)) return `${clean}/chat/completions`;
  return `${clean}/v1/chat/completions`;
}
```

```ts
// src/features/analysis/parse-response.ts
export function parseResponse(data: unknown): string {
  const content = (data as any)?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  throw Object.assign(new Error("Model returned no usable content"), { code: "EMPTY_RESPONSE" });
}
```

```ts
// src/features/analysis/execute-request.ts
import { parseResponse } from "./parse-response";

export async function executeRequest(
  input: { endpoint: string; apiKey: string; model: string; prompt: string; imageUrl: string },
  options: { timeoutMs: number; fetchImpl?: typeof fetch }
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), options.timeoutMs);
  try {
    const response = await (options.fetchImpl ?? fetch)(input.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: input.prompt },
            { type: "image_url", image_url: { url: input.imageUrl } }
          ]
        }],
        stream: false
      })
    });
    const text = await response.text();
    if (!response.ok) {
      throw Object.assign(new Error(`HTTP ${response.status}`), {
        code: "HTTP_ERROR",
        status: response.status
      });
    }
    try {
      return parseResponse(JSON.parse(text));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw Object.assign(new Error("Response was not JSON"), { code: "INVALID_JSON" });
      }
      throw error;
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error("Request timed out"), { code: "TIMEOUT", retryable: true });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
```

```ts
// src/features/analysis/diagnostics.ts
export function redactDiagnostic(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/authorization|api.?key/i.test(key)) return [key, "[REDACTED]"];
    if (typeof item === "string" && item.startsWith("data:image/")) return [key, "[IMAGE_DATA]"];
    return [key, item];
  }));
}
```

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/analysis/analysis-core.test.ts && npm run typecheck`

Expected: PASS.

```bash
git add src/features/analysis
git commit -m "feat: add OpenAI-compatible analysis core"
```

### Task 6: Connect Background Messaging and Browser Entry Actions

**Files:**
- Modify: `entrypoints/background.ts`
- Create: `src/contracts/messages.ts`
- Create: `src/adapters/chrome/inject-workbench.ts`
- Test: `src/adapters/chrome/inject-workbench.test.ts`

- [x] **Step 1: Write a failing message routing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createMessageRouter } from "./inject-workbench";

it("opens the workbench with normalized image context", async () => {
  const send = vi.fn();
  const router = createMessageRouter({ send });
  await router.openImage({ tabId: 7, srcUrl: "https://site.test/photo.jpg", pageUrl: "https://site.test/" });
  expect(send).toHaveBeenCalledWith(7, {
    type: "workbench/open",
    payload: { sourceType: "image", sourceUrl: "https://site.test/photo.jpg", pageUrl: "https://site.test/" }
  });
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/adapters/chrome/inject-workbench.test.ts`

Expected: FAIL because router is missing.

- [x] **Step 3: Add typed runtime messages and listeners**

```ts
// src/contracts/messages.ts
export type RuntimeMessage =
  | { type: "workbench/open"; payload: { sourceType: "image"; sourceUrl: string; pageUrl: string } }
  | { type: "workbench/open-screenshot"; payload: { dataUrl: string; pageUrl: string } }
  | { type: "analysis/run"; payload: import("./analysis").AnalysisRequest }
  | { type: "analysis/cancel"; payload: { requestId: string } };
```

```ts
// src/adapters/chrome/inject-workbench.ts
export function createMessageRouter(deps: {
  send: (tabId: number, message: unknown) => Promise<unknown> | void;
}) {
  return {
    async openImage(input: { tabId: number; srcUrl: string; pageUrl: string }) {
      if (/^(chrome|edge|about):/i.test(input.pageUrl)) {
        throw Object.assign(new Error("This page cannot host the workbench"), { code: "PAGE_NOT_INJECTABLE" });
      }
      await deps.send(input.tabId, {
        type: "workbench/open",
        payload: { sourceType: "image", sourceUrl: input.srcUrl, pageUrl: input.pageUrl }
      });
    }
  };
}
```

```ts
// entrypoints/background.ts
import { createMessageRouter } from "@/src/adapters/chrome/inject-workbench";

export default defineBackground(() => {
  const router = createMessageRouter({
    send: (tabId, message) => chrome.tabs.sendMessage(tabId, message)
  });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({ id: "analyze-image", title: "分析这张图片", contexts: ["image"] });
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyze-image" && tab?.id && info.srcUrl) {
      void router.openImage({ tabId: tab.id, srcUrl: info.srcUrl, pageUrl: tab.url ?? "" });
    }
  });
});
```

- [x] **Step 4: Run GREEN, build, and commit**

Run: `npm test -- src/adapters/chrome/inject-workbench.test.ts && npm run build`

Expected: PASS and build exit 0.

```bash
git add entrypoints/background.ts src/contracts/messages.ts src/adapters/chrome
git commit -m "feat: connect browser actions to typed workbench messages"
```

### Task 7: Build the Float and Dock Workbench State Machine

**Files:**
- Create: `src/features/workbench/workbench-machine.ts`
- Create: `src/features/workbench/Workbench.tsx`
- Create: `src/features/workbench/WorkbenchHeader.tsx`
- Create: `src/features/workbench/SourceSummary.tsx`
- Create: `src/features/workbench/AnalysisControls.tsx`
- Create: `src/features/workbench/ResultPanel.tsx`
- Modify: `entrypoints/content/index.tsx`
- Test: `src/features/workbench/Workbench.test.tsx`

- [x] **Step 1: Write failing state persistence tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";

it("keeps the result when switching from float to dock", async () => {
  render(<Workbench initialResult="analysis result" saveLayout={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "停靠到右侧" }));
  expect(screen.getByText("analysis result")).toBeVisible();
  expect(screen.getByTestId("workbench-shell")).toHaveAttribute("data-mode", "dock");
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/workbench/Workbench.test.tsx`

Expected: FAIL because workbench components are missing.

- [x] **Step 3: Implement one component tree with a layout reducer**

```ts
// src/features/workbench/workbench-machine.ts
export type LayoutMode = "float" | "dock";
export type WorkbenchState = {
  mode: LayoutMode;
  minimized: boolean;
  status: "idle" | "running" | "success" | "error";
  resultByFormat: Partial<Record<"zh" | "en" | "json", string>>;
};

export type WorkbenchAction =
  | { type: "layout/set"; mode: LayoutMode }
  | { type: "result/set"; format: "zh" | "en" | "json"; value: string }
  | { type: "status/set"; status: WorkbenchState["status"] };

export function reducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  if (action.type === "layout/set") return { ...state, mode: action.mode };
  if (action.type === "result/set") {
    return { ...state, resultByFormat: { ...state.resultByFormat, [action.format]: action.value } };
  }
  return { ...state, status: action.status };
}
```

```tsx
// src/features/workbench/Workbench.tsx
import { useReducer } from "react";
import { reducer, type WorkbenchState } from "./workbench-machine";

const baseState: WorkbenchState = {
  mode: "float",
  minimized: false,
  status: "idle",
  resultByFormat: {}
};

export function Workbench({ initialResult, saveLayout }: {
  initialResult: string;
  saveLayout: (mode: "float" | "dock") => void;
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...baseState,
    resultByFormat: initialResult ? { zh: initialResult } : {}
  });
  const dock = () => {
    dispatch({ type: "layout/set", mode: "dock" });
    saveLayout("dock");
  };
  return (
    <main className="workbench-shell" data-testid="workbench-shell" data-mode={state.mode}>
      <header>
        <strong>视觉分析</strong>
        <button aria-label="停靠到右侧" title="停靠到右侧" onClick={dock}>停靠</button>
      </header>
      <div role="status">{state.status === "idle" ? "已就绪" : state.status}</div>
      <section aria-label="分析结果">{state.resultByFormat.zh ?? "选择素材后开始分析"}</section>
    </main>
  );
}
```

The shell applies `data-mode="float|dock"`; no child component branches on layout mode. Drag and resize update CSS custom properties and call `saveLayout` only on pointer release.

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/workbench/Workbench.test.tsx && npm run typecheck`

Expected: PASS.

```bash
git add entrypoints/content src/features/workbench
git commit -m "feat: add shared float and dock workbench"
```

### Task 8: Add Prompt Manager and Model Options UI

**Files:**
- Create: `src/features/prompts/PromptManager.tsx`
- Create: `src/features/prompts/PromptEditor.tsx`
- Create: `entrypoints/options/App.tsx`
- Create: `entrypoints/options/main.tsx`
- Create: `entrypoints/options/style.css`
- Test: `src/features/prompts/PromptManager.test.tsx`
- Test: `entrypoints/options/App.test.tsx`

- [x] **Step 1: Write failing prompt CRUD and secret export tests**

```tsx
it("duplicates a builtin before editing", async () => {
  render(<PromptManager prompts={[builtin]} repository={repository} />);
  fireEvent.click(screen.getByRole("button", { name: "复制模板" }));
  expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ source: "custom" }));
});

it("exports settings without API key", async () => {
  render(<OptionsApp initialSettings={settingsWithSecret} />);
  fireEvent.click(screen.getByRole("button", { name: "导出团队配置" }));
  expect(await screen.findByText("导出完成，密钥未包含")).toBeVisible();
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/prompts/PromptManager.test.tsx entrypoints/options/App.test.tsx`

Expected: FAIL because UI modules are missing.

- [x] **Step 3: Implement validated forms**

```tsx
// src/features/prompts/PromptEditor.tsx
import { useState } from "react";
import { promptSchema } from "./prompt-schema";

export function PromptEditor({ prompt, onSave }: {
  prompt: ReturnType<typeof promptSchema.parse>;
  onSave: (value: ReturnType<typeof promptSchema.parse>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(prompt);
  const [error, setError] = useState("");
  const save = async () => {
    const parsed = promptSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "模板无效");
      return;
    }
    setError("");
    await onSave(parsed.data);
  };
  return (
    <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label>名称<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>模板内容<textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit">保存模板</button>
    </form>
  );
}
```

```tsx
// entrypoints/options/App.tsx
import { useState } from "react";
import { exportSettings, type Settings } from "@/src/features/settings/settings-schema";

export function OptionsApp({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [notice, setNotice] = useState("");
  const download = () => {
    const blob = new Blob([JSON.stringify(exportSettings(settings), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hhh-team-settings.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("导出完成，密钥未包含");
  };
  return (
    <main>
      <h1>插件设置</h1>
      <label>API 地址<input value={settings.apiUrl} onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })} /></label>
      <label>API Key<input type="password" value={settings.apiKey} onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} /></label>
      <button onClick={download}>导出团队配置</button>
      <p role="status">{notice}</p>
    </main>
  );
}
```

```tsx
// src/features/prompts/PromptManager.tsx
import { useState } from "react";
import { duplicatePrompt } from "./prompt-repository";
import { PromptEditor } from "./PromptEditor";
import { promptSchema } from "./prompt-schema";

type Prompt = ReturnType<typeof promptSchema.parse>;

export function PromptManager({ prompts, repository }: {
  prompts: Prompt[];
  repository: { save: (prompt: Prompt) => Promise<void>; remove: (id: string) => Promise<void> };
}) {
  const [selected, setSelected] = useState(prompts[0] ?? null);
  if (!selected) return <p>还没有模板</p>;
  const duplicate = async () => {
    const copy = duplicatePrompt(selected);
    await repository.save(copy);
    setSelected(copy);
  };
  return (
    <section>
      <nav aria-label="提示词模板">
        {prompts.map((prompt) => (
          <button key={prompt.id} onClick={() => setSelected(prompt)}>{prompt.name}</button>
        ))}
      </nav>
      <button onClick={() => void duplicate()}>复制模板</button>
      {selected.source === "custom" ? (
        <>
          <PromptEditor prompt={selected} onSave={repository.save} />
          <button onClick={() => void repository.remove(selected.id)}>删除模板</button>
        </>
      ) : <p>内置模板只读，复制后可编辑。</p>}
    </section>
  );
}
```

```tsx
// Append to src/features/prompts/PromptManager.tsx
export function PromptImportResult({ imported, errors, collision, onOverwrite, onSaveCopy }: {
  imported: Prompt[];
  errors: Array<{ index: number; message: string }>;
  collision: Prompt | null;
  onOverwrite: (prompt: Prompt) => void;
  onSaveCopy: (prompt: Prompt) => void;
}) {
  return (
    <section data-testid="prompt-import-result">
      <p>成功导入 {imported.length} 条</p>
      {errors.map((error) => <p role="alert" key={error.index}>第 {error.index + 1} 条：{error.message}</p>)}
      {collision ? (
        <div>
          <button onClick={() => onOverwrite(collision)}>覆盖</button>
          <button onClick={() => onSaveCopy({ ...collision, id: crypto.randomUUID() })}>另存为副本</button>
        </div>
      ) : null}
    </section>
  );
}
```

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/prompts/PromptManager.test.tsx entrypoints/options/App.test.tsx && npm run build`

Expected: PASS and build exit 0.

```bash
git add entrypoints/options src/features/prompts
git commit -m "feat: add prompt manager and model settings"
```

### Task 9: Add Local History with Retention

**Files:**
- Create: `src/features/history/history-db.ts`
- Create: `src/features/history/history-repository.ts`
- Create: `src/features/history/HistoryDrawer.tsx`
- Test: `src/features/history/history-repository.test.ts`
- Test: `src/features/history/HistoryDrawer.test.tsx`

- [x] **Step 1: Write failing retention and restore tests**

```ts
it("keeps only the newest 50 successful records", async () => {
  for (let index = 0; index < 51; index += 1) {
    await repository.add(makeRecord({ id: String(index), createdAt: index }));
  }
  expect((await repository.list()).map((item) => item.id)).not.toContain("0");
  expect(await repository.count()).toBe(50);
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/history`

Expected: FAIL because history modules are missing.

- [x] **Step 3: Implement Dexie storage and drawer**

```ts
// src/features/history/history-db.ts
import Dexie, { type EntityTable } from "dexie";

export interface HistoryRecord {
  id: string;
  createdAt: number;
  sourceType: "image" | "screenshot";
  thumbnail: string;
  templateId: string;
  model: string;
  outputFormat: "zh" | "en" | "json";
  result: string;
}

export const db = new Dexie("hhh-prompt-studio") as Dexie & {
  history: EntityTable<HistoryRecord, "id">;
};
db.version(1).stores({ history: "id, createdAt, templateId, model, outputFormat" });
```

```ts
// src/features/history/history-repository.ts
import { db, type HistoryRecord } from "./history-db";

export const historyRepository = {
  async add(record: HistoryRecord): Promise<void> {
    await db.transaction("rw", db.history, async () => {
      await db.history.put(record);
      const overflow = Math.max(0, (await db.history.count()) - 50);
      if (overflow > 0) {
        const oldest = await db.history.orderBy("createdAt").limit(overflow).primaryKeys();
        await db.history.bulkDelete(oldest);
      }
    });
  },
  list(): Promise<HistoryRecord[]> {
    return db.history.orderBy("createdAt").reverse().toArray();
  },
  count(): Promise<number> {
    return db.history.count();
  },
  remove(id: string): Promise<void> {
    return db.history.delete(id);
  },
  clear(): Promise<void> {
    return db.history.clear();
  }
};
```

```tsx
// src/features/history/HistoryDrawer.tsx
import { useMemo, useState } from "react";
import type { HistoryRecord } from "./history-db";

export function HistoryDrawer({ records, onRestore, onDelete }: {
  records: HistoryRecord[];
  onRestore: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => records.filter((record) =>
    `${record.result} ${record.model}`.toLowerCase().includes(query.toLowerCase())
  ), [records, query]);
  return (
    <aside aria-label="分析历史">
      <label>搜索历史<input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      {filtered.map((record) => (
        <article key={record.id}>
          <button onClick={() => onRestore(record)}>{record.result.slice(0, 60)}</button>
          <button aria-label="删除历史记录" onClick={() => onDelete(record.id)}>删除</button>
        </article>
      ))}
    </aside>
  );
}
```

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/history && npm run typecheck`

Expected: PASS.

```bash
git add src/features/history
git commit -m "feat: add capped local analysis history"
```

### Task 10: Implement Optional Hover and Endpoint Permissions

**Files:**
- Create: `entrypoints/hover.content.ts`
- Create: `src/features/settings/permissions.ts`
- Modify: `entrypoints/options/App.tsx`
- Test: `src/features/settings/permissions.test.ts`

- [x] **Step 1: Write failing permission tests**

```ts
it("requests only the configured API origin", async () => {
  const request = vi.fn().mockResolvedValue(true);
  await requestEndpointPermission("https://api.example.com/v1/chat/completions", request);
  expect(request).toHaveBeenCalledWith({ origins: ["https://api.example.com/*"] });
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/settings/permissions.test.ts`

Expected: FAIL because permission helpers are missing.

- [x] **Step 3: Implement explicit permission helpers**

```ts
export function endpointOriginPattern(value: string): string {
  const url = new URL(value);
  return `${url.protocol}//${url.host}/*`;
}

export async function requestEndpointPermission(
  value: string,
  request = chrome.permissions.request
): Promise<boolean> {
  return request({ origins: [endpointOriginPattern(value)] });
}
```

Enable hover by requesting `http://*/*` and `https://*/*`, registering `hover.content.ts`, and setting `hoverEnabled` only after permission succeeds. Disable hover by unregistering the script and removing optional host permissions.

```ts
// src/features/settings/permissions.ts
const HOVER_ORIGINS = ["http://*/*", "https://*/*"];

export async function setHoverPermission(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const granted = await chrome.permissions.request({ origins: HOVER_ORIGINS });
    if (!granted) return false;
    await chrome.scripting.registerContentScripts([{
      id: "hhh-hover",
      js: ["/content-scripts/hover.js"],
      matches: HOVER_ORIGINS,
      runAt: "document_idle"
    }]);
    return true;
  }
  await chrome.scripting.unregisterContentScripts({ ids: ["hhh-hover"] }).catch(() => undefined);
  await chrome.permissions.remove({ origins: HOVER_ORIGINS });
  return false;
}
```

- [x] **Step 4: Run GREEN and commit**

Run: `npm test -- src/features/settings/permissions.test.ts && npm run build`

Expected: PASS and build exit 0.

```bash
git add entrypoints/hover.content.ts entrypoints/options/App.tsx src/features/settings
git commit -m "feat: add optional hover and endpoint permissions"
```

### Task 11: Apply the Visual System and Accessibility States

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/workbench.css`
- Create: `src/styles/options.css`
- Modify: workbench and options components for labels, tooltips, and focus order
- Test: `src/features/workbench/accessibility.test.tsx`

- [x] **Step 1: Write failing accessibility tests**

```tsx
it("names icon-only controls and exposes status", () => {
  render(<Workbench initialResult="" saveLayout={vi.fn()} />);
  expect(screen.getByRole("button", { name: "停靠到右侧" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("已就绪");
});
```

- [x] **Step 2: Run RED**

Run: `npm test -- src/features/workbench/accessibility.test.tsx`

Expected: FAIL until labels and live status exist.

- [x] **Step 3: Add semantic tokens and stable dimensions**

```css
:host {
  --surface: #ffffff;
  --surface-subtle: #f6f8fa;
  --text: #172033;
  --text-muted: #5f6b7a;
  --border: #cbd5e1;
  --accent: #2563eb;
  --danger: #c62828;
  --radius-sm: 4px;
  --radius-md: 8px;
  color: var(--text);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  letter-spacing: 0;
}

:host([data-theme="dark"]) {
  --surface: #171a20;
  --surface-subtle: #20242c;
  --text: #f3f5f7;
  --text-muted: #aeb7c3;
  --border: #46505e;
  --accent: #6ea8fe;
  --danger: #ff7b7b;
}

.workbench-shell {
  width: min(440px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

Use Lucide icons for history, dock, minimize, close, settings, copy, retry, delete, and search. Every icon-only button gets `aria-label` and a tooltip. Loading uses `role="status"`; errors use `role="alert"`.

- [x] **Step 4: Run component and visual checks**

Run: `npm test -- src/features/workbench && npm run typecheck`

Expected: PASS.

Manually inspect at 1366 × 768, 1920 × 1080, and a 760-pixel-wide browser window before commit.

- [x] **Step 5: Commit**

```bash
git add src/styles src/features/workbench entrypoints/options
git commit -m "feat: apply accessible workbench visual system"
```

### Task 12: Add Extension E2E Fixtures and Critical Journeys

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/fixtures/index.html`
- Create: `tests/fixtures/mock-api.mjs`
- Create: `tests/e2e/extension.fixture.ts`
- Create: `tests/e2e/image-analysis.spec.ts`
- Create: `tests/e2e/screenshot-analysis.spec.ts`

- [x] **Step 1: Write the failing image journey**

```ts
test("analyzes a page image and restores it from history", async ({ page, extensionId }) => {
  await page.goto(fixtureUrl);
  await openImageWorkbench(page, "#reference-image");
  await expect(page.getByText("当前网页图片")).toBeVisible();
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByText("fixture analysis result")).toBeVisible();
  await page.getByRole("button", { name: "历史" }).click();
  await expect(page.getByText("fixture analysis result")).toBeVisible();
});
```

- [x] **Step 2: Run RED**

Run: `npm run build && npm run test:e2e -- tests/e2e/image-analysis.spec.ts`

Expected: FAIL until fixture helpers and the complete message path work.

- [x] **Step 3: Implement deterministic extension fixtures**

Launch Chromium persistent context with:

```ts
const context = await chromium.launchPersistentContext(profileDir, {
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ]
});
```

```ts
// tests/e2e/extension.fixture.ts
import { chromium, test as base } from "@playwright/test";
import path from "node:path";

export const test = base.extend<{ extensionId: string }>({
  context: async ({}, use) => {
    const extensionPath = path.resolve(".output/chrome-mv3");
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent("serviceworker");
    await use(new URL(worker.url()).host);
  }
});
export { expect } from "@playwright/test";
```

```js
// tests/fixtures/mock-api.mjs
import http from "node:http";

http.createServer((request, response) => {
  if (request.method !== "POST") {
    response.writeHead(404).end();
    return;
  }
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    const payload = JSON.parse(body);
    if (!payload.model || !Array.isArray(payload.messages)) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: { message: "invalid fixture request" } }));
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ choices: [{ message: { content: "fixture analysis result" } }] }));
  });
}).listen(43119, "127.0.0.1");
```

```html
<!-- tests/fixtures/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8"><title>Extension Fixture</title></head>
  <body>
    <h1>Extension Fixture</h1>
    <img id="reference-image" src="/reference.png" width="640" height="480" alt="Reference fixture">
  </body>
</html>
```

```ts
// tests/e2e/helpers.ts
import type { Page, Worker } from "@playwright/test";

export async function injectAndOpenImage(page: Page, worker: Worker, sourceUrl: string) {
  const pageUrl = page.url();
  await worker.evaluate(async ({ pageUrl, sourceUrl }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) throw new Error("Fixture tab not found");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/content.js"]
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "workbench/open",
      payload: { sourceType: "image", sourceUrl, pageUrl }
    });
  }, { pageUrl, sourceUrl });
}
```

```ts
// tests/e2e/image-analysis.spec.ts
import { test, expect } from "./extension.fixture";
import { injectAndOpenImage } from "./helpers";

test("preserves a completed result while docking", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:43118/");
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  await injectAndOpenImage(page, worker, "http://127.0.0.1:43118/reference.png");
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByText("fixture analysis result")).toBeVisible();
  await page.getByRole("button", { name: "停靠到右侧" }).click();
  await expect(page.getByText("fixture analysis result")).toBeVisible();
});

test("shows timeout diagnosis without leaking a key", async ({ page }) => {
  await page.goto("http://127.0.0.1:43118/?fixture=timeout");
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByRole("alert")).toContainText("超时");
  await page.getByRole("button", { name: "复制脱敏诊断" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain("Bearer");
});
```

`screenshot-analysis.spec.ts` calls the background screenshot command through the service worker and asserts `sourceType: "screenshot"`. `prompt-history.spec.ts` imports a fixture template, analyzes once, restores the history row, deletes it, confirms deletion, and asserts the empty state.

- [x] **Step 4: Run GREEN**

Run: `npm run test:e2e`

Expected: all E2E tests pass with no real network requests.

- [x] **Step 5: Commit**

```bash
git add playwright.config.ts tests
git commit -m "test: cover critical extension journeys"
```

### Task 13: Documentation, Packaging, and Final Verification

**Files:**
- Create: `README.md`
- Create: `docs/INSTALL.md`
- Create: `docs/CONFIGURATION.md`
- Create: `docs/MIGRATION.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `scripts/assert-manifest.mjs`
- Modify: `package.json`

- [x] **Step 1: Add a packaging assertion**

```js
// scripts/assert-manifest.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(".output/chrome-mv3/manifest.json", "utf8"));
assert.deepEqual(
  [...manifest.permissions].sort(),
  ["activeTab", "commands", "contextMenus", "scripting", "storage"].sort()
);
assert.ok(!(manifest.host_permissions ?? []).includes("<all_urls>"));
assert.deepEqual(
  [...manifest.optional_host_permissions].sort(),
  ["http://*/*", "https://*/*"].sort()
);
console.log("Manifest permission assertion passed");
```

- [x] **Step 2: Build then run the assertion**

Add `"check:manifest": "node scripts/assert-manifest.mjs"` to `package.json`.

Run: `npm run build && npm run check:manifest`

Expected: prints `Manifest permission assertion passed`.

- [x] **Step 3: Write operator documentation**

```markdown
<!-- README.md -->
# Hhh Prompt Studio Next

## Quick Start
1. Run `npm install`.
2. Run `npm run dev` for development or `npm run build` for an unpacked build.
3. Load `.output/chrome-mv3` from `chrome://extensions`.

## Checks
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e`
- `npm run build`

## Project Structure
Entrypoints live in `entrypoints/`; framework-free features live in `src/features/`; extension journeys live in `tests/e2e/`.
```

```markdown
<!-- docs/INSTALL.md -->
# Installation
Build with `npm run build`, enable Developer mode in Chrome, choose Load unpacked, and select `.output/chrome-mv3`.
```

```markdown
<!-- docs/CONFIGURATION.md -->
# Configuration
Configure an OpenAI-compatible Base URL or full chat-completions Endpoint, a local API Key, a model name, and an image transport. Endpoint access and hover access are requested only when enabled.
```

```markdown
<!-- docs/MIGRATION.md -->
# Migration
Export templates from the old extension and import the JSON file in Prompt Library. API keys are never exported and must be entered again. Invalid rows are reported individually.
```

```markdown
<!-- docs/ARCHITECTURE.md -->
# Architecture
Background owns privileged browser and network operations. The Shadow DOM React workbench owns interaction state. Prompt, media, analysis, settings, history, and diagnostics modules expose typed interfaces and do not import UI code.
```

- [x] **Step 4: Run the complete release gate**

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm test`

Expected: all unit and component tests pass.

Run: `npm run build`

Expected: Chrome MV3 build exits 0.

Run: `npm run check:manifest`

Expected: permission assertion passes.

Run: `npm run test:e2e`

Expected: all critical journeys pass.

Run: `npm run zip`

Expected: a distributable archive is created under `.output/`.

- [x] **Step 5: Inspect the final permission surface**

Open `.output/chrome-mv3/manifest.json` and verify:

- default permissions are exactly contextMenus, storage, activeTab, scripting, and commands;
- optional host permissions contain HTTP and HTTPS patterns;
- no API Key, Endpoint, or test fixture URL is embedded;
- no legacy or video entrypoint is packaged.

- [x] **Step 6: Commit**

```bash
git add README.md docs package.json scripts/assert-manifest.mjs
git commit -m "docs: add extension delivery and migration guide"
```

## Plan Self-Review Checklist

- [x] Every in-scope design requirement maps to a task above.
- [x] Video, art brief, Eagle, cloud sync, and native Gemini remain out of scope.
- [x] API keys never enter exports, diagnostics, fixtures, or content-script messages.
- [x] One analysis request generates only the selected output format.
- [x] Hover requires explicit optional permission.
- [x] Unit, component, integration, E2E, build, and package checks are present.
- [x] Each task ends in a focused commit.
