import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  try {
    // Create a client
    const client = new Client({
      name: "octagon-client-example",
      version: "1.0.0",
    });

    // Connect to the server
    const transport = new StdioClientTransport({
      command: "node",
      args: ["../build/index.js"],  // Updated path to reflect the new location
    });
    await client.connect(transport);

    console.log("Connected to Octagon MCP server");

    // List available tools
    const toolsResult = await client.listTools();
    console.log("Available tools:");
    for (const tool of toolsResult.tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }

    // Example: Query comprehensive market intelligence
    console.log("\nQuerying comprehensive market intelligence for Apple...");
    const marketResult = await client.callTool({
      name: "octagon-agent",
      arguments: {
        prompt: "Analyze Apple's latest 10-K filing and extract key financial metrics and risk factors",
      },
    });

    console.log("Market Intelligence Result:");
    console.log((marketResult as any).content[0].text);

    // Example: Deep research analysis
    console.log("\nPerforming deep research on AI market trends...");
    const researchResult = await client.callTool({
      name: "octagon-deep-research-agent",
      arguments: {
        prompt: "Research the financial impact of AI adoption on semiconductor companies' revenue and margins",
      },
    });

    console.log("Deep Research Analysis:");
    console.log((researchResult as any).content[0].text);

    // Example: Web scraping
    console.log("\nExtracting data from a website...");
    const scrapingResult = await client.callTool({
      name: "octagon-scraper-agent",
      arguments: {
        prompt: "Extract all data fields from zillow.com/san-francisco-ca/",
      },
    });

    console.log("Web Scraping Result:");
    console.log((scrapingResult as any).content[0].text);

    // Close the client
    await client.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 