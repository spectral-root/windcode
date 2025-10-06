import { useEffect, useState } from 'react';
import { FileCode, Folder, FolderOpen, RefreshCw } from 'lucide-react';
import { listProjectFiles, type ProjectFile } from '../lib/tools';

interface WorkspacePanelProps {
  projectId: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function WorkspacePanel({ projectId }: WorkspacePanelProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  useEffect(() => {
    loadFiles();
    const interval = setInterval(loadFiles, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const projectFiles = await listProjectFiles(projectId);
      setFiles(projectFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTree = (files: ProjectFile[]): FileNode[] => {
    const root: FileNode = { name: '', path: '', type: 'folder', children: [] };

    files.forEach((file) => {
      const parts = file.file_path.split('/').filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        const isLastPart = index === parts.length - 1;
        const currentPath = '/' + parts.slice(0, index + 1).join('/');

        if (!current.children) {
          current.children = [];
        }

        let child = current.children.find((c) => c.name === part);

        if (!child) {
          child = {
            name: part,
            path: currentPath,
            type: isLastPart ? 'file' : 'folder',
            children: isLastPart ? undefined : [],
          };
          current.children.push(child);
        }

        if (!isLastPart) {
          current = child;
        }
      });
    });

    return root.children || [];
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (path: string) => {
    const file = files.find((f) => f.file_path === path.slice(1));
    if (file) {
      setSelectedFile(file);
    }
  };

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path);

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-300 hover:bg-[#2d2d2d] rounded transition-colors"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400" />
            )}
            <span>{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => handleFileClick(node.path)}
        className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-[#2d2d2d] rounded transition-colors ${
          selectedFile?.file_path === node.path.slice(1)
            ? 'bg-[#2d2d2d] text-gray-100'
            : 'text-gray-400'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <FileCode className="w-4 h-4 text-gray-500" />
        <span>{node.name}</span>
      </button>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="flex h-full">
      <div className="w-72 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col">
        <div className="p-4 border-b border-[#2d2d2d] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Workspace
          </h2>
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-1.5 hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FileCode className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">No files yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Use AI to create your first file
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">{fileTree.map((node) => renderNode(node))}</div>
          )}
        </div>

        <div className="border-t border-[#2d2d2d] p-3 bg-[#252525]">
          <div className="text-xs text-gray-500">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e1e] flex flex-col">
        {selectedFile ? (
          <>
            <div className="px-4 py-3 border-b border-[#2d2d2d] bg-[#252525]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 font-medium">
                  {selectedFile.file_path}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-sm font-mono text-gray-300 leading-relaxed">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileCode className="w-16 h-16 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Select a file to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
