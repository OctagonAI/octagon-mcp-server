#!/bin/bash

# Octagon MCP Server Installation Script

echo "Installing Octagon MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm before continuing."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the server
echo "Building the server..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit the .env file and add your Octagon API key."
fi

echo "Installation complete!"
echo ""
echo "There are multiple ways to use the Octagon MCP Server:"
echo ""
echo "1. Run directly with your API key:"
echo "   env OCTAGON_API_KEY=your_octagon_api_key node ./dist/index.js"
echo ""
echo "2. Install globally and run with npx:"
echo "   npm install -g ."
echo "   env OCTAGON_API_KEY=your_octagon_api_key npx octagon-mcp"
echo ""
echo "3. To use with Claude Desktop, add the following to your claude_desktop_config.json:"
echo '{
  "mcpServers": {
    "octagon": {
      "command": "env",
      "args": ["OCTAGON_API_KEY=your_octagon_api_key", "npx", "-y", "octagon-mcp"]
    }
  }
}'
echo ""
echo "4. To use with Cursor, add a new MCP server with:"
echo "   - Name: octagon-mcp"
echo "   - Type: command"
echo "   - Command: env OCTAGON_API_KEY=your_octagon_api_key npx -y octagon-mcp" 