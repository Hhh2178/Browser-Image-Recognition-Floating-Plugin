import {
  CheckCircle2,
  Save
} from "lucide-react";
import { useEffect, useState } from "react";
import { importPromptBundle } from "../prompts/prompt-import";
import {
  deletePrompt,
  listPrompts,
  savePrompt
} from "../prompts/prompt-repository";
import { PromptManager } from "../prompts/PromptManager";
import type { PromptPreset } from "../prompts/prompt-schema";
import {
  requestEndpointPermissions,
  setHoverPermission
} from "../settings/permissions";
import { ProviderManager } from "../settings/ProviderManager";
import {
  loadSettings,
  saveSettings
} from "../settings/settings-repository";
import {
  DEFAULT_SETTINGS,
  settingsSchema,
  type Settings
} from "../settings/settings-schema";

type SettingsTab = "models" | "prompts" | "behavior";
const VISION_TEST_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAFAgIACR3X6QAAAABJRU5ErkJggg==";

export function WorkbenchSettings(props: {
  initialTab: SettingsTab;
  onChanged?: () => Promise<void> | void;
}) {
  const [tab, setTab] = useState<SettingsTab>(props.initialTab);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [prompts, setPrompts] = useState<PromptPreset[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void Promise.all([loadSettings(), listPrompts()]).then(([loaded, loadedPrompts]) => {
      setSettings(loaded);
      setPrompts(loadedPrompts);
    });
  }, []);

  const persistSettings = async (): Promise<boolean> => {
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "设置无效");
      return false;
    }
    const endpointGranted = await requestEndpointPermissions(
      parsed.data.providers.filter((provider) => provider.enabled).map((provider) => provider.apiUrl)
    );
    if (!endpointGranted) {
      setNotice("未授予模型接口访问权限");
      return false;
    }
    await saveSettings(parsed.data);
    setSettings(parsed.data);
    await props.onChanged?.();
    setNotice("设置已保存");
    return true;
  };

  const runConnectionTest = async () => {
    if (!await persistSettings()) {
      return;
    }
    setNotice("正在测试视觉连接...");
    const response: { ok: boolean; error?: { message: string } } = await chrome.runtime.sendMessage({
      type: "analysis/run",
      payload: {
        sourceType: "screenshot",
        imageDataUrl: VISION_TEST_IMAGE,
        prompt: "如果能看到图片，请只回复：视觉连接正常",
        outputFormat: "zh",
        preferredModelId: settings.activeModelId,
        pageUrl: location.href,
        pageTitle: "连接测试"
      }
    });
    setNotice(response.ok ? "视觉连接测试成功" : (response.error?.message ?? "连接测试失败"));
  };

  const refreshPrompts = async () => {
    setPrompts(await listPrompts());
    await props.onChanged?.();
  };

  const importPrompts = async (raw: string) => {
    const result = importPromptBundle(raw);
    await Promise.all(result.imported.map(savePrompt));
    await refreshPrompts();
    setNotice(result.errors.length
      ? `已导入 ${result.imported.length} 条，${result.errors.length} 条失败`
      : `已导入 ${result.imported.length} 条模板`);
  };

  return (
    <section className="inline-settings">
      <nav className="settings-tabs" aria-label="设置分类">
        <button type="button" className={tab === "models" ? "active" : ""} onClick={() => setTab("models")}>模型</button>
        <button type="button" className={tab === "prompts" ? "active" : ""} onClick={() => setTab("prompts")}>提示词</button>
        <button type="button" className={tab === "behavior" ? "active" : ""} onClick={() => setTab("behavior")}>行为</button>
      </nav>

      {tab === "models" ? (
        <div className="inline-settings-page">
          <header className="secondary-heading">
            <h2>模型与接口</h2>
            <p>按服务商管理连接信息、模型列表和可选的每日使用额度。</p>
          </header>
          <ProviderManager
            settings={settings}
            onChange={setSettings}
            onSave={persistSettings}
            onTest={runConnectionTest}
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
        <div className="inline-settings-page">
          <header className="secondary-heading">
            <h2>行为与权限</h2>
            <p>控制网页图片入口和额外网站权限。</p>
          </header>
          <label className="inline-toggle-row">
            <span><strong>网页图片悬停分析</strong><small>在较大的网页图片右上角显示分析按钮。</small></span>
            <input type="checkbox" checked={settings.hoverEnabled} onChange={(event) => {
              const enabled = event.target.checked;
              void setHoverPermission(enabled).then(async (granted) => {
                const next = { ...settings, hoverEnabled: granted };
                setSettings(next);
                await saveSettings(next);
                await props.onChanged?.();
                setNotice(granted ? "悬停分析已启用" : "悬停分析已关闭");
              });
            }} />
          </label>
          <div className="inline-settings-actions">
            <button type="button" className="accent-button" onClick={() => void persistSettings()}><Save size={15} />保存设置</button>
          </div>
        </div>
      ) : null}

      {notice ? <div className="inline-notice" role="status"><CheckCircle2 size={15} />{notice}</div> : null}
    </section>
  );
}
