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
  "Extract information from SEC filings like 10-K, 10-Q, 8-K, proxy statements, and other regulatory documents. Provide company name and specific questions about their filings.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-sec-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Analyze earnings call transcripts for public companies. Ask specific questions about what was discussed in the latest or historical earnings calls.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-transcripts-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Retrieve financial metrics, ratios, and data for public companies. Ask for specific financial information or comparisons across companies and time periods.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-financials-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Access stock market data, including prices, trading volumes, returns, and market trends. Ask questions about stock performance over specific time periods.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-stock-data-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Research private company information, including funding, key people, products, and market positioning. Ask specific questions about private companies.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-companies-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Research startup funding rounds and venture capital investments. Ask questions about fundraising, investments, and capital allocation in the private markets.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-funding-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Research mergers, acquisitions, and IPO transactions. Ask questions about deal terms, valuations, and market implications of corporate transactions.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-deals-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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

// Web Scraper Agent
server.tool(
  "octagon-scraper-agent",
  "Extract data from any public website. Provide a URL and describe what information you want to extract from the page.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-scraper-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "Perform comprehensive research on any financial or business topic, combining multiple data sources and analysis methods for in-depth insights.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-deep-research-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  "A specialized database agent for analyzing private debts and lenders. Retrieve information about private debts and lenders, borrowers, and details about private debt facilities.",
  {
    prompt: z.string().describe("Your natural language query or request for the agent"),
  },
  async ({ prompt }: PromptParams) => {
    try {
      const response = await octagonClient.chat.completions.create({
        model: "octagon-debts-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
    console.log("Octagon MCP Server started successfully");
  } catch (error) {
    console.error("Failed to start Octagon MCP Server:", error);
    process.exit(1);
  }
}

main(); 