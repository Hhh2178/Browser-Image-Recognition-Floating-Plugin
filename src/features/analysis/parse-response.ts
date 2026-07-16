export function parseAnalysisResponse(data: unknown): string {
  const record = asRecord(data);
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);

  for (const candidate of [
    message.content,
    message.reasoning_content,
    message.reasoning,
    firstChoice.text,
    record.output_text,
    record.output
  ]) {
    const text = extractText(candidate);
    if (text) {
      return text;
    }
  }

  throw new AnalysisRequestError("EMPTY_RESPONSE", "模型没有返回可用内容", true);
}

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n").trim();
  }
  if (!value || typeof value !== "object") {
    return "";
  }
  const record = asRecord(value);
  for (const key of ["text", "content", "value", "output_text"]) {
    const text = extractText(record[key]);
    if (text) {
      return text;
    }
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export class AnalysisRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AnalysisRequestError";
  }
}
