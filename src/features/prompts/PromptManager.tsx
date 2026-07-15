import { Copy, Download, FilePlus2, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { duplicatePrompt } from "./prompt-repository";
import { PromptEditor } from "./PromptEditor";
import type { PromptPreset } from "./prompt-schema";

export function PromptManager(props: {
  prompts: PromptPreset[];
  onSave: (prompt: PromptPreset) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onImport: (raw: string) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<PromptPreset | null>(props.prompts[0] ?? null);

  const createPrompt = () => {
    const now = Date.now();
    setSelected({
      id: crypto.randomUUID(),
      name: "新提示词模板",
      taskType: "image_analysis",
      description: "",
      tags: [],
      content: "分析当前图片，并以 {{outputFormat}} 格式返回最终结果。",
      supportedFormats: ["zh", "en", "json"],
      source: "custom",
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now
    });
  };

  const duplicate = async () => {
    if (!selected) {
      return;
    }
    const copy = duplicatePrompt(selected);
    await props.onSave(copy);
    setSelected(copy);
  };

  const exportPrompts = () => {
    const custom = props.prompts.filter((prompt) => prompt.source === "custom");
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, prompts: custom }, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hhh-prompt-presets.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="prompt-manager">
      <aside className="prompt-catalog">
        <div className="catalog-actions">
          <button type="button" onClick={createPrompt}><FilePlus2 size={15} />新建</button>
          <label className="file-button">
            <Upload size={15} />导入
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void file.text().then(props.onImport);
                }
              }}
            />
          </label>
          <button type="button" aria-label="导出模板" title="导出模板" onClick={exportPrompts}>
            <Download size={15} />
          </button>
        </div>
        <span className="catalog-label">内置模板</span>
        {props.prompts.filter((prompt) => prompt.source === "builtin").map((prompt) => (
          <button
            type="button"
            className={selected?.id === prompt.id ? "catalog-item active" : "catalog-item"}
            key={prompt.id}
            onClick={() => setSelected(prompt)}
          >
            <strong>{prompt.name}</strong>
            <span>{prompt.description}</span>
          </button>
        ))}
        <span className="catalog-label">自定义模板</span>
        {props.prompts.filter((prompt) => prompt.source === "custom").map((prompt) => (
          <button
            type="button"
            className={selected?.id === prompt.id ? "catalog-item active" : "catalog-item"}
            key={prompt.id}
            onClick={() => setSelected(prompt)}
          >
            <strong>{prompt.name}</strong>
            <span>{prompt.description || "自定义提示词"}</span>
          </button>
        ))}
      </aside>
      <section className="prompt-detail">
        {selected ? (
          <>
            <div className="detail-heading">
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.source === "builtin" ? "内置模板只读，复制后可编辑。" : "自定义模板"}</p>
              </div>
              <div className="detail-actions">
                <button type="button" onClick={() => void duplicate()}><Copy size={15} />复制模板</button>
                {selected.source === "custom" ? (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => {
                      if (window.confirm("删除这个提示词模板？")) {
                        void props.onDelete(selected.id);
                        setSelected(props.prompts[0] ?? null);
                      }
                    }}
                  >
                    <Trash2 size={15} />删除
                  </button>
                ) : null}
              </div>
            </div>
            {selected.source === "custom" ? (
              <PromptEditor prompt={selected} onSave={props.onSave} />
            ) : (
              <pre className="builtin-preview">{selected.content}</pre>
            )}
          </>
        ) : <p>选择或新建一个模板。</p>}
      </section>
    </div>
  );
}
