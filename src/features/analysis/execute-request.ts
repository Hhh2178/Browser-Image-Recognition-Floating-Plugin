import { buildChatPayload } from "./build-request";
import { normalizeEndpoint } from "./endpoint";
import { AnalysisRequestError, parseAnalysisResponse } from "./parse-response";
import type { EndpointMode, ImageTransport } from "../settings/settings-schema";

export interface ExecuteRequestInput {
  target: {
    apiUrl: string;
    apiKey: string;
    endpointMode: EndpointMode;
    imageTransport: ImageTransport;
    model: string;
  };
  prompt: string;
  imageDataUrl: string;
  sourceUrl?: string;
}

export async function executeAnalysisRequest(
  input: ExecuteRequestInput,
  options: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 120_000;
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const response = await (options.fetchImpl ?? fetch)(
      normalizeEndpoint(input.target.apiUrl, input.target.endpointMode),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.target.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify(buildChatPayload({
          model: input.target.model,
          prompt: input.prompt,
          imageDataUrl: input.imageDataUrl,
          ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
          imageTransport: input.target.imageTransport
        }))
      }
    );
    const rawText = await response.text();
    if (!response.ok) {
      throw new AnalysisRequestError(
        "HTTP_ERROR",
        `接口返回 ${response.status}`,
        response.status >= 500 || response.status === 429,
        response.status
      );
    }
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new AnalysisRequestError("INVALID_JSON", "接口返回了无效 JSON", false);
    }
    return parseAnalysisResponse(data);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AnalysisRequestError("TIMEOUT", "模型响应超时", true);
    }
    if (error instanceof AnalysisRequestError) {
      throw error;
    }
    throw new AnalysisRequestError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "网络请求失败",
      true
    );
  } finally {
    clearTimeout(timer);
  }
}
