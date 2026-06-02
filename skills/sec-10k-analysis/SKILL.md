---
name: sec-10k-analysis
description: Analyze 10-K annual filings to extract business model, financial priorities, risk factors, segments, and notable changes. Use when the user asks about 10-Ks, annual filings, SEC risk factors, or filing-based due diligence.
---

# SEC 10-K Analysis

Use this skill for annual filing due diligence and risk review.

## Query format

```text
Analyze the latest 10-K for <COMPANY OR TICKER> and summarize the business model, key risks, segment performance, and material changes versus the prior year.
```

## MCP call

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Analyze the latest 10-K for MSFT and summarize the business model, key risks, segment performance, and material changes versus the prior year."
  }
}
```

## Output expectations

- Start with a short business overview
- Pull out the most material risks instead of listing everything
- Highlight reporting segments, capital allocation, and accounting watch items
- Compare important changes to the prior annual filing when evidence is available

## Follow-up prompts

- "Expand only the risk factors section."
- "Compare the current 10-K to last year's filing."
- "Extract segment performance and margin commentary."
