import {
  Check,
  Eye,
  EyeOff,
  Plus,
  PlugZap,
  Save,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  loadDailyUsage,
  localDateKey,
  type DailyUsage
} from "./model-routing";
import type {
  EndpointMode,
  ImageTransport,
  ModelConfig,
  ProviderConfig,
  Settings
} from "./settings-schema";

export function ProviderManager(props: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => Promise<boolean> | boolean;
  onTest?: () => Promise<void> | void;
}) {
  const [selectedProviderId, setSelectedProviderId] = useState(props.settings.activeProviderId);
  const [showKey, setShowKey] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({});
  const selectedProvider = useMemo(
    () => props.settings.providers.find((provider) => provider.id === selectedProviderId)
      ?? props.settings.providers[0]!,
    [props.settings.providers, selectedProviderId]
  );

  useEffect(() => {
    if (!props.settings.providers.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(props.settings.providers[0]!.id);
    }
  }, [props.settings.providers, selectedProviderId]);

  useEffect(() => {
    void loadDailyUsage().then(setDailyUsage);
  }, []);

  const updateProvider = (patch: Partial<ProviderConfig>) => {
    props.onChange({
      ...props.settings,
      providers: props.settings.providers.map((provider) => provider.id === selectedProvider.id
        ? { ...provider, ...patch }
        : provider)
    });
  };

  const updateModel = (modelId: string, patch: Partial<ModelConfig>) => {
    updateProvider({
      models: selectedProvider.models.map((model) => model.id === modelId
        ? { ...model, ...patch }
        : model)
    });
  };

  const addProvider = () => {
    const id = makeId("provider");
    const modelId = makeId("model");
    const provider: ProviderConfig = {
      id,
      name: "新服务商",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "",
      endpointMode: "base_url",
      imageTransport: "auto",
      enabled: true,
      models: [{
        id: modelId,
        name: "新模型",
        model: "vision-model",
        enabled: true,
        dailyLimit: null
      }]
    };
    props.onChange({
      ...props.settings,
      providers: [...props.settings.providers, provider]
    });
    setSelectedProviderId(id);
  };

  const deleteProvider = () => {
    if (props.settings.providers.length === 1) {
      return;
    }
    const providers = props.settings.providers.filter((provider) => provider.id !== selectedProvider.id);
    const fallback = providers[0]!;
    const removingActive = props.settings.activeProviderId === selectedProvider.id;
    props.onChange({
      ...props.settings,
      providers,
      activeProviderId: removingActive ? fallback.id : props.settings.activeProviderId,
      activeModelId: removingActive ? fallback.models[0]!.id : props.settings.activeModelId
    });
    setSelectedProviderId(fallback.id);
  };

  const addModel = () => {
    const model: ModelConfig = {
      id: makeId("model"),
      name: "新模型",
      model: "vision-model",
      enabled: true,
      dailyLimit: null
    };
    updateProvider({ models: [...selectedProvider.models, model] });
  };

  const deleteModel = (modelId: string) => {
    if (selectedProvider.models.length === 1) {
      return;
    }
    const models = selectedProvider.models.filter((model) => model.id !== modelId);
    const removingActive = props.settings.activeModelId === modelId;
    props.onChange({
      ...props.settings,
      providers: props.settings.providers.map((provider) => provider.id === selectedProvider.id
        ? { ...provider, models }
        : provider),
      ...(removingActive ? {
        activeProviderId: selectedProvider.id,
        activeModelId: models[0]!.id
      } : {})
    });
  };

  const setActiveModel = (modelId: string) => {
    props.onChange({
      ...props.settings,
      activeProviderId: selectedProvider.id,
      activeModelId: modelId
    });
  };

  return (
    <div className="provider-manager">
      <aside className="provider-catalog">
        <div className="provider-catalog-heading">
          <span>服务商</span>
          <button type="button" aria-label="新建服务商" title="新建服务商" onClick={addProvider}>
            <Plus size={15} />
          </button>
        </div>
        <div className="provider-list">
          {props.settings.providers.map((provider) => {
            const isActive = props.settings.activeProviderId === provider.id;
            return (
              <button
                type="button"
                key={provider.id}
                className={provider.id === selectedProvider.id ? "provider-item selected" : "provider-item"}
                onClick={() => setSelectedProviderId(provider.id)}
              >
                <span><strong>{provider.name}</strong><small>{provider.models.length} 个模型</small></span>
                {isActive ? <Check size={14} aria-label="当前服务商" /> : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="provider-editor">
        <header className="provider-editor-heading">
          <div><h3>{selectedProvider.name}</h3><p>连接信息由该服务商下的所有模型共用。</p></div>
          <div className="provider-heading-actions">
            <label className="compact-check"><input type="checkbox" checked={selectedProvider.enabled} onChange={(event) => updateProvider({ enabled: event.target.checked })} />启用</label>
            <button type="button" aria-label="删除服务商" title="删除服务商" disabled={props.settings.providers.length === 1} onClick={deleteProvider}><Trash2 size={15} /></button>
          </div>
        </header>

        <div className="provider-fields">
          <label>服务商名称<input value={selectedProvider.name} onChange={(event) => updateProvider({ name: event.target.value })} /></label>
          <label>API 地址<input value={selectedProvider.apiUrl} onChange={(event) => updateProvider({ apiUrl: event.target.value })} /></label>
          <div className="settings-grid">
            <label>Endpoint 模式<select value={selectedProvider.endpointMode} onChange={(event) => updateProvider({ endpointMode: event.target.value as EndpointMode })}><option value="base_url">Base URL</option><option value="full_endpoint">完整 Endpoint</option></select></label>
            <label>图片传输<select value={selectedProvider.imageTransport} onChange={(event) => updateProvider({ imageTransport: event.target.value as ImageTransport })}><option value="auto">自动</option><option value="data_url">Data URL</option><option value="source_url">源地址</option><option value="text_only">仅文本</option></select></label>
          </div>
          <label className="inline-key-field">API Key<div><input type={showKey ? "text" : "password"} value={selectedProvider.apiKey} onChange={(event) => updateProvider({ apiKey: event.target.value })} /><button type="button" aria-label={showKey ? "隐藏 API Key" : "显示 API Key"} onClick={() => setShowKey((value) => !value)}>{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        </div>

        <div className="model-library-heading">
          <div><strong>模型库</strong><span>每日上限留空时不参与额度切换</span></div>
          <button type="button" onClick={addModel}><Plus size={14} />添加模型</button>
        </div>
        <div className="model-config-list">
          {selectedProvider.models.map((model) => {
            const active = props.settings.activeModelId === model.id
              && props.settings.activeProviderId === selectedProvider.id;
            const usage = dailyUsage[`${selectedProvider.id}:${model.id}`];
            const usedToday = usage?.date === localDateKey() ? usage.count : 0;
            return (
              <article key={model.id} className={active ? "model-config active" : "model-config"}>
                <div className="model-config-topline">
                  <button type="button" className="model-default" onClick={() => setActiveModel(model.id)}>
                    <span className="model-radio" aria-hidden="true" />
                    {active ? "当前模型" : "设为当前"}
                  </button>
                  <label className="compact-check"><input type="checkbox" checked={model.enabled} onChange={(event) => updateModel(model.id, { enabled: event.target.checked })} />启用</label>
                  <button type="button" className="model-delete" aria-label={`删除模型 ${model.name}`} title="删除模型" disabled={selectedProvider.models.length === 1} onClick={() => deleteModel(model.id)}><Trash2 size={14} /></button>
                </div>
                <div className="model-fields">
                  <label>显示名称<input value={model.name} onChange={(event) => updateModel(model.id, { name: event.target.value })} /></label>
                  <label>模型标识<input value={model.model} onChange={(event) => updateModel(model.id, { model: event.target.value })} /></label>
                </div>
                <div className="quota-row">
                  <label className="compact-check"><input type="checkbox" checked={model.dailyLimit !== null} onChange={(event) => updateModel(model.id, { dailyLimit: event.target.checked ? 100 : null })} />每日使用上限</label>
                  {model.dailyLimit !== null ? (
                    <>
                      <label className="quota-input"><input type="number" min="1" step="1" value={model.dailyLimit} onChange={(event) => updateModel(model.id, { dailyLimit: Math.max(1, Number(event.target.value) || 1) })} /><span>次/天</span></label>
                      <span className="quota-usage">今日 {usedToday}/{model.dailyLimit}</span>
                    </>
                  ) : <span className="quota-unlimited">不限次数</span>}
                </div>
              </article>
            );
          })}
        </div>

        <div className="inline-settings-actions provider-actions">
          {props.onTest ? <button type="button" onClick={() => void props.onTest?.()}><PlugZap size={15} />测试当前模型</button> : null}
          <button type="button" className="accent-button" onClick={() => void props.onSave()}><Save size={15} />保存全部配置</button>
        </div>
      </section>
    </div>
  );
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
