# Octagon: MCP for Market Data 
[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/OctagonAI/octagon-mcp-server)](https://archestra.ai/mcp-catalog/octagonai__octagon-mcp-server)

[![smithery badge](https://smithery.ai/badge/@OctagonAI/octagon-mcp-server)](https://smithery.ai/server/@OctagonAI/octagon-mcp-server)

![Favicon](https://docs.octagonagents.com/logo.svg) The Octagon MCP server provides specialized AI-powered financial research and analysis by integrating with the Octagon Market Intelligence API, enabling users to easily analyze and extract detailed insights from public filings, earnings call transcripts, financial metrics, stock market data, and extensive private market transactions within Claude Desktop and other popular MCP clients.

[![Demo](https://docs.octagonagents.com/financial_model_demo_fast.gif)](https://docs.octagonagents.com/financial_model_demo.mp4)

## Features

✅ **Comprehensive Market Intelligence** - Orchestrates multiple specialized agents for complete market analysis
   - SEC filings analysis and data extraction (8000+ public companies 10-K, 10-Q, 8-K, 20-F, S-1)
   - Earnings call transcript analysis (10 yrs of historical and current)
   - Financial metrics and ratios analysis (10 yrs of historical and current)
   - Stock market data access (over 10,000 active tickers, daily historical and current)
   - Private company research (3M+ companies)
   - Funding rounds and venture capital research (500k+ deals)
   - M&A and IPO transaction research (2M+ deals)
   - Institutional holdings and Form 13F filings
   - Cryptocurrency market data and analysis
     
✅ **Deep Research Capabilities** - Comprehensive research tools that can aggregate information from multiple sources
   
✅ **Web Scraping** - Extract structured data from any public website (json, csv, python scripts)

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

### Running on Windsurf

Add this to your `./codeium/windsurf/model_config.json`:

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

## Available Tools

Each tool uses a single `prompt` parameter that accepts a natural language query. Include all relevant details in your prompt.

### octagon-agent
**[COMPREHENSIVE MARKET INTELLIGENCE]** Orchestrates all agents for comprehensive market intelligence analysis. Combines insights from SEC filings, earnings calls, financial metrics, stock data, institutional holdings, private company research, funding analysis, M&A transactions, investor intelligence, and debt analysis.

**Best for:** Complex research requiring multiple data sources and comprehensive analysis across public and private markets.

**Example queries:**
```
Retrieve year-over-year growth in key income-statement items for AAPL, limited to 5 records and filtered by period FY
Analyze the latest 10-K filing for AAPL and extract key financial metrics and risk factors
Retrieve the daily closing prices for AAPL over the last 30 days
Analyze AAPL's latest earnings call transcript and extract key insights about future guidance
Provide a comprehensive overview of Stripe, including its business model and key metrics
Retrieve the funding history for Stripe, including all rounds and investors
Compare the financial performance of Tesla, Ford, and GM over the last 3 years
What was Microsoft's acquisition of GitHub valued at and what were the strategic reasons?
Analyze institutional ownership changes for NVIDIA over the past 6 months
```

### octagon-scraper-agent
**[PUBLIC & PRIVATE MARKET INTELLIGENCE]** Specialized agent for financial data extraction from investor websites. Extract structured financial data from investor relations websites, tables, and online financial sources.

**Best for:** Gathering financial data from websites that don't have accessible APIs.

**Example queries:**
```
Extract all data fields from zillow.com/san-francisco-ca/
Extract all data fields from www.carvana.com/cars/
Extract financial metrics from tesla.com/investor-relations
Extract pricing data from salesforce.com/products/platform/pricing/
```

### octagon-deep-research-agent
**[PUBLIC & PRIVATE MARKET INTELLIGENCE]** A comprehensive agent that can utilize multiple sources for deep research analysis. Aggregate research across multiple data sources, synthesize information, and provide comprehensive investment research.

**Best for:** Investment research questions requiring up-to-date aggregated information from the web.

**Example queries:**
```
Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins
Analyze the competitive landscape in the cloud computing sector, focusing on AWS, Azure, and Google Cloud margin and growth trends
Investigate the factors driving electric vehicle adoption and their impact on battery supplier financials
Research the impact of AI adoption on semiconductor demand and pricing trends
Analyze the regulatory environment for cryptocurrency and its impact on crypto exchange valuations
```

## Example Queries

1. "What were Amazon's revenue and net income figures in Q4 2023?"
2. "Analyze Tesla's R&D spending trends over the last 3 years."
3. "What guidance did NVIDIA's CEO provide regarding AI chip demand in their latest earnings call?"
4. "Compare the price-to-earnings, price-to-sales, and EV/EBITDA ratios for the top 5 semiconductor companies."
5. "What was Anthropic's latest funding round size, valuation, and key investors?"
6. "Extract all data fields from zillow.com/san-francisco-ca/"
7. "Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins"
8. "How many investments did Andreessen Horowitz make in AI startups in the last 12 months?"
9. "Retrieve historical Bitcoin price data from 2023 and analyze the price volatility trends"
10. "Analyze the competitive dynamics in the EV charging infrastructure market"

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
