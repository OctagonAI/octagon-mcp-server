# Using the Octagon MCP Server

This document provides detailed instructions on how to use the Octagon MCP Server for investment research.

## Prerequisites

1. An Octagon API key (sign up at [Octagon](https://octagonagents.com))
2. Node.js and npm installed
3. Claude Desktop (for MCP integration) or another MCP client

## Setup

1. Install dependencies and build the server:
   ```bash
   ./install.sh
   ```

2. Edit the `.env` file and add your Octagon API key:
   ```
   OCTAGON_API_KEY=your_octagon_api_key_here
   ```

3. Start the server (for testing):
   ```bash
   npm start
   ```

## Integration with Claude Desktop

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config
3. Add the following to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "octagon": {
         "command": "node",
         "args": ["/absolute/path/to/octagon-mcp-server/build/index.js"]
       }
     }
   }
   ```
4. Restart Claude Desktop
5. You should now see the Octagon tools available in Claude Desktop

## Available Tools

All tools use a single `prompt` parameter. Include all relevant details in your natural language prompt.

### Public Market Intelligence

#### 1. octagon-sec-agent
Extract information from SEC filings.

**Parameter:**
- `prompt`: Your query about SEC filings (include company name, filing type, and time period in your prompt)

**Example:**
```
What was Apple's gross margin percentage from their latest 10-Q filing?
```

#### 2. octagon-transcripts-agent
Analyze earnings call transcripts.

**Parameter:**
- `prompt`: Your query about earnings call transcripts (include company name and quarter in your prompt)

**Example:**
```
What did NVIDIA's CEO say about AI chip demand in their latest earnings call?
```

#### 3. octagon-financials-agent
Retrieve financial metrics and ratios.

**Parameter:**
- `prompt`: Your query about financial data and metrics (include company name and time period in your prompt)

**Example:**
```
Calculate the price-to-earnings ratio for Tesla over the last 4 quarters
```

#### 4. octagon-stock-data-agent
Access stock market data.

**Parameter:**
- `prompt`: Your query about stock market data (include company name and time period in your prompt)

**Example:**
```
How has Apple's stock performed compared to the S&P 500 over the last 6 months?
```

### Private Market Intelligence

#### 5. octagon-companies-agent
Research private company information.

**Parameter:**
- `prompt`: Your query about a private company (make sure to include the company name in your prompt)

**Example:**
```
What is the employee count and funding history for Anthropic?
```

#### 6. octagon-funding-agent
Research startup funding rounds and venture capital.

**Parameter:**
- `prompt`: Your query about startup funding information (include company name in your prompt if relevant)

**Example:**
```
What was OpenAI's latest funding round size, valuation, and key investors?
```

#### 7. octagon-deals-agent
Research M&A and IPO transactions.

**Parameter:**
- `prompt`: Your query about M&A or IPO transactions (include company name in your prompt if relevant)

**Example:**
```
What was the acquisition price when Microsoft acquired GitHub?
```

### Additional Tools

#### 8. octagon-scraper-agent
Extract data from any public website.

**Parameter:**
- `prompt`: Your query including the URL to scrape and what information to extract (format: "Extract [information] from [URL]")

**Example:**
```
Extract property prices and square footage data from zillow.com/san-francisco-ca/
```

#### 9. octagon-deep-research-agent
Perform comprehensive research on any topic.

**Parameter:**
- `prompt`: Your research question or topic to investigate in detail

**Example:**
```
Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins
```

## Example Queries for Claude

Here are some example queries you can use with Claude Desktop:

1. "What were Amazon's revenue and net income figures in Q4 2023?"
2. "Analyze Tesla's R&D spending trends over the last 3 years."
3. "What guidance did NVIDIA's CEO provide regarding AI chip demand in their latest earnings call?"
4. "Compare the price-to-earnings, price-to-sales, and EV/EBITDA ratios for the top 5 semiconductor companies."
5. "What was Anthropic's latest funding round size, valuation, and key investors?"
6. "Extract all data fields from zillow.com/san-francisco-ca/"
7. "Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins"

## Troubleshooting

1. **API Key Issues**: Ensure your Octagon API key is correctly set in the `.env` file.
2. **Connection Issues**: Make sure the path in your `claude_desktop_config.json` is correct and absolute.
3. **Streaming Errors**: Octagon requires streaming for all agent requests. This is handled automatically by the MCP server.
4. **Rate Limiting**: If you encounter rate limiting errors, reduce the frequency of your requests.

## Additional Resources

- [Octagon API Documentation](https://octagonagents.com/docs)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Claude Desktop Documentation](https://claude.ai/docs) 