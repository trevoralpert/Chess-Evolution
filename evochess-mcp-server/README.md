# EvoChess MCP Server

A comprehensive Model Context Protocol (MCP) server specifically designed for EvoChess development. This server provides AI-powered tools to manage, debug, and enhance your EvoChess game development workflow.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Test the server**:
   ```bash
   node index.js
   ```
   You should see: `EvoChess MCP server running on stdio`

3. **Configure your AI client** (see configuration sections below)

4. **Start using natural language commands** like:
   - "Fix the AI difficulty error"
   - "Test splitter behavior at position row 5, col 3"
   - "Check if the server is running"
   - "Read the server/index.js file"

## Features

### 🗂️ File System Management
- **read_file**: Read any file from the EvoChess project
- **write_file**: Create or update files with automatic directory creation
- **list_files**: Browse directory contents
- **search_code**: Search for patterns across your codebase

### 🚀 Server Management
- **start_server**: Launch the EvoChess server
- **stop_server**: Stop the running server
- **restart_server**: Restart with a clean state
- **check_server_status**: Verify if the server is running
- **view_server_logs**: Access recent server logs

### 🎮 Game State Analysis
- **get_game_state**: Retrieve current game state via Socket.io
- **validate_move**: Check if a move is legal for any piece
- **test_splitter_behavior**: Debug splitter piece mechanics
- **test_pawn_capture**: Analyze pawn capture logic
- **analyze_polar_movement**: Examine movement rules around poles

### 📊 Database & Statistics
- **query_game_stats**: Natural language queries for game statistics

### 🧪 Testing Tools
- **send_socket_event**: Send custom Socket.io events for testing

### 🔧 Quick Fixes
- **fix_ai_difficulty_error**: Automatically fix the AI_DIFFICULTY undefined error

## Installation

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Cursor, Claude Desktop, or VS Code with MCP support

### Setup Steps

1. **Install dependencies**:
   ```bash
   cd evochess-mcp-server
   npm install
   ```

2. **Test the server**:
   ```bash
   node index.js
   ```
   You should see: `EvoChess MCP server running on stdio`
   (Press Ctrl+C to exit)

## Configuration for Different Clients

### Cursor IDE

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Search for "MCP" or "Model Context Protocol"
3. Add server configuration:
   ```json
   {
     "mcpServers": {
       "evochess": {
         "command": "node",
         "args": ["/Users/trevoralpert/Desktop/GAUNTLET_AI/Project_5/evochess-mcp-server/index.js"]
       }
     }
   }
   ```

### Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. Add to your configuration:
   ```json
   {
     "mcpServers": {
       "evochess": {
         "command": "node",
         "args": ["/Users/trevoralpert/Desktop/GAUNTLET_AI/Project_5/evochess-mcp-server/index.js"]
       }
     }
   }
   ```
4. Restart Claude Desktop

### VS Code (with GitHub Copilot)

1. Open VS Code settings.json
2. Add:
   ```json
   {
     "github.copilot.chat.mcp.servers": {
       "evochess": {
         "command": "node",
         "args": ["/Users/trevoralpert/Desktop/GAUNTLET_AI/Project_5/evochess-mcp-server/index.js"]
       }
     }
   }
   ```

## Usage Examples

Once configured, you can use natural language commands in your AI assistant:

### File Management
- "Read the server/index.js file"
- "Search for 'splitter' in the codebase"
- "List all files in the public directory"

### Server Control
- "Start the EvoChess server"
- "Check if the server is running"
- "Restart the server"

### Debugging
- "Test splitter behavior at position row 5, col 3"
- "Why can't pawns capture properly?"
- "Analyze polar movement for a pawn at row 0, col 4"
- "Fix the AI difficulty error"

### Game Analysis
- "Validate if a PAWN can move from (2,3) to (3,3)"
- "Query game statistics for games with splitters"

## Troubleshooting

### Server won't start
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be v18+)
- Verify the path in your client configuration is correct

### Tools not appearing
- Restart your AI client after configuration
- Check for syntax errors in the configuration JSON
- Look for error messages in your client's developer console

### Socket connection issues
- Ensure the EvoChess game server is running on port 3000
- Check for firewall or security software blocking connections

## Development

To add new tools to the MCP server:

1. Add tool definition in the `tools/list` handler
2. Implement the tool logic in the `tools/call` switch statement
3. Test with: `node index.js` and use the tool from your AI client

## Common Issues & Solutions

### AI_DIFFICULTY Error
Run: "Fix the AI difficulty error" - this will automatically patch the server code

### Server Logs Not Available
The logging functionality needs to be implemented based on your specific logging setup. Consider adding file-based logging to your EvoChess server.

### Game State Retrieval
Requires implementing Socket.io events in your game server to emit game state data.

## Contributing

Feel free to extend this MCP server with additional tools specific to your development needs. The modular structure makes it easy to add new functionality.

## License

ISC License - Same as the EvoChess project 