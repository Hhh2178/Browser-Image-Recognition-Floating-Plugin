import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Layers3,
  LoaderCircle,
  RotateCcw,
  X
} from "lucide-react";
import type { AnalysisTask } from "./workbench-types";

export function AnalysisQueue(props: {
  tasks: AnalysisTask[];
  collapsed: boolean;
  activeTaskId: string | null;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (props.tasks.length === 0) {
    return null;
  }
  const runningCount = props.tasks.filter((task) => task.status === "running").length;
  const completedCount = props.tasks.filter((task) => task.status === "completed").length;

  return (
    <section className={props.collapsed ? "analysis-queue collapsed" : "analysis-queue"} aria-label="分析任务队列">
      <button type="button" className="queue-heading" onClick={props.onToggle} aria-expanded={!props.collapsed}>
        <span className="queue-title"><Layers3 size={15} /><strong>任务队列</strong><small>{props.tasks.length}</small></span>
        <span className="queue-summary">
          {runningCount ? <span>{runningCount} 进行中</span> : null}
          {completedCount ? <span>{completedCount} 已完成</span> : null}
          <ChevronDown size={16} />
        </span>
      </button>
      {props.collapsed ? null : (
        <div className="queue-list">
          {props.tasks.map((task) => (
            <article key={task.id} className={props.activeTaskId === task.id ? "queue-item active" : "queue-item"}>
              <button type="button" className="queue-select" onClick={() => props.onSelect(task.id)}>
                <img src={task.selection.source.previewUrl} alt="" />
                <span className="queue-copy">
                  <strong>{task.selection.source.pageTitle || "未命名图片"}</strong>
                  <small>{task.modelName || task.selection.prompt.name}</small>
                </span>
                <QueueStatus task={task} />
              </button>
              <div className="queue-actions">
                {task.status === "failed" ? (
                  <button type="button" aria-label="重试任务" title="重试任务" onClick={() => props.onRetry(task.id)}><RotateCcw size={13} /></button>
                ) : null}
                {task.status !== "running" ? (
                  <button type="button" aria-label="移除任务" title="移除任务" onClick={() => props.onRemove(task.id)}><X size={14} /></button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QueueStatus({ task }: { task: AnalysisTask }) {
  if (task.status === "running") {
    return <span className="queue-status running"><LoaderCircle size={14} />分析中</span>;
  }
  if (task.status === "failed") {
    return <span className="queue-status failed"><AlertTriangle size={14} />失败</span>;
  }
  return (
    <span className="queue-status completed">
      <CheckCircle2 size={14} />
      {task.durationMs === null ? "完成" : `${(task.durationMs / 1000).toFixed(1)}s`}
    </span>
  );
}
