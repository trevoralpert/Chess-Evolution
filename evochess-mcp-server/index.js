#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import io from 'socket.io-client';

const execAsync = promisify(exec);

// Configuration
const PROJECT_ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SERVER_PATH = path.join(PROJECT_ROOT, 'server');
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'public');

// Socket connection for real-time game state
let socket = null;

// Create MCP server
const server = new McpServer({
  name: 'evochess-mcp',
  version: '1.0.0'
});

// File System Tools
server.tool(
  'read_file',
  {
    filepath: z.string().describe('Path relative to project root')
  },
  async ({ filepath }) => ({
    content: [{
      type: 'text',
      text: await fs.readFile(path.join(PROJECT_ROOT, filepath), 'utf-8')
    }]
  })
);

server.tool(
  'write_file',
  {
    filepath: z.string().describe('Path relative to project root'),
    content: z.string().describe('File content')
  },
  async ({ filepath, content }) => {
    const fullPath = path.join(PROJECT_ROOT, filepath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: `File written successfully: ${filepath}`
      }]
    };
  }
);

server.tool(
  'list_files',
  {
    directory: z.string().describe('Directory path relative to project root')
  },
  async ({ directory }) => {
    const fullPath = path.join(PROJECT_ROOT, directory);
    const files = await fs.readdir(fullPath);
    return {
      content: [{
        type: 'text',
        text: `Files in ${directory}:\n${files.join('\n')}`
      }]
    };
  }
);

server.tool(
  'search_code',
  {
    pattern: z.string().describe('Search pattern'),
    directory: z.string().optional().describe('Directory to search in (optional)')
  },
  async ({ pattern, directory }) => {
    const searchDir = directory ? path.join(PROJECT_ROOT, directory) : PROJECT_ROOT;
    try {
      const { stdout } = await execAsync(`grep -r "${pattern}" ${searchDir} --include="*.js" --include="*.json" || true`);
      return {
        content: [{
          type: 'text',
          text: stdout || 'No matches found'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: 'No matches found'
        }]
      };
    }
  }
);

// Server Management Tools
server.tool(
  'start_server',
  {},
  async () => {
    try {
      await execAsync('cd .. && npm start &', { cwd: path.dirname(new URL(import.meta.url).pathname) });
      return {
        content: [{
          type: 'text',
          text: 'Server started successfully'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to start server: ${error.message}`
        }]
      };
    }
  }
);

server.tool(
  'stop_server',
  {},
  async () => {
    try {
      await execAsync('pkill -f "node.*server/index.js"');
      return {
        content: [{
          type: 'text',
          text: 'Server stopped'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: 'Server may not be running or failed to stop'
        }]
      };
    }
  }
);

server.tool(
  'restart_server',
  {},
  async () => {
    await execAsync('pkill -f "node.*server/index.js"').catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));
    await execAsync('cd .. && npm start &', { cwd: path.dirname(new URL(import.meta.url).pathname) });
    return {
      content: [{
        type: 'text',
        text: 'Server restarted'
      }]
    };
  }
);

server.tool(
  'check_server_status',
  {},
  async () => {
    try {
      await execAsync('pgrep -f "node.*server/index.js"');
      return {
        content: [{
          type: 'text',
          text: 'Server is running'
        }]
      };
    } catch {
      return {
        content: [{
          type: 'text',
          text: 'Server is not running'
        }]
      };
    }
  }
);

// Game State Analysis Tools
server.tool(
  'validate_move',
  {
    piece: z.string().describe('Piece type (e.g., PAWN, SPLITTER)'),
    from: z.object({
      row: z.number(),
      col: z.number()
    }),
    to: z.object({
      row: z.number(),
      col: z.number()
    })
  },
  async ({ piece, from, to }) => {
    return {
      content: [{
        type: 'text',
        text: `Validating move for ${piece} from (${from.row}, ${from.col}) to (${to.row}, ${to.col})\n\nThis would require implementing the actual game logic validation.`
      }]
    };
  }
);

server.tool(
  'test_splitter_behavior',
  {
    position: z.object({
      row: z.number(),
      col: z.number()
    })
  },
  async ({ position }) => {
    const splitterCode = await fs.readFile(path.join(SERVER_PATH, 'index.js'), 'utf-8');
    const hasSplitLogic = splitterCode.includes('split');
    
    return {
      content: [{
        type: 'text',
        text: `Testing splitter at position (${position.row}, ${position.col})\n\nSplit logic found in code: ${hasSplitLogic}\n\nTo fix: Implement actual splitting behavior that creates two new pieces.`
      }]
    };
  }
);

server.tool(
  'test_pawn_capture',
  {
    attackerPos: z.object({
      row: z.number(),
      col: z.number()
    }),
    defenderPos: z.object({
      row: z.number(),
      col: z.number()
    })
  },
  async ({ attackerPos, defenderPos }) => {
    return {
      content: [{
        type: 'text',
        text: `Testing pawn capture from (${attackerPos.row}, ${attackerPos.col}) to (${defenderPos.row}, ${defenderPos.col})\n\nIssues to check:\n1. Battle dice roll calculation\n2. Visual feedback for battles\n3. Diagonal capture validation`
      }]
    };
  }
);

server.tool(
  'analyze_polar_movement',
  {
    position: z.object({
      row: z.number(),
      col: z.number()
    }),
    pieceType: z.string().describe('Type of piece')
  },
  async ({ position, pieceType }) => {
    const isPolar = position.row === 0 || position.row === 19;
    return {
      content: [{
        type: 'text',
        text: `Analyzing ${pieceType} movement at (${position.row}, ${position.col})\n\nIs polar position: ${isPolar}\n\nConsiderations:\n- Pawns may not be able to check king from outer ring\n- Consider pawn promotion at outer ring\n- Wrapping behavior around poles`
      }]
    };
  }
);

// Database Tools
server.tool(
  'query_game_stats',
  {
    query: z.string().describe('Statistics query (e.g., "games with splitters", "average game duration")')
  },
  async ({ query }) => {
    const statsPath = path.join(PROJECT_ROOT, 'data', 'game-history.json');
    try {
      const stats = await fs.readFile(statsPath, 'utf-8');
      const data = JSON.parse(stats);
      return {
        content: [{
          type: 'text',
          text: `Game statistics for query "${query}":\n\nTotal games: ${data.games?.length || 0}\n\nFull stats analysis would require implementing specific queries.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: 'No game statistics available yet'
        }]
      };
    }
  }
);

// Fix AI Difficulty Error
server.tool(
  'fix_ai_difficulty_error',
  {},
  async () => {
    const serverPath = path.join(SERVER_PATH, 'index.js');
    let serverCode = await fs.readFile(serverPath, 'utf-8');
    
    // Find the problematic line
    if (serverCode.includes('AI_DIFFICULTY[difficulty || \'MEDIUM\'].name')) {
      // Add null check
      serverCode = serverCode.replace(
        'name: `AI ${AI_DIFFICULTY[difficulty || \'MEDIUM\'].name}`,',
        'name: `AI ${AI_DIFFICULTY[difficulty || \'MEDIUM\']?.name || \'Player\'}`,',
      );
      
      await fs.writeFile(serverPath, serverCode, 'utf-8');
      
      return {
        content: [{
          type: 'text',
          text: 'Fixed AI_DIFFICULTY error by adding null check. Restart the server to apply changes.'
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: 'Could not find the problematic line. The error may have already been fixed.'
        }]
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EvoChess MCP server running on stdio');
}

main().catch(console.error); 