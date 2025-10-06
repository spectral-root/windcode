import { FileCode, Folder, Search, Settings, GitBranch, Box } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { icon: Search, label: 'Search', active: false },
    { icon: FileCode, label: 'Files', active: true },
    { icon: GitBranch, label: 'Source Control', active: false },
    { icon: Box, label: 'Extensions', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="w-64 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col">
      <div className="p-4 border-b border-[#2d2d2d]">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          <FolderItem name="src" defaultOpen>
            <FileItem name="App.tsx" />
            <FileItem name="main.tsx" />
            <FileItem name="index.css" />
            <FolderItem name="components">
              <FileItem name="ChatPanel.tsx" />
              <FileItem name="Sidebar.tsx" />
            </FolderItem>
            <FolderItem name="lib">
              <FileItem name="supabase.ts" />
            </FolderItem>
          </FolderItem>
          <FolderItem name="public" />
          <FileItem name="package.json" />
          <FileItem name="vite.config.ts" />
          <FileItem name="tsconfig.json" />
        </div>
      </div>

      <div className="border-t border-[#2d2d2d] p-2">
        <div className="flex gap-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`p-2 rounded hover:bg-[#2d2d2d] transition-colors ${
                item.active ? 'bg-[#2d2d2d]' : ''
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FolderItem({
  name,
  defaultOpen = false,
  children,
}: {
  name: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button className="flex items-center gap-2 w-full px-2 py-1 text-sm text-gray-300 hover:bg-[#2d2d2d] rounded transition-colors">
        <Folder className="w-4 h-4 text-blue-400" />
        <span>{name}</span>
      </button>
      {defaultOpen && children && <div className="ml-4 mt-1">{children}</div>}
    </div>
  );
}

function FileItem({ name }: { name: string }) {
  return (
    <button className="flex items-center gap-2 w-full px-2 py-1 text-sm text-gray-400 hover:bg-[#2d2d2d] rounded transition-colors">
      <FileCode className="w-4 h-4 text-gray-500" />
      <span>{name}</span>
    </button>
  );
}
