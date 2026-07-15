import { Play, SlidersHorizontal } from "lucide-react";
import type { OutputFormat } from "../../contracts/analysis";
import type { PromptPreset } from "../prompts/prompt-schema";

const FORMATS: Array<{ id: OutputFormat; label: string }> = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
  { id: "json", label: "JSON" }
];

export function AnalysisControls(props: {
  prompts: PromptPreset[];
  selectedPromptId: string;
  outputFormat: OutputFormat;
  modelName: string;
  runningCount: number;
  disabled: boolean;
  onPromptChange: (id: string) => void;
  onFormatChange: (format: OutputFormat) => void;
  onManagePrompts: () => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="analysis-controls">
      <div className="field-row">
        <label htmlFor="hhh-prompt-select">提示词模板</label>
        <button
          type="button"
          className="subtle-icon"
          aria-label="管理提示词模板"
          title="管理提示词模板"
          onClick={props.onManagePrompts}
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>
      <select
        id="hhh-prompt-select"
        value={props.selectedPromptId}
        onChange={(event) => props.onPromptChange(event.target.value)}
      >
        {props.prompts.map((prompt) => (
          <option key={prompt.id} value={prompt.id}>{prompt.name}</option>
        ))}
      </select>

      <div className="model-line">
        <span>模型</span>
        <strong>{props.modelName || "尚未配置"}</strong>
        <span className={props.modelName ? "status-light online" : "status-light"} aria-hidden="true" />
      </div>

      <div className="format-switch" aria-label="输出格式">
        {FORMATS.map((format) => (
          <button
            key={format.id}
            type="button"
            className={props.outputFormat === format.id ? "active" : ""}
            onClick={() => props.onFormatChange(format.id)}
          >
            {format.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="primary-action"
        disabled={props.disabled}
        onClick={props.onAnalyze}
      >
        <Play size={16} fill="currentColor" />
        {props.runningCount > 0 ? "加入分析队列" : "开始分析"}
      </button>
    </section>
  );
}
