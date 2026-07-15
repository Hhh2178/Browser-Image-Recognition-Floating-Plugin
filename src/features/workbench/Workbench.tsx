import { useEffect, useMemo, useRef, useState } from "react";
import type { OutputFormat } from "../../contracts/analysis";
import { BUILTIN_PROMPTS } from "../prompts/builtins";
import type { PromptPreset } from "../prompts/prompt-schema";
import { AnalysisControls } from "./AnalysisControls";
import { ResultPanel } from "./ResultPanel";
import { SourceSummary } from "./SourceSummary";
import { WorkbenchHeader } from "./WorkbenchHeader";
import type {
  AnalyzeSelection,
  LayoutMode,
  WorkbenchSource
} from "./workbench-types";

export function Workbench(props: {
  initialMode: LayoutMode;
  initialResult?: string;
  source: WorkbenchSource | null;
  prompts?: PromptPreset[];
  modelName?: string;
  onAnalyze: (selection: AnalyzeSelection) => Promise<{ content: string; durationMs: number } | undefined> | void;
  onPickImage?: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onManagePrompts?: () => void;
  onClose: () => void;
  saveLayout: (mode: LayoutMode) => void;
  initialPosition?: { x: number; y: number };
  savePosition?: (position: { x: number; y: number }) => void;
  theme?: "system" | "light" | "dark";
}) {
  const prompts = props.prompts ?? BUILTIN_PROMPTS;
  const [mode, setMode] = useState(props.initialMode);
  const [minimized, setMinimized] = useState(false);
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [format, setFormat] = useState<OutputFormat>("zh");
  const [results, setResults] = useState<Partial<Record<OutputFormat, string>>>(
    props.initialResult ? { zh: props.initialResult } : {}
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [position, setPosition] = useState(props.initialPosition ?? null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const prompt = useMemo(
    () => prompts.find((item) => item.id === promptId) ?? prompts[0],
    [promptId, prompts]
  );

  const changeMode = (nextMode: LayoutMode) => {
    setMode(nextMode);
    props.saveLayout(nextMode);
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragRef.current || mode !== "float") {
        return;
      }
      const maxX = Math.max(8, window.innerWidth - 448);
      const maxY = Math.max(8, window.innerHeight - 120);
      setPosition({
        x: Math.min(maxX, Math.max(8, event.clientX - dragRef.current.offsetX)),
        y: Math.min(maxY, Math.max(8, event.clientY - dragRef.current.offsetY))
      });
    };
    const end = () => {
      if (dragRef.current && position) {
        props.savePosition?.(position);
      }
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [mode, position, props]);

  const analyze = async () => {
    if (!props.source || !prompt) {
      setError("请先选择可分析的图片或截图。");
      return;
    }
    setRunning(true);
    setError("");
    setDurationMs(null);
    try {
      const response = await props.onAnalyze({
        source: props.source,
        prompt,
        outputFormat: format
      });
      if (response) {
        setResults((current) => ({ ...current, [format]: response.content }));
        setDurationMs(response.durationMs);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "分析失败，请重试。");
    } finally {
      setRunning(false);
    }
  };

  return (
    <aside
      className={minimized ? "workbench-shell minimized" : "workbench-shell"}
      data-testid="workbench-shell"
      data-mode={mode}
      data-theme={props.theme ?? "system"}
      style={mode === "float" && position ? {
        left: position.x,
        top: position.y,
        right: "auto",
        bottom: "auto"
      } : undefined}
      aria-label="Hhh 视觉分析工作台"
    >
      <WorkbenchHeader
        mode={mode}
        onModeChange={changeMode}
        onOpenHistory={props.onOpenHistory}
        onOpenSettings={props.onOpenSettings}
        onMinimize={() => setMinimized((value) => !value)}
        onClose={props.onClose}
        onPointerDown={(event) => {
          if (
            mode !== "float"
            || (event.target as HTMLElement).closest("button")
          ) {
            return;
          }
          const rect = event.currentTarget.parentElement?.getBoundingClientRect();
          if (rect) {
            dragRef.current = {
              offsetX: event.clientX - rect.left,
              offsetY: event.clientY - rect.top
            };
          }
        }}
      />
      {minimized ? null : (
        <div className="workbench-body">
          <SourceSummary
            source={props.source}
            {...(props.onPickImage ? { onPickImage: props.onPickImage } : {})}
          />
          <AnalysisControls
            prompts={prompts}
            selectedPromptId={promptId}
            outputFormat={format}
            modelName={props.modelName ?? ""}
            running={running}
            disabled={!props.source}
            onPromptChange={setPromptId}
            onFormatChange={setFormat}
            onManagePrompts={props.onManagePrompts ?? props.onOpenSettings}
            onAnalyze={() => void analyze()}
          />
          <ResultPanel
            result={results[format] ?? ""}
            error={error}
            running={running}
            durationMs={durationMs}
            onRetry={() => void analyze()}
          />
        </div>
      )}
    </aside>
  );
}
