# Octagon: MCP for Market Data

[![smithery badge](https://smithery.ai/badge/@OctagonAI/octagon-mcp-server)](https://smithery.ai/server/@OctagonAI/octagon-mcp-server)

![Favicon](https://docs.octagonagents.com/logo.svg) The Octagon MCP server provides specialized AI-powered financial research and analysis by integrating with the Octagon Market Intelligence API, enabling users to analyze and extract insights from public filings, earnings calls, financial metrics, private market transactions, and prediction market events within Claude Desktop and other popular MCP clients.

[![Demo](https://docs.octagonagents.com/financial_model_demo_fast.gif)](https://docs.octagonagents.com/financial_model_demo.mp4)

## Tools

✅ `octagon-agent` orchestrates broad market intelligence analysis

- Public market insights (SEC filings, transcripts, financials, stock data)
- Private market insights (companies, funding rounds, deals, debt, investors)

✅ `octagon-deep-research-agent` for comprehensive deep research

- Multi-source synthesis for investment research questions
- Best for up-to-date, cross-source thematic analysis

✅ Prediction market research tooling

- `octagon-prediction-markets-agent` for Kalshi event research reports
- `prediction_markets_history` for structured historical market data retrieval

## Get Your Octagon API Key

To use Octagon MCP, you need to:

1. Sign up for a free account at [Octagon](https://app.octagonai.co/signup/?redirectToAfterSignup=https://app.octagonai.co/api-keys)
2. After logging in, from left menu, navigate to **API Keys**
3. Generate a new API key
4. Use this API key in your configuration as the `OCTAGON_API_KEY` value

## Prerequisites

Before installing or running Octagon MCP, you need to have `npx` (which comes with Node.js and npm) installed on your system.

### Mac (macOS)

1. **Install Homebrew** (if you don't have it):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Install Node.js (includes npm and npx):**

   ```bash
   brew install node
   ```

   This will install the latest version of Node.js, npm, and npx.

3. **Verify installation:**
   ```bash
   node -v
   npm -v
   npx -v
   ```

### Windows

1. **Download the Node.js installer:**
   - Go to [https://nodejs.org/](https://nodejs.org/) and download the LTS version for Windows.
2. **Run the installer** and follow the prompts. This will install Node.js, npm, and npx.
3. **Verify installation:**
   Open Command Prompt and run:
   ```cmd
   node -v
   npm -v
   npx -v
   ```

If you see version numbers for all three, you are ready to proceed with the installation steps below.

## Installation

### Running on Claude Desktop

To configure Octagon MCP for Claude Desktop:

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config
3. Add the following to your `claude_desktop_config.json` (Replace `your-octagon-api-key` with your Octagon API key):

```json
{
  "mcpServers": {
    "octagon-mcp-server": {
      "command": "npx",
      "args": ["-y", "octagon-mcp@latest"],
      "env": {
        "OCTAGON_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

4. Restart Claude for the changes to take effect

### Running on Cursor

Configuring Cursor Desktop 🖥️
Note: Requires Cursor version 0.45.6+

To configure Octagon MCP in Cursor:

1. Open Cursor Settings
2. Go to Features > MCP Servers
3. Click "+ Add New MCP Server"
4. Enter the following:
   - Name: "octagon-mcp" (or your preferred name)
   - Type: "command"
   - Command: `env OCTAGON_API_KEY=your-octagon-api-key npx -y octagon-mcp`

> If you are using Windows and are running into issues, try `cmd /c "set OCTAGON_API_KEY=your-octagon-api-key && npx -y octagon-mcp"`

Replace `your-octagon-api-key` with your Octagon API key.

After adding, refresh the MCP server list to see the new tools. The Composer Agent will automatically use Octagon MCP when appropriate, but you can explicitly request it by describing your investment research needs. Access the Composer via Command+L (Mac), select "Agent" next to the submit button, and enter your query.

### Running with npx

```bash
env OCTAGON_API_KEY=your_octagon_api_key npx -y octagon-mcp
```

### Manual Installation

```bash
npm install -g octagon-mcp
```

## Documentation

For comprehensive documentation on using Octagon agents, please visit our official documentation at:
[https://docs.octagonagents.com](https://docs.octagonagents.com)

The documentation includes:

- Detailed API references
- Agent-specific query guidelines
- Examples and use cases
- Best practices for investment research

For the latest hosted MCP client setup guide, see:

- [Octagon MCP Server Guide](https://docs.octagonagents.com/guide/mcp-server.html)

## Available Tools

The MCP server currently exposes the following tools:

### `octagon-agent`

Orchestrates public and private market intelligence analysis.

**Parameters**

- `prompt` (string, required): natural language research request.
- `conversation` (string, optional): existing Octagon conversation ID to continue a prior `octagon-agent` thread. Omit this on the first turn.
- `threadKey` (string, optional): logical visible chat/thread identifier used for safe automatic conversation reuse when the MCP transport does not provide a stable session id.
- `resetConversation` (boolean, optional): if `true`, clears the stored Octagon thread for the active session/thread anchor before making the request.

**Threaded usage**

`octagon-agent` is the only MCP tool that forwards Octagon conversation threading. The MCP resolves thread state in this order:

1. explicit `conversation`
2. stored conversation for the MCP `sessionId`
3. stored conversation for `threadKey`
4. otherwise no reuse; Octagon starts a fresh conversation

This means you can use any of these patterns:

1. First call: send only `prompt`
2. Read `structuredContent.conversation` from the MCP result
3. Second call: either
   - send the new `prompt` plus that `conversation`, or
   - keep the same MCP session, or
   - send the same `threadKey`

When both `sessionId` and `threadKey` are absent, the MCP does **not** auto-reuse a prior conversation. This avoids cross-chat leakage when the transport has no stable identity anchor.

The MCP result keeps the answer in `content`, and also returns structured metadata for orchestrators in `structuredContent`:

```json
{
  "model": "octagon-agent",
  "text": "Which stock would you like the latest price for?",
  "conversation": "conv_123",
  "responseId": "resp_123",
  "followUp": {
    "required": true,
    "inputTemplate": "<ticker or company name>",
    "instructions": "Reply with just the missing detail and reuse the conversation value from this response."
  }
}
```

Second-turn example:

```json
{
  "prompt": "AAPL",
  "conversation": "conv_123"
}
```

Thread-key example:

```json
{
  "prompt": "AAPL",
  "threadKey": "portfolio-chat-42"
}
```

Explicit refresh example:

```json
{
  "prompt": "Start a fresh Octagon thread for this chat",
  "threadKey": "portfolio-chat-42",
  "resetConversation": true
}
```

Example:

```text
Compare NVIDIA and AMD on latest quarterly revenue growth, margins, and management commentary.
```

More examples:

- "What were Amazon's revenue and net income figures in Q4 2023?"
- "Analyze Tesla's R&D spending trends over the last 3 years."
- "What guidance did NVIDIA's CEO provide regarding AI chip demand in their latest earnings call?"
- "Compare the price-to-earnings, price-to-sales, and EV/EBITDA ratios for the top 5 semiconductor companies."
- "What was Anthropic's latest funding round size, valuation, and key investors?"
- "How many investments did Andreessen Horowitz make in AI startups in the last 12 months?"

### `octagon-deep-research-agent`

Performs comprehensive multi-source deep research and synthesis.

**Parameters**

- `prompt` (string, required): natural language research request.

Example:

```text
Research the impact of lower interest rates on late-stage private software valuations over the next 12 months.
```

More examples:

- "Extract all data fields from zillow.com/san-francisco-ca/"
- "Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins"
- "Retrieve historical Bitcoin price data from 2023 and analyze the price volatility trends"
- "Analyze the competitive dynamics in the EV charging infrastructure market"

### `octagon-prediction-markets-agent`

Generates research reports for Kalshi prediction market events.

**Parameters**

- `prompt` (string, required): natural language research request.
- `cache` (boolean, optional): controls agent variant routing.
  - omitted: `prediction-markets-agent`
  - `false`: `prediction-markets-agent:refresh`
  - `true`: `prediction-markets-agent:cache`

Example:

```text
Generate a report for the Kalshi market https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100
```

### `prediction_markets_history`

Fetches historical data for a prediction market event ticker with optional pagination and time filters.

**Parameters**

- `event_ticker` (string, required)
- `limit` (number, optional)
- `cursor` (string, optional)
- `captured_from` (string, optional)
- `captured_to` (string, optional)
- `include_analysis` (boolean, optional; when true, requests analysis columns)

Example:

```text
Fetch historical data for the Kalshi event https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100
```

## Troubleshooting

1. **API Key Issues**: Ensure your Octagon API key is correctly set in the environment or config file.
2. **Connection Issues**: Make sure the connectivity to the Octagon API is working properly.
3. **Rate Limiting**: If you encounter rate limiting errors, reduce the frequency of your requests.

## License

MIT

## Individual Specialized MCP Servers

While this server provides comprehensive market intelligence combining all our specialized agents, you can also use our individual MCP servers for specific use cases:

### Public Market Data Servers

- **[Octagon SEC Filings MCP](https://github.com/OctagonAI/octagon-sec-filings-mcp)** - Dedicated server for SEC filings analysis
- **[Octagon Earnings Transcripts MCP](https://github.com/OctagonAI/octagon-earnings-transcripts-mcp)** - Specialized for earnings call transcript analysis
- **[Octagon Stock Market Data MCP](https://github.com/OctagonAI/octagon-stock-market-data-mcp)** - Focused on stock market data access
- **[Octagon Financial Statements MCP](https://github.com/OctagonAI/octagon-financial-statements-mcp)** - Financial metrics and ratios analysis
- **[Octagon 13F Holdings MCP](https://github.com/OctagonAI/octagon-13f-holdings-mcp)** - Institutional ownership and Form 13F filings

### Private Market Data Servers

- **[Octagon Private Companies MCP](https://github.com/OctagonAI/octagon-private-companies-mcp)** - Private company research and intelligence
- **[Octagon Investors MCP](https://github.com/OctagonAI/octagon-investors-mcp)** - Investor profiles and investment strategies
- **[Octagon Funding Data MCP](https://github.com/OctagonAI/octagon-funding-data-mcp)** - Startup funding rounds and venture capital data

### Research Tools

- **[Octagon Deep Research MCP](https://github.com/OctagonAI/octagon-deep-research-mcp)** - Comprehensive research and web scraping capabilities

---

⭐ Star this repo if you find it helpful!
