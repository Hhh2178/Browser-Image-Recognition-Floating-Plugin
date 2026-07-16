import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const releaseMode = process.argv.includes("--release");

const requiredProjectPaths = [
  "AGENTS.md",
  "README.md",
  "docs/INDEX.md",
  "docs/governance/README.md",
  "docs/governance/root-entry-responsibility-matrix.md",
  "docs/governance/engineering-guardrails.md",
  "docs/governance/release-version-policy.md",
  "docs/systems/README.md",
  "docs/systems/harness/README.md",
  "docs/systems/extension/README.md",
  "docs/systems/workbench/frontend-design/design-tokens.md",
  "docs/systems/workbench/frontend-design/visual-component-registry.md",
  "docs/systems/workbench/frontend-design/functional-component-registry.md",
  "docs/logbooks/daily",
  "docs/logbooks/releases",
  "docs/logbooks/validations",
];

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

const failures = [];

function assertPath(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`Missing required harness path: ${relativePath}`);
  }
}

function assertIncludes(relativePath, expectedText) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Cannot inspect missing file: ${relativePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes(expectedText)) {
    failures.push(`Expected ${relativePath} to include: ${expectedText}`);
  }
}

function assertScript(name) {
  if (!packageJson.scripts?.[name]) {
    failures.push(`Missing package script: ${name}`);
  }
}

for (const relativePath of requiredProjectPaths) {
  assertPath(relativePath);
}

assertScript("harness:verify:project");
assertScript("harness:verify:release");
assertIncludes("AGENTS.md", "First Reading Order");
assertIncludes("docs/INDEX.md", "Source Of Truth");
assertIncludes("docs/systems/harness/README.md", "harness:verify:project");
assertIncludes(
  "docs/systems/workbench/frontend-design/design-tokens.md",
  "shell.width.min",
);

if (releaseMode) {
  const version = packageJson.version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    failures.push(`package.json version is not semver: ${version}`);
  }

  const releaseLog = `docs/logbooks/releases/v${version}.md`;
  assertPath(releaseLog);
  assertIncludes(releaseLog, `Release v${version}`);
  assertIncludes("docs/governance/release-version-policy.md", "Release Flow");
}

if (failures.length > 0) {
  console.error("Harness verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  releaseMode
    ? `Harness release verification passed for v${packageJson.version}.`
    : "Harness project verification passed.",
);
