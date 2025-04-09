# Octagon: MCP For Market Intelligence

A Model Context Protocol (MCP) server implementation that integrates with Octagon Market Intelligence API.

## Features

✅ Specialized AI agents for public market intelligence
   - SEC filings analysis and data extraction
   - Earnings call transcript analysis
   - Financial metrics and ratios analysis
   - Stock market data access
✅ Specialized AI agents for private market intelligence
   - Private company research
   - Funding rounds and venture capital research
   - M&A and IPO transaction research
   - Debt transactions research
✅ Deep Research
   - Web scraping capabilities
   - Comprehensive research tools

## Getting an API Key

To use Octagon MCP, you need to:

1. Sign up for a free account at [Octagon](https://app.octagonai.co/signup)
2. After logging in, navigate to **Settings → API Keys** 
3. Generate a new API key
4. Use this API key in your configuration as the `OCTAGON_API_KEY` value

## Installation

### Running with npx

```bash
env OCTAGON_API_KEY=your_octagon_api_key npx -y octagon-mcp
```

### Manual Installation

```bash
npm install -g octagon-mcp
```

### Running on Cursor

Configuring Cursor 🖥️
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

### Running on Claude Desktop

To configure Octagon MCP for Claude Desktop:

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config
3. Add the following to your `claude_desktop_config.json` (Replace `your-octagon-api-key` with your Octagon API key):
```json
{
  "mcpServers": {
    "octagon": {
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


### Running on Windsurf

Add this to your `./codeium/windsurf/model_config.json`:

```json
{
  "mcpServers": {
    "octagon": {
      "command": "npx",
      "args": ["-y", "octagon-mcp@latest"],
      "env": {
        "OCTAGON_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

## Documentation

For comprehensive documentation on using Octagon agents, please visit our official documentation at:
[https://docs.octagonagents.com](https://docs.octagonagents.com)

The documentation includes:
- Detailed API references
- Agent-specific query guidelines
- Examples and use cases
- Best practices for investment research

## Configuration

### Environment Variables

#### Required

- `OCTAGON_API_KEY`: Your Octagon API key
  - Required for all operations
  - Sign up at [Octagon](https://octagonagents.com) if you don't have an API key

## Available Tools

Each tool uses a single `prompt` parameter that accepts a natural language query. Include all relevant details in your prompt.

### Public Market Intelligence

#### octagon-sec-agent
Extract information from SEC filings.

Example:
```
What was Apple's gross margin percentage from their latest 10-Q filing?
```

#### octagon-transcripts-agent
Analyze earnings call transcripts.

Example:
```
What did NVIDIA's CEO say about AI chip demand in their latest earnings call?
```

#### octagon-financials-agent
Retrieve financial metrics and ratios.

Example:
```
Calculate the price-to-earnings ratio for Tesla over the last 4 quarters
```

#### octagon-stock-data-agent
Access stock market data.

Example:
```
How has Apple's stock performed compared to the S&P 500 over the last 6 months?
```

### Private Market Intelligence

#### octagon-companies-agent
Research private company information.

Example:
```
What is the employee count and funding history for Anthropic?
```

#### octagon-funding-agent
Research startup funding rounds and venture capital.

Example:
```
What was OpenAI's latest funding round size, valuation, and key investors?
```

#### octagon-deals-agent
Research M&A and IPO transactions.

Example:
```
What was the acquisition price when Microsoft acquired GitHub?
```

#### octagon-investors-agent
A specialized database agent for looking up information on investors.

Example:
```
What is the latest investment criteria of Insight Partners?
```

#### octagon-debts-agent
A specialized database agent for analyzing private debts, borrowers, and lenders.

Example:
```
List all the debt activities from borrower American Tower
```

### Additional Tools

#### octagon-scraper-agent
Extract data from any public website.

Example:
```
Extract property prices and square footage data from zillow.com/san-francisco-ca/
```

#### octagon-deep-research-agent
Perform comprehensive research on any topic.

Example:
```
Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins
```

## Example Queries

1. "What were Amazon's revenue and net income figures in Q4 2023?"
2. "Analyze Tesla's R&D spending trends over the last 3 years."
3. "What guidance did NVIDIA's CEO provide regarding AI chip demand in their latest earnings call?"
4. "Compare the price-to-earnings, price-to-sales, and EV/EBITDA ratios for the top 5 semiconductor companies."
5. "What was Anthropic's latest funding round size, valuation, and key investors?"
6. "Extract all data fields from zillow.com/san-francisco-ca/"
7. "Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins"
8. "Compile all the debt activities from lender ING Group in Q4 2024"
9. "How many investments did Andreessen Horowitz make in AI startups in the last 12 months?"

## Demo
👉 [Check out the live demo] (https://docs.octagonagents.com/octagon_demo_video.html)

## Troubleshooting

1. **API Key Issues**: Ensure your Octagon API key is correctly set in the environment or config file.
2. **Connection Issues**: Make sure the connectivity to the Octagon API is working properly.
3. **Rate Limiting**: If you encounter rate limiting errors, reduce the frequency of your requests.

## License

MIT 
