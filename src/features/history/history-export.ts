import type { HistoryRecord } from "./history-db";

export function formatHistoryExport(records: HistoryRecord[]): string {
  const sections = records.map((record, index) => [
    `===== ${index + 1} =====`,
    `时间：${formatTimestamp(record.createdAt)}`,
    `模型：${record.model}`,
    `模板：${record.templateId}`,
    `格式：${record.outputFormat}`,
    `来源：${record.pageUrl}`,
    "",
    record.result.trim()
  ].join("\r\n"));

  return [
    "Hhh Prompt Studio 未导出反推提示词",
    `导出时间：${formatTimestamp(Date.now())}`,
    `记录数量：${records.length}`,
    "",
    ...sections
  ].join("\r\n\r\n");
}

export function createHistoryExportFilename(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const value = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
  return `hhh-prompt-export-${value}.txt`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
