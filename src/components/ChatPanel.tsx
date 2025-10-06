import { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase, type ChatMessage } from '../lib/supabase';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
      content: input,
      role: 'user',
      session_id: sessionId,
    };

    setInput('');
    setIsLoading(true);

    const { data: savedUserMessage } = await supabase
      .from('chat_messages')
      .insert(userMessage)
      .select()
      .single();

    if (savedUserMessage) {
      setMessages((prev) => [...prev, savedUserMessage]);
    }

    setTimeout(async () => {
      const aiResponse: Omit<ChatMessage, 'id' | 'created_at'> = {
        content: generateAIResponse(input),
        role: 'assistant',
        session_id: sessionId,
      };

      const { data: savedAiMessage } = await supabase
        .from('chat_messages')
        .insert(aiResponse)
        .select()
        .single();

      if (savedAiMessage) {
        setMessages((prev) => [...prev, savedAiMessage]);
      }

      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      `I understand you're asking about "${userInput}". Let me help you with that.`,
      `That's an interesting question about "${userInput}". Here's what I think...`,
      `Thanks for sharing "${userInput}". Based on that, I would suggest...`,
      `I've analyzed your request regarding "${userInput}". Here's my response...`,
      `Great question! Regarding "${userInput}", I can provide some insights...`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-3xl h-[600px] flex flex-col border border-[#2d2d2d] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#252525]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-100">AI Assistant</h2>
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
                How can I help you today?
              </h3>
              <p className="text-gray-400 max-w-md">
                Ask me anything. I'm here to assist with your questions and tasks.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    : 'bg-[#2d2d2d] text-gray-100 border border-[#3d3d3d]'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#2d2d2d] border border-[#3d3d3d]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
              placeholder="Type your message... (Shift+Enter for new line)"
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
