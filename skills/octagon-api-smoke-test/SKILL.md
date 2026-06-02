---
name: octagon-api-smoke-test
description: Validate Octagon plugin configuration and run a lightweight smoke test across the main Octagon MCP workflows. Use when checking whether the plugin is configured correctly, debugging auth, or verifying tool availability.
---

# Octagon API Smoke Test

Use this skill to confirm that the Claude plugin and Octagon MCP are configured correctly.

## Smoke test sequence

1. Run a simple `octagon-agent` request
2. Run a simple `octagon-deep-research-agent` request
3. If a Kalshi URL is available, run `octagon-prediction-markets-agent`
4. If an event ticker is available, run `prediction_markets_history`

## MCP calls

General agent:

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Give me a one-sentence summary of Apple's latest quarter."
  }
}
```

Deep research:

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-deep-research-agent",
  "arguments": {
    "prompt": "Research the current AI infrastructure spending cycle in one short paragraph."
  }
}
```

## Failure triage

- Missing auth or invalid key: check plugin `api_key`
- Unexpected environment or staging issue: check `api_base_url`
- Prediction market failures mentioning Kalshi URL: supply a valid Kalshi market URL
- Credit or entitlement failures: report the exact error and stop

## Success criteria

- At least one Octagon tool returns usable text
- Tool failures, if any, are classified clearly as config, entitlement, input, or service issues
