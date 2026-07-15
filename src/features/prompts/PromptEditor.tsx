import { useEffect, useState } from "react";
import { promptSchema, type PromptPreset } from "./prompt-schema";

export function PromptEditor(props: {
  prompt: PromptPreset;
  onSave: (prompt: PromptPreset) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState(props.prompt);
  const [error, setError] = useState("");

  useEffect(() => setDraft(props.prompt), [props.prompt]);

  const submit = async () => {
    const parsed = promptSchema.safeParse({
      ...draft,
      updatedAt: Date.now()
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "模板无效");
      return;
    }
    setError("");
    await props.onSave(parsed.data);
  };

  return (
    <form className="prompt-editor" onSubmit={(event) => {
      event.preventDefault();
      void submit();
    }}>
      <div className="two-column-fields">
        <label>
          模板名称
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({
              ...current,
              name: event.target.value
            }))}
          />
        </label>
        <label>
          任务类型
          <select
            value={draft.taskType}
            onChange={(event) => setDraft((current) => ({
              ...current,
              taskType: event.target.value as PromptPreset["taskType"]
            }))}
          >
            <option value="image_analysis">图片分析</option>
            <option value="screenshot_analysis">截图分析</option>
          </select>
        </label>
      </div>
      <label>
        用途说明
        <input
          value={draft.description}
          onChange={(event) => setDraft((current) => ({
            ...current,
            description: event.target.value
          }))}
        />
      </label>
      <label>
        模板内容
        <textarea
          rows={12}
          value={draft.content}
          onChange={(event) => setDraft((current) => ({
            ...current,
            content: event.target.value
          }))}
        />
      </label>
      <p className="field-help">
        可用变量：{"{{outputFormat}}"}、{"{{sourceType}}"}、{"{{pageTitle}}"}
      </p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button type="submit" className="primary-button">保存模板</button>
      </div>
    </form>
  );
}
