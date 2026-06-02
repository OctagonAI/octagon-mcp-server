---
name: stock-quote
description: Retrieve a current stock quote and market snapshot with price, range, volume, and moving-average context. Use when the user asks for the latest stock price, quote, intraday range, or a quick market snapshot.
---

# Stock Quote

Use this skill for quick public-market snapshot requests.

## Query format

```text
Retrieve the latest stock quote for <TICKER> including current price, volume, day range, 52-week range, and moving-average context.
```

## MCP call

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Retrieve the latest stock quote for NVDA including current price, volume, day range, 52-week range, and moving-average context."
  }
}
```

## Output expectations

- Keep the first answer brief and numeric
- Call out whether the stock is near the high, low, or midpoint of its recent range
- Mention unusual volume or trend context if present

## Follow-up prompts

- "Compare that quote to the last month of price action."
- "Show the same market snapshot for AMD and AVGO."
- "Now explain what is driving the move."
