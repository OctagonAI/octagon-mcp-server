---
name: octagon-analyst-master
description: Route broad company, sector, valuation, filings, transcript, and market data questions into the right Octagon workflow. Use when the user wants full-scope investment research or when multiple Octagon skills may be needed.
---

# Octagon Analyst Master

Use this skill for broad investment research requests that span several analyst workflows.

## When to use

- The user wants a full company brief or investment memo
- The request mixes filings, estimates, earnings, valuation, and market data
- It is not obvious which single Octagon skill should be used first

## Routing guide

- Forward estimates and consensus expectations: `analyst-estimates`
- Kalshi market reports or event history: `prediction-markets-analysis`
- Earnings transcript and guidance analysis: `earnings-call-analysis`
- Annual filing and risk review: `sec-10k-analysis`
- Real-time pricing and market snapshot: `stock-quote`

If the request is still broad after routing, use `octagon-agent`.

## Default query pattern

```text
Build an investment analyst brief on <COMPANY OR TICKER> covering business quality, latest performance, guidance, valuation context, and key near-term risks.
```

## MCP call

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Build an investment analyst brief on NVDA covering business quality, latest performance, guidance, valuation context, and key near-term risks."
  }
}
```

## Output expectations

- Start with a short investment takeaway
- Break out the answer by business, financials, expectations, risks, and watch items
- Call out missing context that would improve the next turn

## Follow-up prompts

- "Compare this company to its two closest public peers."
- "Now focus only on valuation and forward expectations."
- "Turn this into a long thesis and a short thesis."
