---
name: earnings-call-analysis
description: Analyze earnings call transcripts for guidance, management commentary, analyst concerns, and strategic signals. Use when the user asks about earnings calls, transcript takeaways, management tone, or future guidance.
---

# Earnings Call Analysis

Use this skill to extract the most important insights from recent earnings calls.

## Query format

```text
Analyze the latest earnings call for <COMPANY OR TICKER> and summarize guidance, management commentary, analyst concerns, and strategic takeaways.
```

## MCP call

```json
{
  "server": "octagon-mcp",
  "toolName": "octagon-agent",
  "arguments": {
    "prompt": "Analyze the latest earnings call for AMZN and summarize guidance, management commentary, analyst concerns, and strategic takeaways."
  }
}
```

## Output expectations

- Separate prepared remarks from Q&A when possible
- Quote or paraphrase management guidance clearly
- Identify repeat themes, risk signals, and what changed from prior calls
- End with the top issues to monitor into the next quarter

## Follow-up prompts

- "Focus only on revenue guidance and margin commentary."
- "What did analysts press management on during Q&A?"
- "Compare this call to the prior quarter's transcript."
