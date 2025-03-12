#!/bin/bash

# Octagon MCP Server Run Script

echo "Starting Octagon MCP Server..."

# Check if the build directory exists, if not, build the project
if [ ! -d "./build" ]; then
    echo "Build directory not found. Building project..."
    npm run build
fi

# Run the server
echo "Running server..."
node build/index.js 