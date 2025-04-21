# Octagon: MCP for Market Data 


![Favicon](https://docs.octagonagents.com/logo.svg) This Model Context Protocol (MCP) server provides specialized AI-powered financial research and analysis by integrating with the Octagon Market Intelligence API, enabling users to easily analyze and extract detailed insights from public filings, earnings call transcripts, financial metrics, stock market data, and extensive private market transactions.

[![Demo](https://docs.octagonagents.com/financial_model_demo_fast.gif)](https://docs.octagonagents.com/financial_model_demo.mp4)

Install Octagon MCP for Claude in one step:
```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client claude
```

## Features

✅ Specialized AI agents for **public market data**
   - SEC filings analysis and data extraction (8000+ public companies 10-K, 10-Q, 8-K, 20-F, S-1)
   - Earnings call transcript analysis (10 yrs of historical and current)
   - Financial metrics and ratios analysis (10 yrs of historical and current)
   - Stock market data access (over 10,000 active tickers, daily historical and current)
     
✅ Specialized AI agents for **private market data**
   - Private company research (3M+ companies)
   - Funding rounds and venture capital research (500k+ deals)
   - M&A and IPO transaction research (2M+ deals)
   - Debt transactions research (1M+ deals)
     
✅ Specialized AI agents for **deep research**
   - Web scraping capabilities (json, csv, python scripts)
   - Comprehensive deep research tools

## Client Installation Instructions

#### Running on Claude Desktop

To configure Octagon MCP for Claude Desktop:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client claude
```

#### Running on Cursor

To configure Octagon MCP in Cursor:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client cursor
```

#### Running on VSCode

To configure Octagon MCP for VSCode:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client vscode
```

#### Running on VSCode Insiders

To configure Octagon MCP for VSCode Insiders:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client vscode-insiders
```

#### Running on Windsurf

To configure Octagon MCP for Windsurf:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client windsurf
```

#### Running on Roocode

To configure Octagon MCP for Roocode:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client roocode
```

#### Running on Witsy

To configure Octagon MCP for Witsy:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client witsy
```

#### Running on Enconvo

To configure Octagon MCP for Enconvo:

```bash
npx -y @smithery/cli@latest install @OctagonAI/octagon-mcp-server --client enconvo
```

## Getting an API Key

To use Octagon MCP, you need to:

1. Sign up for a free account at [Octagon](https://app.octagonai.co/signup)
2. After logging in, from left menu, navigate to **API Keys** 
3. Generate a new API key
4. Use this API key in your configuration as the `OCTAGON_API_KEY` value


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

## Troubleshooting

1. **API Key Issues**: Ensure your Octagon API key is correctly set in the environment or config file.
2. **Connection Issues**: Make sure the connectivity to the Octagon API is working properly.
3. **Rate Limiting**: If you encounter rate limiting errors, reduce the frequency of your requests.

## Installation

### Running with npx

```bash
env OCTAGON_API_KEY=your_octagon_api_key npx -y octagon-mcp
```

### Manual Installation

```bash
npm install -g octagon-mcp
```

## License

MIT 

👉 "⭐ Star this repo if you find it helpful!"
