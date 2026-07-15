import { Image as ImageIcon, ImagePlus, MousePointer2, MonitorUp } from "lucide-react";
import type { WorkbenchSource } from "./workbench-types";

export function SourceSummary(props: {
  source: WorkbenchSource | null;
  onPickImage?: () => void;
}) {
  const { source } = props;
  if (!source) {
    return (
      <section className="source-empty">
        <ImageIcon size={22} />
        <div>
          <strong>等待素材</strong>
          <span>右键图片、截图，或直接从页面选择</span>
          {props.onPickImage ? (
            <button type="button" className="pick-image-button" onClick={props.onPickImage}>
              <MousePointer2 size={15} />
              从当前页面选择图片
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="source-summary">
      <div className="source-thumbnail">
        <img src={source.previewUrl} alt="" />
      </div>
      <div className="source-meta">
        <span className="source-kind">
          {source.sourceType === "screenshot" ? <MonitorUp size={14} /> : <ImageIcon size={14} />}
          {source.sourceType === "screenshot" ? "网页截图" : "网页图片"}
        </span>
        <strong title={source.pageTitle}>{source.pageTitle || "未命名页面"}</strong>
        <span title={source.pageUrl}>{new URL(source.pageUrl).hostname}</span>
      </div>
      {props.onPickImage ? (
        <button type="button" className="source-pick-again" aria-label="选择另一张图片" title="选择另一张图片" onClick={props.onPickImage}>
          <ImagePlus size={16} />
        </button>
      ) : null}
    </section>
  );
}
