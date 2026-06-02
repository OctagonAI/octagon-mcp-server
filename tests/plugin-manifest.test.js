import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("plugin manifest exposes the bundled MCP runtime and required config", () => {
  const pluginManifest = readJson(".claude-plugin/plugin.json");
  const mcpConfig = readJson(".claude-plugin/mcp.json");

  assert.equal(pluginManifest.name, "octagon-market-intelligence");
  assert.equal(pluginManifest.mcpServers, "./.claude-plugin/mcp.json");
  assert.ok(!("hooks" in pluginManifest));
  assert.equal(pluginManifest.userConfig.api_key.required, true);
  assert.equal(pluginManifest.userConfig.api_key.sensitive, true);
  assert.equal(
    pluginManifest.userConfig.api_base_url.default,
    "https://api.octagonagents.com/v1",
  );

  assert.deepEqual(mcpConfig.mcpServers["octagon-mcp"], {
    command: "node",
    args: ["${CLAUDE_PLUGIN_ROOT}/dist/plugin-runtime.cjs"],
    env: {
      OCTAGON_API_KEY: "${user_config.api_key}",
      OCTAGON_API_BASE_URL: "${user_config.api_base_url}",
    },
  });
});

test("plugin package publishes Claude plugin assets alongside dist output", () => {
  const packageJson = readJson("package.json");

  for (const requiredEntry of [
    ".claude-plugin",
    "agents",
    "dist",
    "hooks",
    "scripts",
    "skills",
  ]) {
    assert.ok(packageJson.files.includes(requiredEntry));
  }
});

test("skills catalog includes the expected v1 workflows", () => {
  const skillNames = [
    "octagon-analyst-master",
    "analyst-estimates",
    "prediction-markets-analysis",
    "earnings-call-analysis",
    "sec-10k-analysis",
    "stock-quote",
    "octagon-api-smoke-test",
  ];

  for (const skillName of skillNames) {
    const skillPath = path.join(repoRoot, "skills", skillName, "SKILL.md");
    assert.ok(existsSync(skillPath), `${skillName} skill should exist`);
    const skillText = readText(path.join("skills", skillName, "SKILL.md"));
    assert.match(skillText, new RegExp(`name: ${skillName}`));
    assert.match(skillText, /server": "octagon-mcp"/);
  }
});

test("routing agent and session-start hook are wired into the plugin", () => {
  const hooksConfig = readJson("hooks/hooks.json");
  const agentPath = path.join(
    repoRoot,
    "agents",
    "octagon-research-orchestrator.md",
  );
  const hookScriptPath = path.join(repoRoot, "scripts", "plugin-session-start.sh");
  const agentText = readText(path.join("agents", "octagon-research-orchestrator.md"));

  assert.ok(existsSync(agentPath));
  assert.ok(existsSync(hookScriptPath));
  assert.equal(
    hooksConfig.hooks.SessionStart[0].hooks[0].command,
    "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/plugin-session-start.sh",
  );
  assert.match(agentText, /name: octagon-research-orchestrator/);
  assert.match(agentText, /octagon-analyst-master/);
});
