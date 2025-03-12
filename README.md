# Octagon MCP Server

This is a Model Context Protocol (MCP) server for interacting with the Octagon API, which provides specialized AI agents for investment research of public and private markets.

## Features

- Access to specialized AI agents for investment research
- OpenAI-compatible API for investment intelligence
- Tools for SEC filings, earnings transcripts, financial data, market data, and private market research
- Streaming support for real-time responses
- Simple interface with a single "prompt" parameter for all tools

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env` and add your Octagon API key:
   ```bash
   cp .env.example .env
   ```
4. Build the server:
   ```bash
   npm run build
   ```

## Usage

### Starting the Server

There are several ways to start the server:

```bash
# Option 1: Using npm
npm start

# Option 2: Using the run script
./run-server.sh
```

### Client Examples

The repository includes example clients in the `examples` directory:

- `examples/typescript-client-example.ts` - A TypeScript example for using the MCP server
- `examples/python-client-example.py` - A Python example for using the MCP server

To run the TypeScript example:
```bash
# Build the server first
npm run build

# Option 1: Compile and run the example
tsc --esm examples/typescript-client-example.ts
node examples/typescript-client-example.js

# Option 2: Or use ts-node with ESM support
npx ts-node --esm examples/typescript-client-example.ts
```

To run the Python example:
```bash
# Install the MCP Python client first
pip install model-context-protocol
# Then run the example
python examples/python-client-example.py
```

### Connecting to Claude Desktop

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config
3. Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "octagon": {
      "command": "node",
      "args": ["/path/to/octagon-mcp-server/build/index.js"]
    }
  }
}
```

4. Restart Claude Desktop

## Available Tools

Each tool uses a single `prompt` parameter that accepts a natural language query. Include all relevant details in your prompt (e.g., company name, time period, etc.).

The server provides the following tools:

- `octagon-sec-agent`: Extract information from SEC filings
- `octagon-transcripts-agent`: Analyze earnings call transcripts
- `octagon-financials-agent`: Retrieve financial metrics and ratios
- `octagon-stock-data-agent`: Access stock market data
- `octagon-companies-agent`: Research private company information
- `octagon-scraper-agent`: Extract data from any public website
- `octagon-deep-research-agent`: Perform comprehensive research on any topic
- `octagon-funding-agent`: Research startup funding rounds
- `octagon-deals-agent`: Research M&A and IPO transactions

## License

MIT 