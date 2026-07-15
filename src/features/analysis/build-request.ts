import type { ImageTransport } from "../settings/settings-schema";

interface RequestInput {
  model: string;
  prompt: string;
  imageDataUrl: string;
  sourceUrl?: string;
  imageTransport: ImageTransport;
}

interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export function buildChatPayload(input: RequestInput) {
  const content: ContentPart[] = [{ type: "text", text: input.prompt }];
  const imageUrl = selectImageUrl(input);
  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }
  return {
    model: input.model,
    messages: [{ role: "user" as const, content }],
    temperature: 0.4,
    stream: false
  };
}

function selectImageUrl(input: RequestInput): string {
  if (input.imageTransport === "text_only") {
    return "";
  }
  if (input.imageTransport === "source_url") {
    return input.sourceUrl ?? input.imageDataUrl;
  }
  if (input.imageTransport === "data_url") {
    return input.imageDataUrl;
  }
  return input.imageDataUrl || input.sourceUrl || "";
}
