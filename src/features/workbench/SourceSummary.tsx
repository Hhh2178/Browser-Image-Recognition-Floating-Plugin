import { Image as ImageIcon, MonitorUp } from "lucide-react";
import type { WorkbenchSource } from "./workbench-types";

export function SourceSummary({ source }: { source: WorkbenchSource | null }) {
  if (!source) {
    return (
      <section className="source-empty">
        <ImageIcon size={22} />
        <div>
          <strong>等待素材</strong>
          <span>右键图片或使用截图快捷键开始</span>
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
    </section>
  );
}
