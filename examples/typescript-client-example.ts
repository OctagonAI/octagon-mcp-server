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

    // Example: Query SEC filings
    console.log("\nQuerying SEC filings for Apple's revenue...");
    const secResult = await client.callTool({
      name: "octagon-sec-agent",
      arguments: {
        prompt: "What was Apple's revenue in the latest quarter according to their 10-Q filing?",
      },
    });

    console.log("SEC Filing Result:");
    console.log(secResult.content[0].text);

    // Example: Analyze earnings call
    console.log("\nAnalyzing earnings call for Microsoft...");
    const earningsResult = await client.callTool({
      name: "octagon-transcripts-agent",
      arguments: {
        prompt: "What did Microsoft's CEO say about AI initiatives in their latest earnings call?",
      },
    });

    console.log("Earnings Call Analysis:");
    console.log(earningsResult.content[0].text);

    // Close the client
    await client.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 