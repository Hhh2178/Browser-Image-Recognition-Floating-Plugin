import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BUILTIN_PROMPTS } from "./builtins";
import { PromptManager } from "./PromptManager";

it("duplicates a builtin before editing", () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <PromptManager
      prompts={[BUILTIN_PROMPTS[0]!]}
      onSave={save}
      onDelete={vi.fn()}
      onImport={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "复制模板" }));

  expect(save).toHaveBeenCalledWith(expect.objectContaining({
    source: "custom",
    name: "通用图片反推 副本"
  }));
});
