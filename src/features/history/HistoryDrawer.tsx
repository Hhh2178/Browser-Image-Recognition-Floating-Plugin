import { Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { HistoryRecord } from "./history-db";

export function HistoryDrawer(props: {
  records: HistoryRecord[];
  onRestore: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
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
                <small>{record.model} · {new Date(record.createdAt).toLocaleString()}</small>
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
