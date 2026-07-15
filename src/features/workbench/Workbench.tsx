import { useEffect, useMemo, useRef, useState } from "react";
import type { OutputFormat } from "../../contracts/analysis";
import { BUILTIN_PROMPTS } from "../prompts/builtins";
import type { PromptPreset } from "../prompts/prompt-schema";
import { AnalysisControls } from "./AnalysisControls";
import { ResultPanel } from "./ResultPanel";
import { SourceSummary } from "./SourceSummary";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { WorkbenchSettings } from "./WorkbenchSettings";
import type {
  AnalyzeSelection,
  WorkbenchSource
} from "./workbench-types";

export function Workbench(props: {
  initialResult?: string;
  source: WorkbenchSource | null;
  prompts?: PromptPreset[];
  modelName?: string;
  onAnalyze: (selection: AnalyzeSelection) => Promise<{ content: string; durationMs: number } | undefined> | void;
  onPickImage?: () => void;
  onOpenHistory: () => void;
  onConfigurationChanged?: () => Promise<void> | void;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  savePosition?: (position: { x: number; y: number }) => void;
  theme?: "system" | "light" | "dark";
}) {
  const prompts = props.prompts ?? BUILTIN_PROMPTS;
  const [view, setView] = useState<"analysis" | "models" | "prompts">("analysis");
  const [minimized, setMinimized] = useState(false);
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [format, setFormat] = useState<OutputFormat>("zh");
  const [results, setResults] = useState<Partial<Record<OutputFormat, string>>>(
    props.initialResult ? { zh: props.initialResult } : {}
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [position, setPosition] = useState(
    props.initialPosition ? clampFloatingPosition(props.initialPosition) : null
  );
  const shellRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    start: { x: number; y: number };
    next: { x: number; y: number };
  } | null>(null);
  const prompt = useMemo(
    () => prompts.find((item) => item.id === promptId) ?? prompts[0],
    [promptId, prompts]
  );

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      const shell = shellRef.current;
      if (!drag || !shell) {
        return;
      }
      const next = clampFloatingPosition({
        x: drag.start.x + event.clientX - drag.pointerX,
        y: drag.start.y + event.clientY - drag.pointerY
      }, shell.offsetWidth);
      drag.next = next;
      shell.style.transform = `translate3d(${next.x - drag.start.x}px, ${next.y - drag.start.y}px, 0)`;
    };
    const end = () => {
      const drag = dragRef.current;
      const shell = shellRef.current;
      if (drag && shell) {
        shell.style.transform = "";
        shell.classList.remove("dragging");
        setPosition(drag.next);
        props.savePosition?.(drag.next);
      }
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    const handleResize = () => {
      setPosition((current) => current
        ? clampFloatingPosition(current, shellRef.current?.offsetWidth)
        : current);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("resize", handleResize);
    };
  }, [props.savePosition]);

  useEffect(() => {
    if (props.source) {
      setMinimized(false);
      setView("analysis");
      setPosition((current) => current
        ? clampFloatingPosition(current, shellRef.current?.offsetWidth)
        : current);
    }
  }, [props.source]);

  useEffect(() => {
    setPosition((current) => current
      ? clampFloatingPosition(current, shellRef.current?.offsetWidth)
      : current);
  }, [view]);

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
      ref={shellRef}
      className={`${minimized ? "workbench-shell minimized" : "workbench-shell"}${view !== "analysis" ? " secondary-view" : ""}`}
      data-testid="workbench-shell"
      data-mode="float"
      data-theme="dark"
      data-view={view}
      style={position ? {
        left: position.x,
        top: position.y,
        right: "auto",
        bottom: "auto"
      } : undefined}
      aria-label="Hhh 视觉分析工作台"
    >
      <WorkbenchHeader
        {...(view !== "analysis" ? {
          secondaryTitle: view === "prompts" ? "提示词模板" : "设置",
          onBack: () => setView("analysis")
        } : {})}
        onOpenHistory={props.onOpenHistory}
        onOpenSettings={() => setView("models")}
        onMinimize={() => setMinimized((value) => !value)}
        onClose={props.onClose}
        onPointerDown={(event) => {
          if (
            (event.target as HTMLElement).closest("button")
          ) {
            return;
          }
          const rect = event.currentTarget.parentElement?.getBoundingClientRect();
          if (rect) {
            const start = clampFloatingPosition({ x: rect.left, y: rect.top }, rect.width);
            dragRef.current = {
              pointerX: event.clientX,
              pointerY: event.clientY,
              start,
              next: start
            };
            shellRef.current?.classList.add("dragging");
          }
        }}
      />
      {minimized ? null : (
        <div className="workbench-body">
          {view === "analysis" ? (
            <>
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
                onManagePrompts={() => setView("prompts")}
                onAnalyze={() => void analyze()}
              />
              <ResultPanel
                result={results[format] ?? ""}
                error={error}
                running={running}
                durationMs={durationMs}
                onRetry={() => void analyze()}
              />
            </>
          ) : (
            <WorkbenchSettings
              key={view}
              initialTab={view === "prompts" ? "prompts" : "models"}
              {...(props.onConfigurationChanged
                ? { onChanged: props.onConfigurationChanged }
                : {})}
            />
          )}
        </div>
      )}
    </aside>
  );
}

function clampFloatingPosition(
  position: { x: number; y: number },
  measuredWidth?: number
) {
  const panelWidth = measuredWidth || Math.min(480, Math.max(0, window.innerWidth - 24));
  const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
  const maxY = Math.max(8, window.innerHeight - 120);
  return {
    x: Math.min(maxX, Math.max(8, position.x)),
    y: Math.min(maxY, Math.max(8, position.y))
  };
}
