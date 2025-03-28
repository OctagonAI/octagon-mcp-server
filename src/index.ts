#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

// Check for required environment variables
const OCTAGON_API_KEY = process.env.OCTAGON_API_KEY;
const OCTAGON_API_BASE_URL = process.env.OCTAGON_API_BASE_URL || "https://api.octagonagents.com/v1";

if (!OCTAGON_API_KEY) {
  console.error("Error: OCTAGON_API_KEY is not set in the environment variables");
  console.error("Please set the OCTAGON_API_KEY environment variable or use 'env OCTAGON_API_KEY=your_key npx -y octagon-mcp'");
  process.exit(1);
}

// Initialize OpenAI client with Octagon API
const octagonClient = new OpenAI({
  apiKey: OCTAGON_API_KEY,
  baseURL: OCTAGON_API_BASE_URL,
});

// Create MCP server
const server = new McpServer({
  name: "octagon-investment-research",
  version: "1.0.0",
});

// Helper function to process streaming responses
async function processStreamingResponse(stream: any): Promise<string> {
  let fullResponse = "";
  let citations: any[] = [];

  try {
    // Process the streaming response
    for await (const chunk of stream) {
      // For Chat Completions API
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
        
        // Check for citations in the final chunk
        if (chunk.choices[0]?.finish_reason === "stop" && chunk.choices[0]?.citations) {
          citations = chunk.choices[0].citations;
        }
      }
      
      // For Responses API
      if (chunk.type === "response.output_text.delta") {
        fullResponse += chunk.text?.delta || "";
      }
    }
    
    // If citations are available, append them to the response
    if (citations && citations.length > 0) {
      fullResponse += "\n\nSOURCES:";
      citations.forEach(citation => {
        fullResponse += `\n${citation.order}. ${citation.name}: ${citation.url}`;
      });
    }
    
    return fullResponse;
  } catch (error) {
    console.error("Error processing streaming response:", error);
    throw error;
  }
}

// Define a schema for the 'prompt' parameter that all tools will use
const promptSchema = z.object({
  prompt: z.string().describe("Your natural language query or request for the agent"),
});

type PromptParams = {
  prompt: string;
};

// Register a tool for each Octagon agent
// SEC Filings Agent
server.tool(
  "octagon-sec-agent",
  "[PUBLIC MARKET INTELLIGENCE] A specialized agent for SEC filings analysis and financial data extraction. Covers over 8,000 public companies from SEC EDGAR with comprehensive coverage of financial statements from annual and quarterly reports (10-K, 10-Q, 20-F), offering filings (S-1), amendments, and event filings (8-K). Updated daily with historical data dating back to 2018 for time-series analysis. Best for extracting financial and segment metrics, management discussion, footnotes, risk factors, and quantitative data from SEC filings. Example queries: 'What was Apple's R&D expense as a percentage of revenue in their latest fiscal year?', 'Find the risk factors related to supply chain in Tesla's latest 10-K', 'Extract quarterly revenue growth rates for Microsoft over the past 2 years'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-sec-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling SEC agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process SEC filings query. ${error}`,
          },
        ],
      };
    }
  }
);

// Earnings Call Transcripts Agent
server.tool(
  "octagon-transcripts-agent",
  "[PUBLIC MARKET INTELLIGENCE] A specialized agent for analyzing earnings call transcripts and management commentary. Covers over 8,000 public companies with continuous daily updates for real-time insights. Historical data dating back to 2018 enables robust time-series analysis. Extract information from earnings call transcripts, including executive statements, financial guidance, analyst questions, and forward-looking statements. Best for analyzing management sentiment, extracting guidance figures, and identifying key business trends. Example queries: 'What did Amazon's CEO say about AWS growth expectations in the latest earnings call?', 'Summarize key financial metrics mentioned in Tesla's Q2 2023 earnings call', 'What questions did analysts ask about margins during Netflix's latest earnings call?'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-transcripts-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Transcripts agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process earnings call transcript query. ${error}`,
          },
        ],
      };
    }
  }
);

// Financial Data Agent
server.tool(
  "octagon-financials-agent",
  "[PUBLIC MARKET INTELLIGENCE] Specialized agent for financial statement analysis and ratio calculations. Capabilities: Analyze financial statements, calculate financial metrics, compare ratios, and evaluate performance indicators. Best for: Deep financial analysis and comparison of company financial performance. Example queries: 'Compare the gross margins, operating margins, and net margins of Apple, Microsoft, and Google over the last 3 years', 'Analyze Tesla's cash flow statements from 2021 to 2023 and calculate free cash flow trends', 'Calculate and explain key financial ratios for Amazon including P/E, EV/EBITDA, and ROIC'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-financials-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Financials agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process financial data query. ${error}`,
          },
        ],
      };
    }
  }
);

// Stock Market Data Agent
server.tool(
  "octagon-stock-data-agent",
  "[PUBLIC MARKET INTELLIGENCE] Specialized agent for stock market data and equity investment analysis. Capabilities: Analyze stock price movements, trading volumes, market trends, valuation metrics, and technical indicators. Best for: Stock market research, equity analysis, and trading pattern identification. Example queries: 'How has Apple's stock performed compared to the S&P 500 over the last 6 months?', 'Analyze the trading volume patterns for Tesla stock before and after earnings releases', 'What were the major price movements for NVIDIA in 2023 and what were the catalysts?'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-stock-data-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Stock Data agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process stock market data query. ${error}`,
          },
        ],
      };
    }
  }
);

