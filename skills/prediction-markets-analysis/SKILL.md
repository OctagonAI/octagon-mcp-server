---
name: prediction-markets-analysis
description: Generate Kalshi prediction market research reports or fetch structured event history. Use when the user mentions Kalshi, prediction markets, market probability, expected return, or event history.
---

# Prediction Markets Analysis

Use this skill for Kalshi event research and historical prediction market analysis.

## When to use

- The user shares a Kalshi market URL
- The user wants a structured report on one prediction market event
- The user wants event history across snapshots or runs

## Query format

```text
Generate a report for the Kalshi market <KALSHI_URL>.
```

For structured history retrieval:

```text
Fetch historical data for the Kalshi event ticker <EVENT_TICKER>.
```

## MCP calls

Report generation:

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-prediction-markets-agent",
  "arguments": {
    "prompt": "Generate a report for the Kalshi market https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100"
  }
}
```

Structured history:

```json
{
  "server": "octagon-mcp",
  "toolName": "prediction_markets_history",
  "arguments": {
    "event_ticker": "KXBTCY-27JAN0100",
    "limit": 50,
    "include_analysis": true
  }
}
```

## Tool selection rules

- Use `octagon-prediction-markets-agent` for analyst-style reports
- Use `prediction_markets_history` for structured history, pagination, or time filtering
- If the user wants guaranteed fresh data, set `cache` to `false`

## Output expectations

- Compare model probability to market probability
- Highlight edge, expected return, and risk factors
- Surface missing Kalshi URL immediately when absent

## Follow-up prompts

- "Refresh the report instead of using cache."
- "Show the event history with analysis included."
- "Summarize the largest drivers of divergence between model and market."
