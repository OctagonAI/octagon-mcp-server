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
        fullResponse += chunk.delta;
      }
      
      if (chunk.type === "response.completed" && chunk.response?.citations) {
        citations = chunk.response.citations;
      }
    }
    
    // Add citations to the response if available
    if (citations.length > 0) {
      fullResponse += "\n\nSOURCES:\n";
      for (const citation of citations) {
        fullResponse += `${citation.order}. ${citation.name}: ${citation.url}\n`;
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("Error processing streaming response:", error);
    throw error;
  }
}

// SEC Filings Analysis Tool
server.tool(
  "octagon-sec-agent",
  "Extract information from SEC filings",
  {
    prompt: z.string().describe("Your query about SEC filings (include company name, filing type, and time period in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon SEC agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-sec-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error querying SEC filings:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error querying SEC filings: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Earnings Call Analysis Tool
server.tool(
  "octagon-transcripts-agent",
  "Analyze earnings call transcripts",
  {
    prompt: z.string().describe("Your query about earnings call transcripts (include company name and quarter in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Transcripts agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-transcripts-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error analyzing earnings call:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error analyzing earnings call: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Financial Data Tool
server.tool(
  "octagon-financials-agent",
  "Retrieve financial metrics and ratios",
  {
    prompt: z.string().describe("Your query about financial data and metrics (include company name and time period in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Financials agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-financials-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error retrieving financial data:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving financial data: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Market Data Tool
server.tool(
  "octagon-stock-data-agent",
  "Access stock market data",
  {
    prompt: z.string().describe("Your query about stock market data (include company name and time period in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Stock Data agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-stock-data-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error retrieving market data:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error retrieving market data: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Private Company Research Tool
server.tool(
  "octagon-companies-agent",
  "Research private company information",
  {
    prompt: z.string().describe("Your query about a private company (make sure to include the company name in your prompt)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Companies agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-companies-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error researching private company:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error researching private company: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Web Scraper Tool
server.tool(
  "octagon-scraper-agent",
  "Extract data from any public website",
  {
    prompt: z.string().describe("Your query including the URL to scrape and what information to extract (format: 'Extract [information] from [URL]')"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Scraper agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-scraper-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error scraping website:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error scraping website: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Deep Research Tool
server.tool(
  "octagon-deep-research-agent",
  "Perform comprehensive research on any topic",
  {
    prompt: z.string().describe("Your research question or topic to investigate in detail"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Deep Research agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-deep-research-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error performing deep research:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error performing deep research: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Funding Research Tool
server.tool(
  "octagon-funding-agent",
  "Research startup funding rounds and venture capital",
  {
    prompt: z.string().describe("Your query about startup funding information (include company name in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Funding agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-funding-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error researching funding:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error researching funding: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// M&A and IPO Research Tool
server.tool(
  "octagon-deals-agent",
  "Research M&A and IPO transactions",
  {
    prompt: z.string().describe("Your query about M&A or IPO transactions (include company name in your prompt if relevant)"),
  },
  async ({ prompt }) => {
    try {
      // Call Octagon Deals agent
      const stream = await octagonClient.chat.completions.create({
        model: "octagon-deals-agent",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      
      const response = await processStreamingResponse(stream);
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      console.error("Error researching deals:", error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error researching deals: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Octagon MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main(); 