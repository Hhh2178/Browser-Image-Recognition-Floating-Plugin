const SECRET_KEY_PATTERN = /authorization|api.?key|token/i;

export function redactDiagnostic(
  value: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (SECRET_KEY_PATTERN.test(key)) {
        return [key, "[REDACTED]"];
      }
      if (typeof item === "string" && item.startsWith("data:image/")) {
        return [key, "[IMAGE_DATA]"];
      }
      return [key, item];
    })
  );
}
