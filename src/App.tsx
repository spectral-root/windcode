import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ChatPanel } from './components/ChatPanel';
import { Menu, Sparkles } from 'lucide-react';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

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
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-100">
      <header className="bg-[#252525] border-b border-[#2d2d2d] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-[#2d2d2d] rounded transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Windsurf</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-4 py-2 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Chat</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black/20 rounded text-xs">
              Ctrl+L
            </kbd>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && <Sidebar />}
        <Editor />
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

export default App;
