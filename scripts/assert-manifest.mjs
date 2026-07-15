import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(".output/chrome-mv3/manifest.json", "utf8")
);

assert.deepEqual(
  [...manifest.permissions].sort(),
  ["activeTab", "contextMenus", "scripting", "storage"].sort(),
  "Production permissions changed unexpectedly"
);
assert.ok(
  !(manifest.host_permissions ?? []).includes("<all_urls>"),
  "Production manifest must not request <all_urls>"
);
assert.deepEqual(
  [...manifest.optional_host_permissions].sort(),
  ["http://*/*", "https://*/*"].sort(),
  "Optional host permissions changed unexpectedly"
);
assert.ok(manifest.options_ui?.page === "options.html", "Options page is missing");

console.log("Manifest permission assertion passed");
