import { CheckCircle2, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { importPromptBundle } from "../../src/features/prompts/prompt-import";
import {
  deletePrompt,
  listPrompts,
  savePrompt
} from "../../src/features/prompts/prompt-repository";
import { PromptManager } from "../../src/features/prompts/PromptManager";
import type { PromptPreset } from "../../src/features/prompts/prompt-schema";
import {
  requestEndpointPermissions,
  setHoverPermission
} from "../../src/features/settings/permissions";
import { ProviderManager } from "../../src/features/settings/ProviderManager";
import {
  loadSettings,
  saveSettings
} from "../../src/features/settings/settings-repository";
import {
  DEFAULT_SETTINGS,
  exportSettings,
  settingsSchema,
  type Settings
} from "../../src/features/settings/settings-schema";

type OptionsTab = "models" | "prompts" | "behavior";
const VISION_TEST_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAFAgIACR3X6QAAAABJRU5ErkJggg==";

export function OptionsApp() {
  const [tab, setTab] = useState<OptionsTab>("models");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [prompts, setPrompts] = useState<PromptPreset[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void Promise.all([loadSettings(), listPrompts()]).then(([loaded, loadedPrompts]) => {
      setSettings(loaded);
      setPrompts(loadedPrompts);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const persistSettings = async (): Promise<boolean> => {
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "设置无效");
      return false;
    }
    const permission = await requestEndpointPermissions(
      parsed.data.providers.filter((provider) => provider.enabled).map((provider) => provider.apiUrl)
    );
    if (!permission) {
      setNotice("未授予模型接口访问权限");
      return false;
    }
    await saveSettings(parsed.data);
    setNotice("设置已保存");
    return true;
  };

  const runConnectionTest = async (vision: boolean) => {
    if (!await persistSettings()) {
      return;
    }
    setNotice(vision ? "正在测试视觉连接..." : "正在测试文本连接...");
    const response: { ok: boolean; content?: string; error?: { message: string } } =
      await chrome.runtime.sendMessage({
        type: "analysis/run",
        payload: {
          sourceType: "screenshot",
          imageDataUrl: vision ? VISION_TEST_IMAGE : "",
          prompt: vision
            ? "如果能看到图片，请只回复：视觉连接正常"
            : "请只回复：文本连接正常",
          outputFormat: "zh",
          preferredModelId: settings.activeModelId,
          pageUrl: location.href,
          pageTitle: "连接测试"
        }
      });
    setNotice(
      response.ok
        ? (vision ? "视觉连接测试成功" : "文本连接测试成功")
        : (response.error?.message ?? "连接测试失败")
    );
  };

  const refreshPrompts = async () => setPrompts(await listPrompts());

  const importPrompts = async (raw: string) => {
    const result = importPromptBundle(raw);
    await Promise.all(result.imported.map(savePrompt));
    await refreshPrompts();
    setNotice(
      result.errors.length
        ? `已导入 ${result.imported.length} 条，${result.errors.length} 条失败`
        : `已导入 ${result.imported.length} 条模板`
    );
  };

  const exportTeamConfig = () => {
    const customPrompts = prompts.filter((prompt) => prompt.source === "custom");
    const blob = new Blob([JSON.stringify({
      schemaVersion: 1,
      settings: exportSettings(settings),
      prompts: customPrompts
    }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hhh-team-config.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("导出完成，API Key 未包含");
  };

  const importTeamConfig = async (raw: string) => {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      setNotice("团队配置文件无效");
      return;
    }
    const record = parsed as Record<string, unknown>;
    if (record.settings && typeof record.settings === "object") {
      const imported = record.settings as Record<string, unknown>;
      const providers = Array.isArray(imported.providers)
        ? imported.providers.map((value) => {
          const provider = value as Record<string, unknown>;
          const local = settings.providers.find((item) => item.id === provider.id);
          return { ...provider, apiKey: local?.apiKey ?? "" };
        })
        : imported.providers;
      const nextSettings = settingsSchema.safeParse({ ...imported, providers });
      if (!nextSettings.success) {
        setNotice(nextSettings.error.issues[0]?.message ?? "团队设置无效");
        return;
      }
      setSettings(nextSettings.data);
      await saveSettings(nextSettings.data);
    }
    const result = importPromptBundle(raw);
    await Promise.all(result.imported.map(savePrompt));
    await refreshPrompts();
    setNotice(`团队配置已导入，包含 ${result.imported.length} 条模板，API Key 保持本机值`);
  };

  return (
    <main className="options-shell">
      <aside className="options-nav">
        <div className="options-brand"><span>H</span><div><strong>Hhh Prompt Studio</strong><small>团队视觉分析设置</small></div></div>
        <nav>
          <button className={tab === "models" ? "active" : ""} onClick={() => setTab("models")}>模型与接口</button>
          <button className={tab === "prompts" ? "active" : ""} onClick={() => setTab("prompts")}>提示词模板</button>
          <button className={tab === "behavior" ? "active" : ""} onClick={() => setTab("behavior")}>行为与权限</button>
        </nav>
        <label className="export-config file-button">
          导入团队配置
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void file.text().then(importTeamConfig);
              }
            }}
          />
        </label>
        <button className="export-config" onClick={exportTeamConfig}><Download size={16} />导出团队配置</button>
      </aside>
      <section className="options-content">
        {tab === "models" ? (
          <div className="settings-section">
            <header><h1>模型与接口</h1><p>按服务商管理连接信息、模型列表和可选的每日使用额度。</p></header>
            <ProviderManager
              settings={settings}
              onChange={setSettings}
              onSave={persistSettings}
              onTest={() => runConnectionTest(true)}
            />
          </div>
        ) : null}
        {tab === "prompts" ? (
          <PromptManager
            prompts={prompts}
            onSave={async (prompt) => { await savePrompt(prompt); await refreshPrompts(); setNotice("模板已保存"); }}
            onDelete={async (id) => { await deletePrompt(id); await refreshPrompts(); setNotice("模板已删除"); }}
            onImport={importPrompts}
          />
        ) : null}
        {tab === "behavior" ? (
          <div className="settings-section">
            <header><h1>行为与权限</h1><p>默认入口保持克制，悬停分析需要额外网站权限。</p></header>
            <label className="toggle-row"><span><strong>网页图片悬停分析</strong><small>在足够大的网页图片右上角显示分析按钮。</small></span><input type="checkbox" checked={settings.hoverEnabled} onChange={(event) => { const enabled = event.target.checked; void setHoverPermission(enabled).then(async (granted) => { const next = { ...settings, hoverEnabled: granted }; setSettings(next); await saveSettings(next); setNotice(granted ? "悬停分析已启用" : "悬停分析已关闭"); }); }} /></label>
            <label className="toggle-row"><span><strong>界面主题</strong><small>工作台与设置页共享主题偏好。</small></span><select value={settings.theme} onChange={(event) => { const next = { ...settings, theme: event.target.value as Settings["theme"] }; setSettings(next); void saveSettings(next).then(() => setNotice("主题偏好已保存")); }}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label>
          </div>
        ) : null}
      </section>
      {notice ? <div className="options-toast" role="status"><CheckCircle2 size={16} />{notice}</div> : null}
    </main>
  );
}
