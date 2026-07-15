import { Check, Copy, RefreshCw } from "lucide-react";

export function ResultPanel(props: {
  result: string;
  error: string;
  running: boolean;
  durationMs: number | null;
  onRetry: () => void;
}) {
  const copy = async () => {
    if (props.result) {
      await navigator.clipboard.writeText(props.result);
    }
  };

  return (
    <section className="result-panel">
      <div className="result-heading">
        <strong>分析结果</strong>
        {props.durationMs !== null ? (
          <span className="completed"><Check size={14} />{(props.durationMs / 1000).toFixed(1)} 秒</span>
        ) : null}
      </div>
      {props.error ? (
        <div className="error-state" role="alert">
          <strong>分析失败</strong>
          <p>{props.error}</p>
          <button type="button" onClick={props.onRetry}><RefreshCw size={14} />重试</button>
        </div>
      ) : (
        <div className={props.running ? "result-content loading" : "result-content"}>
          {props.running ? "模型正在理解画面..." : props.result || "完成分析后，结果会显示在这里。"}
        </div>
      )}
      <div className="result-actions">
        <button type="button" disabled={!props.result} onClick={() => void copy()}>
          <Copy size={15} />复制结果
        </button>
      </div>
    </section>
  );
}
