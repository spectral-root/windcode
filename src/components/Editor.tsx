export function Editor() {
  const code = `import { useEffect, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setIsChatOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <h1>Welcome to Windsurf Clone</h1>
      <p>Press Ctrl+L to open the AI chat</p>

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

export default App;`;

  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2d2d2d] bg-[#252525]">
        <div className="px-3 py-1 bg-[#1e1e1e] rounded text-sm text-gray-300 border-b-2 border-blue-500">
          App.tsx
        </div>
        <div className="ml-auto flex gap-2">
          <kbd className="px-2 py-1 text-xs bg-[#1e1e1e] text-gray-400 rounded border border-[#3d3d3d]">
            Ctrl
          </kbd>
          <span className="text-gray-500">+</span>
          <kbd className="px-2 py-1 text-xs bg-[#1e1e1e] text-gray-400 rounded border border-[#3d3d3d]">
            L
          </kbd>
          <span className="text-xs text-gray-500 ml-2 self-center">Open AI Chat</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 font-mono text-sm">
        <div className="space-y-0 text-gray-300">
          {code.split('\n').map((line, index) => (
            <div key={index} className="flex hover:bg-[#2d2d2d]/50">
              <span className="w-12 text-right text-gray-600 select-none pr-4">
                {index + 1}
              </span>
              <pre className="flex-1">
                <code className="text-gray-300">{line || ' '}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#2d2d2d] bg-[#252525] px-4 py-2 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-400">
          <span>TypeScript React</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="text-xs text-gray-400">
          Ln 1, Col 1
        </div>
      </div>
    </div>
  );
}
