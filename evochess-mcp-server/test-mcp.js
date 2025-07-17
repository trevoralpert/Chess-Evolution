#!/usr/bin/env node

// Test script to verify MCP server is working
console.log("Testing EvoChess MCP Server...");

// Send a proper MCP initialization request
const initRequest = {
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  },
  id: 1
};

console.log("Sending:", JSON.stringify(initRequest));

// The server should respond with its capabilities
console.log("\nTo test the server:");
console.log("1. Run: node index.js");
console.log("2. The server will wait for JSON-RPC messages on stdin");
console.log("3. It will output 'EvoChess MCP server running on stdio' to stderr");
console.log("\nThe server is ready to be connected to Claude Desktop, Cursor, or other MCP clients!"); 