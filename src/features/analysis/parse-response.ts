export function parseAnalysisResponse(data: unknown): string {
  const record = asRecord(data);
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const content = message.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const text = content
      .map((part) => asRecord(part))
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => String(part.text))
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }
  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }
  if (typeof firstChoice.text === "string" && firstChoice.text.trim()) {
    return firstChoice.text.trim();
  }

  throw new AnalysisRequestError("EMPTY_RESPONSE", "模型没有返回可用内容", true);
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
