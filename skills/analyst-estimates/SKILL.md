---
name: analyst-estimates
description: Retrieve analyst financial estimates including revenue and EPS projections with ranges and coverage. Use when analyzing forward expectations, consensus assumptions, or valuation inputs for a public company.
---

# Analyst Estimates

Retrieve analyst revenue and EPS expectations for a public company using Octagon MCP.

## Query format

```text
Retrieve analyst financial estimates for <TICKER> for the annual period, limited to <N> records on page 0.
```

## MCP call

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Retrieve analyst financial estimates for AAPL for the annual period, limited to 10 records on page 0."
  }
}
```

## Output expectations

- Return a table of future periods with revenue and EPS ranges, averages, and analyst coverage
- After the table, summarize growth trajectory, estimate dispersion, and coverage quality

## Analysis heuristics

- Implied growth: compare future estimates to current actuals
- Dispersion: wider ranges imply lower conviction
- Coverage depth: more analysts usually means a stronger consensus
- Near-term vs long-term: confidence should fall as periods move further out

## Follow-up prompts

- "Compare these estimates to the last three years of actual results."
- "Calculate the implied forward P/E using the consensus EPS."
- "What could drive upside or downside versus the consensus?"
