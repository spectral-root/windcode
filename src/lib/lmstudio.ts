const LM_STUDIO_API_URL = 'http://localhost:1234/v1';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'list_project_files',
      description: 'List all files in the current project workspace',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file with the specified content',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to create',
          },
          content: {
            type: 'string',
            description: 'Content to write to the file',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the content of a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to read',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_file',
      description: 'Append content to an existing file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file to append to',
          },
          content: {
            type: 'string',
            description: 'Content to append to the file',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a shell command and return stdout/stderr',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_error',
      description: 'Analyze an error message and suggest fixes',
      parameters: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message to analyze',
          },
        },
        required: ['error'],
      },
    },
  },
];

export async function sendChatCompletion(
  messages: Message[],
  model: string = 'llama-3.2-3b-instruct-abliterated'
): Promise<ChatCompletionResponse> {
  const response = await fetch(`${LM_STUDIO_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`LM Studio API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${LM_STUDIO_API_URL}/models`);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    const data = await response.json();
    return data.data.map((model: any) => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['llama-3.2-3b-instruct-abliterated'];
  }
}

export function getTools(): Tool[] {
  return tools;
}
