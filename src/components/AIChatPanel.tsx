import { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles, Play, XCircle, Terminal, FileCode, Check } from 'lucide-react';
import { supabase, type ChatMessage } from '../lib/supabase';
import { sendChatCompletion, type Message, type ToolCall } from '../lib/lmstudio';
import {
  listProjectFiles,
  createFile,
  readFile,
  appendFile,
  createCommandExecution,
  executeCommand,
  analyzeError,
} from '../lib/tools';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface PendingAction {
  id: string;
  type: 'command' | 'file_create' | 'file_append' | 'file_read';
  description: string;
  data: any;
}

export function AIChatPanel({ isOpen, onClose, projectId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingActions]);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const saveMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    const { data } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data]);
      return data;
    }
    return null;
  };

  const handleToolCall = async (toolCall: ToolCall) => {
    const { name, arguments: argsStr } = toolCall.function;
    const args = JSON.parse(argsStr);

    switch (name) {
      case 'list_project_files':
        const files = await listProjectFiles(projectId);
        return JSON.stringify(files.map((f) => f.file_path));

      case 'read_file':
        const content = await readFile(projectId, args.path);
        return content;

      case 'analyze_error':
        return analyzeError(args.error);

      case 'create_file':
      case 'append_file':
      case 'run_command':
        return new Promise((resolve) => {
          const action: PendingAction = {
            id: toolCall.id,
            type:
              name === 'create_file'
                ? 'file_create'
                : name === 'append_file'
                ? 'file_append'
                : 'command',
            description:
              name === 'create_file'
                ? `Create file: ${args.path}`
                : name === 'append_file'
                ? `Append to file: ${args.path}`
                : `Run command: ${args.command}`,
            data: args,
          };
          setPendingActions((prev) => [...prev, action]);
        });

      default:
        return `Unknown tool: ${name}`;
    }
  };

  const handleApproveAction = async (action: PendingAction) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== action.id));

    try {
      let result = '';

      switch (action.type) {
        case 'file_create':
          const created = await createFile(projectId, action.data.path, action.data.content);
          result = `File created: ${created.file_path}`;
          break;

        case 'file_append':
          const appended = await appendFile(projectId, action.data.path, action.data.content);
          result = `Content appended to: ${appended.file_path}`;
          break;

        case 'command':
          const execution = await createCommandExecution(projectId, sessionId, action.data.command);
          const cmdResult = await executeCommand(execution.id, action.data.command);
          result = `Command executed:\nstdout: ${cmdResult.stdout}\nstderr: ${cmdResult.stderr}\nexit code: ${cmdResult.exitCode}`;
          break;
      }

      await saveMessage({
        content: result,
        role: 'tool',
        session_id: sessionId,
        tool_call_id: action.id,
      });

      continueConversation(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await saveMessage({
        content: `Error: ${errorMsg}`,
        role: 'tool',
        session_id: sessionId,
        tool_call_id: action.id,
      });
    }
  };

  const handleDeclineAction = (action: PendingAction) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== action.id));
    saveMessage({
      content: 'Action declined by user',
      role: 'tool',
      session_id: sessionId,
      tool_call_id: action.id,
    });
  };

  const continueConversation = async (toolResult: string) => {
    setIsLoading(true);
    try {
      const conversationMessages: Message[] = messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      conversationMessages.push({
        role: 'user',
        content: toolResult,
      });

      const response = await sendChatCompletion(conversationMessages);
      const assistantMessage = response.choices[0]?.message;

      if (assistantMessage) {
        await saveMessage({
          content: assistantMessage.content || '',
          role: 'assistant',
          session_id: sessionId,
          tool_calls: assistantMessage.tool_calls
            ? JSON.stringify(assistantMessage.tool_calls)
            : undefined,
        });

        if (assistantMessage.tool_calls) {
          for (const toolCall of assistantMessage.tool_calls) {
            await handleToolCall(toolCall);
          }
        }
      }
    } catch (error) {
      console.error('Error continuing conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInput('');
    setIsLoading(true);

    await saveMessage({
      content: userInput,
      role: 'user',
      session_id: sessionId,
    });

    try {
      const systemPrompt: Message = {
        role: 'system',
        content: `You are WindCode AI, an intelligent coding assistant that helps developers create projects. You have access to file system tools (create_file, read_file, append_file, list_project_files) and command execution (run_command). When a user requests a project, analyze it, create the necessary files, and propose commands to execute. Always use tools to accomplish tasks. Be concise and helpful.`,
      };

      const conversationMessages: Message[] = [
        systemPrompt,
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        { role: 'user', content: userInput },
      ];

      const response = await sendChatCompletion(conversationMessages);
      const assistantMessage = response.choices[0]?.message;

      if (assistantMessage) {
        await saveMessage({
          content: assistantMessage.content || '',
          role: 'assistant',
          session_id: sessionId,
          tool_calls: assistantMessage.tool_calls
            ? JSON.stringify(assistantMessage.tool_calls)
            : undefined,
        });

        if (assistantMessage.tool_calls) {
          for (const toolCall of assistantMessage.tool_calls) {
            await handleToolCall(toolCall);
          }
        }
      }
    } catch (error) {
      await saveMessage({
        content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to LM Studio. Make sure it is running on localhost:1234'}`,
        role: 'assistant',
        session_id: sessionId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-[#2d2d2d] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#252525]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">WindCode AI</h2>
              <p className="text-xs text-gray-400">Powered by LM Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2d2d2d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Welcome to WindCode AI
              </h3>
              <p className="text-gray-400 max-w-md mb-4">
                Describe your project and I'll help you build it. I can create files, write code,
                and execute commands.
              </p>
              <div className="text-left text-sm text-gray-500 bg-[#252525] rounded-lg p-4 max-w-md">
                <p className="font-semibold mb-2">Example prompts:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create a website with a contact form</li>
                  <li>Build a Node.js REST API with Express</li>
                  <li>Make a React todo app with localStorage</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    : message.role === 'tool'
                    ? 'bg-[#2a2a2a] text-gray-300 border border-[#3d3d3d] font-mono text-xs'
                    : 'bg-[#2d2d2d] text-gray-100 border border-[#3d3d3d]'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {pendingActions.map((action) => (
            <div key={action.id} className="flex justify-start">
              <div className="max-w-[80%] bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
                <div className="flex items-start gap-3">
                  {action.type === 'command' ? (
                    <Terminal className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileCode className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-200 font-medium mb-3">{action.description}</p>
                    {action.type === 'command' && (
                      <pre className="text-xs bg-[#1a1a1a] p-2 rounded mb-3 text-gray-300 overflow-x-auto">
                        {action.data.command}
                      </pre>
                    )}
                    {(action.type === 'file_create' || action.type === 'file_append') && (
                      <pre className="text-xs bg-[#1a1a1a] p-2 rounded mb-3 text-gray-300 overflow-x-auto max-h-32">
                        {action.data.content}
                      </pre>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveAction(action)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                      <button
                        onClick={() => handleDeclineAction(action)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#2d2d2d] border border-[#3d3d3d]">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#2d2d2d] bg-[#252525] p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your project... (Shift+Enter for new line)"
              className="flex-1 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
