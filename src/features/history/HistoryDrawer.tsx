import { Download, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { HistoryRecord } from "./history-db";

export function HistoryDrawer(props: {
  records: HistoryRecord[];
  onRestore: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onExport: () => Promise<{ count: number; fileName: string }>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const pendingCount = props.records.filter((record) => !record.exportedAt).length;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return props.records;
    }
    return props.records.filter((record) =>
      `${record.result} ${record.model} ${record.pageUrl}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [props.records, query]);

  const exportPending = () => {
    setExporting(true);
    setExportNotice("");
    void props.onExport()
      .then(({ count, fileName }) => {
        setExportNotice(count > 0
          ? `已导出 ${count} 条到 ${fileName}`
          : "没有新的反推提示词需要导出");
      })
      .catch((error: unknown) => {
        setExportNotice(error instanceof Error ? error.message : "导出失败");
      })
      .finally(() => setExporting(false));
  };

  return (
    <section className="history-drawer" aria-label="分析历史">
      <div className="drawer-heading">
        <div>
          <strong>分析历史</strong>
          <span>最近 {props.records.length} 条</span>
        </div>
        <button type="button" aria-label="关闭历史" title="关闭历史" onClick={props.onClose}>
          <X size={17} />
        </button>
      </div>
      <div className="history-export-bar">
        <button
          type="button"
          disabled={exporting || pendingCount === 0}
          onClick={exportPending}
        >
          <Download size={15} />
          {exporting
            ? "正在导出"
            : pendingCount > 0
            ? `导出未导出内容 (${pendingCount})`
            : "暂无未导出内容"}
        </button>
        {exportNotice ? <span role="status">{exportNotice}</span> : null}
      </div>
      <label className="history-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索结果、模型或网址"
        />
      </label>
      <div className="history-list">
        {filtered.length === 0 ? (
          <p className="empty-copy">没有匹配的历史记录。</p>
        ) : filtered.map((record) => (
          <article key={record.id} className="history-item">
            <button type="button" className="history-restore" onClick={() => props.onRestore(record)}>
              <img src={record.thumbnail} alt="" />
              <span>
                <strong>{record.result.slice(0, 44)}</strong>
                <small>
                  {record.model}，{new Date(record.createdAt).toLocaleString()}
                  {record.exportedAt ? "，已导出" : ""}
                </small>
              </span>
            </button>
            <button
              type="button"
              className="history-delete"
              aria-label="删除历史记录"
              title="删除历史记录"
              onClick={() => props.onDelete(record.id)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
      {props.records.length > 0 ? (
        <button type="button" className="clear-history" onClick={props.onClear}>清空全部历史</button>
      ) : null}
    </section>
  );
}