// Private Companies Agent
server.tool(
  "octagon-companies-agent",
  "[PRIVATE MARKET INTELLIGENCE] A specialized database agent for looking up company information and financials. Capabilities: Query comprehensive company financial information and business intelligence from Octagon's company database. Best for: Finding basic information about companies, their financial metrics, and industry benchmarks. NOTE: For better and more accurate results, provide the company's website URL instead of just the company name. Example queries: 'What is the employee trends for Stripe (stripe.com)?', 'List the top 5 companies in the AI sector by revenue growth', 'Who are the top competitors to Databricks (databricks.com)?'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-companies-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Companies agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process private company query. ${error}`,
          },
        ],
      };
    }
  }
);

// Funding Agent
server.tool(
  "octagon-funding-agent",
  "[PRIVATE MARKET INTELLIGENCE] A specialized database agent for company funding transactions and venture capital research. Capabilities: Extract information about funding rounds, investors, valuations, and investment trends. Best for: Researching startup funding history, investor activity, and venture capital patterns. NOTE: For better and more accurate results, provide the company's website URL instead of just the company name. Example queries: 'What was Anthropic's latest funding round size, valuation, and key investors (anthropic.com)?', 'How much has OpenAI raised in total funding and at what valuation (openai.com)?', 'Who were the lead investors in Databricks' Series G round and what was the post-money valuation (databricks.com)?'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-funding-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Funding agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process funding data query. ${error}`,
          },
        ],
      };
    }
  }
);

// M&A and IPO Deals Agent
server.tool(
  "octagon-deals-agent",
  "[PRIVATE MARKET INTELLIGENCE] A specialized database agent for M&A and IPO transaction analysis. Capabilities: Retrieve information about mergers, acquisitions, initial public offerings, and other financial transactions. Best for: Research on corporate transactions, IPO valuations, and M&A activity. NOTE: For better and more accurate results, provide the company's website URL instead of just the company name. Example queries: 'What was the acquisition price when Microsoft (microsoft.com) acquired GitHub (github.com)?', 'List the valuation multiples for AI companies in 2024', 'List all the acquisitions and price, valuation by Salesforce (salesforce.com) in 2023?'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-deals-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Deals agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process M&A/IPO query. ${error}`,
          },
        ],
      };
    }
  }
);

// Investors Agent
server.tool(
  "octagon-investors-agent",
  "[PRIVATE MARKET INTELLIGENCE] A specialized database agent for looking up information on investors. Capabilities: Retrieve information about investors, their investment criteria, and past activities. Best for: Research on investors and details about their investment activities. NOTE: For better and more accurate results, provide the investor's website URL instead of just the investor name. Example queries: 'What is the latest investment criteria of Insight Partners (insightpartners.com)?', 'How many investments did Andreessen Horowitz (a16z.com) make in the last 6 months', 'What is the typical check size for QED Investors (qedinvestors.com)'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-investors-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Investors agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process investors query. ${error}`,
          },
        ],
      };
    }
  }
);

// Web Scraper Agent
server.tool(
  "octagon-scraper-agent",
  "[PUBLIC & PRIVATE MARKET INTELLIGENCE] Specialized agent for financial data extraction from investor websites. Capabilities: Extract structured financial data from investor relations websites, tables, and online financial sources. Best for: Gathering financial data from websites that don't have accessible APIs. Example queries: 'Extract all data fields from zillow.com/san-francisco-ca/', 'Extract all data fields from www.carvana.com/cars/'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-scraper-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Scraper agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process web scraping query. ${error}`,
          },
        ],
      };
    }
  }
);

// Deep Research Agent
server.tool(
  "octagon-deep-research-agent",
  "[PUBLIC & PRIVATE MARKET INTELLIGENCE] A comprehensive agent that can utilize multiple sources for deep research analysis. Capabilities: Aggregate research across multiple data sources, synthesize information, and provide comprehensive investment research. Best for: Investment research questions requiring up-to-date aggregated information from the web. Example queries: 'Research the financial impact of Apple's privacy changes on digital advertising companies' revenue and margins', 'Analyze the competitive landscape in the cloud computing sector, focusing on AWS, Azure, and Google Cloud margin and growth trends', 'Investigate the factors driving electric vehicle adoption and their impact on battery supplier financials'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-deep-research-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Deep Research agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process deep research query. ${error}`,
          },
        ],
      };
    }
  }
);

// Private Debts Agent
server.tool(
  "octagon-debts-agent",
  "[PRIVATE MARKET INTELLIGENCE] A specialized database agent for analyzing private debts and lenders. Capabilities: Retrieve information about private debts and lenders. Best for: Research on borrowers, and lenders and details about the private debt facilities. Example queries: 'List all the debt activities from borrower American Tower', 'Compile all the debt activities from lender ING Group in Q4 2024'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-debts-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        metadata: { tool: "mcp" }
      });
      
      const result = await processStreamingResponse(response);
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling Debts agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process private debts query. ${error}`,
          },
        ],
      };
    }
  }
);

// Start the server with stdio transport
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main(); 