import { useEffect, useState } from 'react';
import { AIChatPanel } from './components/AIChatPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { Sparkles, Code2 } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    initializeProject();
  }, []);

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

  const initializeProject = async () => {
    const existingProjectId = localStorage.getItem('windcode_project_id');

    if (existingProjectId) {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('id', existingProjectId)
        .maybeSingle();

      if (data) {
        setProjectId(data.id);
        return;
      }
    }

    const { data: newProject } = await supabase
      .from('projects')
      .insert({
        name: 'My Project',
        description: 'Created with WindCode AI',
        workspace_path: '/workspace',
      })
      .select()
      .single();

    if (newProject) {
      setProjectId(newProject.id);
      localStorage.setItem('windcode_project_id', newProject.id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-100">
      <header className="bg-[#252525] border-b border-[#2d2d2d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">WindCode</h1>
            <p className="text-xs text-gray-400">AI-Powered Development</p>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(true)}
          className="px-4 py-2 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Assistant</span>
          <kbd className="ml-2 px-2 py-0.5 bg-black/20 rounded text-xs font-mono">Ctrl+L</kbd>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {projectId ? (
          <WorkspacePanel projectId={projectId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-400">Initializing workspace...</p>
            </div>
          </div>
        )}
      </div>

      {projectId && (
        <AIChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          projectId={projectId}
        />
      )}

      <footer className="bg-[#252525] border-t border-[#2d2d2d] px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>LM Studio: Connected</span>
          <span>•</span>
          <span>Press Ctrl+L to open AI Assistant</span>
        </div>
        <div>WindCode v1.0.0</div>
      </footer>
    </div>
  );
}

export default App;
