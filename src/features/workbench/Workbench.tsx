import { useEffect, useMemo, useRef, useState } from "react";
import type { OutputFormat } from "../../contracts/analysis";
import { BUILTIN_PROMPTS } from "../prompts/builtins";
import type { PromptPreset } from "../prompts/prompt-schema";
import { AnalysisControls } from "./AnalysisControls";
import { AnalysisQueue } from "./AnalysisQueue";
import { ResultPanel } from "./ResultPanel";
import { SourceSummary } from "./SourceSummary";
import { WorkbenchHeader } from "./WorkbenchHeader";
import { WorkbenchSettings } from "./WorkbenchSettings";
import type {
  AnalysisTask,
  AnalyzeSelection,
  WorkbenchSource
} from "./workbench-types";

export function Workbench(props: {
  initialResult?: string;
  source: WorkbenchSource | null;
  prompts?: PromptPreset[];
  modelName?: string;
  onAnalyze: (selection: AnalyzeSelection) => Promise<{
    content: string;
    durationMs: number;
    providerName?: string;
    modelName?: string;
  } | undefined> | void;
  onPickImage?: () => void;
  onOpenHistory: () => void;
  onConfigurationChanged?: () => Promise<void> | void;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  savePosition?: (position: { x: number; y: number }) => void;
  saveSize?: (size: { width: number; height: number }) => void;
  theme?: "system" | "light" | "dark";
  hidden?: boolean;
}) {
  const prompts = props.prompts ?? BUILTIN_PROMPTS;
  const [view, setView] = useState<"analysis" | "models" | "prompts">("analysis");
  const [minimized, setMinimized] = useState(false);
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [format, setFormat] = useState<OutputFormat>("zh");
  const [tasks, setTasks] = useState<AnalysisTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [standaloneResult, setStandaloneResult] = useState(props.initialResult ?? "");
  const [size, setSize] = useState(() => clampFloatingSize(props.initialSize));
  const [position, setPosition] = useState(() => {
    const initial = props.initialPosition ?? {
      x: window.innerWidth - clampFloatingSize(props.initialSize).width - 16,
      y: 16
    };
    return clampFloatingPosition(initial, size.width, size.height);
  });
  const shellRef = useRef<HTMLElement | null>(null);
  const sizeRef = useRef(size);
  const positionRef = useRef(position);
  const resizeDirtyRef = useRef(false);
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
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;
  const runningCount = tasks.filter((task) => task.status === "running").length;

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
      }, shell.offsetWidth, shell.offsetHeight);
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
        positionRef.current = drag.next;
        props.savePosition?.(drag.next);
      }
      dragRef.current = null;
      if (resizeDirtyRef.current && shell && !minimized) {
        const nextSize = clampFloatingSize(sizeRef.current);
        const nextPosition = clampFloatingPosition(
          positionRef.current,
          nextSize.width,
          nextSize.height
        );
        shell.style.left = `${nextPosition.x}px`;
        shell.style.top = `${nextPosition.y}px`;
        setSize(nextSize);
        setPosition(nextPosition);
        positionRef.current = nextPosition;
        props.saveSize?.(nextSize);
        props.savePosition?.(nextPosition);
        resizeDirtyRef.current = false;
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    const handleResize = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const nextSize = clampFloatingSize({
        width: shell.offsetWidth,
        height: shell.offsetHeight
      });
      const nextPosition = clampFloatingPosition(
        positionRef.current,
        nextSize.width,
        nextSize.height
      );
      sizeRef.current = nextSize;
      positionRef.current = nextPosition;
      setSize(nextSize);
      setPosition(nextPosition);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("resize", handleResize);
    };
  }, [minimized, props.savePosition, props.saveSize]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || minimized || window.innerWidth <= 760) {
        return;
      }
      const next = {
        width: Math.round(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width),
        height: Math.round(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
      };
      if (next.width < 1 || next.height < 1) {
        return;
      }
      if (
        Math.abs(next.width - sizeRef.current.width) > 1
        || Math.abs(next.height - sizeRef.current.height) > 1
      ) {
        sizeRef.current = next;
        resizeDirtyRef.current = true;
      }
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, [minimized]);

  useEffect(() => {
    if (!props.initialSize) {
      return;
    }
    const nextSize = clampFloatingSize(props.initialSize);
    const nextPosition = clampFloatingPosition(
      positionRef.current,
      nextSize.width,
      nextSize.height
    );
    sizeRef.current = nextSize;
    positionRef.current = nextPosition;
    setSize(nextSize);
    setPosition(nextPosition);
  }, [props.initialSize]);

  useEffect(() => {
    if (!props.initialPosition) {
      return;
    }
    const next = clampFloatingPosition(
      props.initialPosition,
      sizeRef.current.width,
      sizeRef.current.height
    );
    positionRef.current = next;
    setPosition(next);
  }, [props.initialPosition]);

  useEffect(() => {
    setStandaloneResult(props.initialResult ?? "");
    setActiveTaskId(null);
  }, [props.initialResult]);

  useEffect(() => {
    if (props.source) {
      setMinimized(false);
      setView("analysis");
      setActiveTaskId(null);
      const shell = shellRef.current;
      const next = clampFloatingPosition(
        positionRef.current,
        shell?.offsetWidth,
        shell?.offsetHeight
      );
      positionRef.current = next;
      setPosition(next);
    }
  }, [props.source]);

  useEffect(() => {
    const shell = shellRef.current;
    const next = clampFloatingPosition(
      positionRef.current,
      shell?.offsetWidth,
      shell?.offsetHeight
    );
    positionRef.current = next;
    setPosition(next);
  }, [view]);

  const runSelection = async (selection: AnalyzeSelection, existingId?: string) => {
    const id = existingId ?? crypto.randomUUID();
    const initialTask: AnalysisTask = {
      id,
      createdAt: Date.now(),
      selection,
      status: "running",
      result: "",
      error: "",
      durationMs: null,
      providerName: "",
      modelName: props.modelName ?? ""
    };
    setStandaloneResult("");
    setActiveTaskId(id);
    setQueueCollapsed(false);
    setTasks((current) => existingId
      ? current.map((task) => task.id === id ? initialTask : task)
      : [initialTask, ...current]);
    try {
      const response = await props.onAnalyze(selection);
      if (!response) {
        throw new Error("分析任务未返回结果");
      }
      setTasks((current) => current.map((task) => task.id === id ? {
        ...task,
        status: "completed",
        result: response.content,
        durationMs: response.durationMs,
        providerName: response.providerName ?? "",
        modelName: response.modelName ?? task.modelName
      } : task));
    } catch (reason) {
      setTasks((current) => current.map((task) => task.id === id ? {
        ...task,
        status: "failed",
        error: reason instanceof Error ? reason.message : "分析失败，请重试。"
      } : task));
    }
  };

  const analyze = () => {
    if (!props.source || !prompt) {
      return;
    }
    void runSelection({ source: props.source, prompt, outputFormat: format });
  };

  const retryTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (task) {
      void runSelection(task.selection, id);
    }
  };

  const selectPrompt = (id: string) => {
    setPromptId(id);
    const nextPrompt = prompts.find((item) => item.id === id);
    if (nextPrompt && !nextPrompt.supportedFormats.includes(format)) {
      setFormat(nextPrompt.supportedFormats[0]!);
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
      hidden={props.hidden}
      style={{
        left: position.x,
        top: position.y,
        right: "auto",
        bottom: "auto",
        ...(minimized ? {} : { width: size.width, height: size.height })
      }}
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
            const start = clampFloatingPosition(
              { x: rect.left, y: rect.top },
              rect.width,
              rect.height
            );
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
                runningCount={runningCount}
                disabled={!props.source}
                onPromptChange={selectPrompt}
                onFormatChange={setFormat}
                onManagePrompts={() => setView("prompts")}
                onAnalyze={analyze}
              />
              <AnalysisQueue
                tasks={tasks}
                collapsed={queueCollapsed}
                activeTaskId={activeTaskId}
                onToggle={() => setQueueCollapsed((value) => !value)}
                onSelect={setActiveTaskId}
                onRetry={retryTask}
                onRemove={(id) => {
                  setTasks((current) => current.filter((task) => task.id !== id));
                  if (activeTaskId === id) {
                    setActiveTaskId(null);
                  }
                }}
              />
              <ResultPanel
                result={activeTask?.result ?? standaloneResult}
                error={activeTask?.error ?? ""}
                running={activeTask?.status === "running"}
                durationMs={activeTask?.durationMs ?? null}
                onRetry={() => activeTask ? retryTask(activeTask.id) : analyze()}
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
  measuredWidth?: number,
  measuredHeight?: number
) {
  const panelWidth = measuredWidth || Math.min(400, Math.max(0, window.innerWidth - 24));
  const panelHeight = measuredHeight || Math.min(640, Math.max(0, window.innerHeight - 24));
  const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
  const maxY = Math.max(8, window.innerHeight - panelHeight - 8);
  return {
    x: Math.min(maxX, Math.max(8, position.x)),
    y: Math.min(maxY, Math.max(8, position.y))
  };
}

function clampFloatingSize(size?: { width: number; height: number }) {
  const viewportWidth = Math.max(320, window.innerWidth - 24);
  const viewportHeight = Math.max(320, window.innerHeight - 24);
  const minWidth = Math.min(336, viewportWidth);
  const minHeight = Math.min(420, viewportHeight);
  return {
    width: Math.min(Math.min(860, viewportWidth), Math.max(minWidth, size?.width ?? 400)),
    height: Math.min(viewportHeight, Math.max(minHeight, size?.height ?? Math.min(640, window.innerHeight - 40)))
  };
}
