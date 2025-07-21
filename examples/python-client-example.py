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

            # Example: Query comprehensive market intelligence
            print("\nQuerying comprehensive market intelligence for Apple...")
            market_result = await session.call_tool(
                "octagon-agent", 
                arguments={
                    "prompt": "Analyze Apple's latest 10-K filing and extract key financial metrics and risk factors"
                }
            )
            print("Market Intelligence Result:")
            print(market_result.content[0].text)

            # Example: Deep research analysis
            print("\nPerforming deep research on AI market trends...")
            research_result = await session.call_tool(
                "octagon-deep-research-agent",
                arguments={
                    "prompt": "Research the financial impact of AI adoption on semiconductor companies' revenue and margins"
                }
            )
            print("Deep Research Analysis:")
            print(research_result.content[0].text)

            # Example: Web scraping
            print("\nExtracting data from a website...")
            scraping_result = await session.call_tool(
                "octagon-scraper-agent",
                arguments={
                    "prompt": "Extract all data fields from zillow.com/san-francisco-ca/"
                }
            )
            print("Web Scraping Result:")
            print(scraping_result.content[0].text)

if __name__ == "__main__":
    asyncio.run(main()) 