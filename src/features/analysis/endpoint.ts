import type { EndpointMode } from "../settings/settings-schema";

export function normalizeEndpoint(
  value: string,
  mode: EndpointMode
): string {
  const clean = value.trim().replace(/\/+$/, "");
  if (mode === "full_endpoint" || /\/chat\/completions$/i.test(clean)) {
    return clean;
  }
  if (/\/v1$/i.test(clean)) {
    return `${clean}/chat/completions`;
  }
  return `${clean}/v1/chat/completions`;
}
