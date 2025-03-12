#!/usr/bin/env python3
import asyncio
import os
from typing import Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    # Create server parameters for stdio connection
    server_params = StdioServerParameters(
        command="node",
        args=["../build/index.js"],  # Updated path to reflect the new location
        env=None
    )

    # Connect to the server
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the connection
            await session.initialize()
            print("Connected to Octagon MCP server")

            # List available tools
            tools = await session.list_tools()
            print("Available tools:")
            for tool in tools.tools:
                print(f"- {tool.name}: {tool.description}")

            # Example: Query SEC filings
            print("\nQuerying SEC filings for Apple's revenue...")
            sec_result = await session.call_tool(
                "octagon-sec-agent", 
                arguments={
                    "prompt": "What was Apple's revenue in the latest quarter according to their 10-Q filing?"
                }
            )
            print("SEC Filing Result:")
            print(sec_result.content[0].text)

            # Example: Analyze earnings call
            print("\nAnalyzing earnings call for Microsoft...")
            earnings_result = await session.call_tool(
                "octagon-transcripts-agent",
                arguments={
                    "prompt": "What did Microsoft's CEO say about AI initiatives in their latest earnings call?"
                }
            )
            print("Earnings Call Analysis:")
            print(earnings_result.content[0].text)

if __name__ == "__main__":
    asyncio.run(main()) 