#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Get package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJsonContent = await readFile(packageJsonPath, "utf8");
const packageInfo = JSON.parse(packageJsonContent) as { name: string; version: string };

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
  defaultHeaders: {
    "User-Agent": `${packageInfo.name}/${packageInfo.version} (Node.js/${process.versions.node})`
  },
});

// Create MCP server
const server = new McpServer({
  name: packageInfo.name,
  version: packageInfo.version,
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

// Comprehensive Orchestration Agent
server.tool(
  "octagon-agent",
  "[COMPREHENSIVE MARKET INTELLIGENCE] Orchestrates all agents for comprehensive market intelligence analysis. Capabilities: Combines insights from SEC filings, earnings calls, financial metrics, stock data, institutional holdings, private company research, funding analysis, M&A transactions, investor intelligence, and debt analysis to provide holistic market intelligence. Best for: Complex research requiring multiple data sources and comprehensive analysis across public and private markets. Example queries: 'Retrieve year-over-year growth in key income-statement items for AAPL, limited to 5 records and filtered by period FY', 'Analyze the latest 10-K filing for AAPL and extract key financial metrics and risk factors', 'Retrieve the daily closing prices for AAPL over the last 30 days', 'Analyze AAPL's latest earnings call transcript and extract key insights about future guidance', 'Provide a comprehensive overview of Stripe, including its business model and key metrics', 'Retrieve the funding history for Stripe, including all rounds and investors'.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-agent",
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
      console.error("Error calling Octagon orchestration agent:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Failed to process comprehensive market intelligence query. ${error}`,
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
