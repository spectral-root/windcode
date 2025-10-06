import { supabase, type ProjectFile, type CommandExecution } from './supabase';

export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('file_path', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFile(
  projectId: string,
  path: string,
  content: string
): Promise<ProjectFile> {
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      file_path: path,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function readFile(projectId: string, path: string): Promise<string> {
  const { data, error } = await supabase
    .from('project_files')
    .select('content')
    .eq('project_id', projectId)
    .eq('file_path', path)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`File not found: ${path}`);
  return data.content;
}

export async function appendFile(
  projectId: string,
  path: string,
  content: string
): Promise<ProjectFile> {
  const existingContent = await readFile(projectId, path);
  const newContent = existingContent + content;

  const { data, error } = await supabase
    .from('project_files')
    .update({ content: newContent, updated_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('file_path', path)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCommandExecution(
  projectId: string,
  sessionId: string,
  command: string
): Promise<CommandExecution> {
  const { data, error } = await supabase
    .from('command_executions')
    .insert({
      project_id: projectId,
      session_id: sessionId,
      command,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCommandExecution(
  id: string,
  updates: Partial<CommandExecution>
): Promise<CommandExecution> {
  const { data, error } = await supabase
    .from('command_executions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function executeCommand(
  executionId: string,
  command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    await updateCommandExecution(executionId, { status: 'running' });

    const mockResults = simulateCommandExecution(command);

    await updateCommandExecution(executionId, {
      status: mockResults.exitCode === 0 ? 'completed' : 'failed',
      stdout: mockResults.stdout,
      stderr: mockResults.stderr,
      exit_code: mockResults.exitCode,
    });

    return mockResults;
  } catch (error) {
    await updateCommandExecution(executionId, {
      status: 'failed',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exit_code: 1,
    });
    throw error;
  }
}

function simulateCommandExecution(command: string): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('npm install')) {
    return {
      stdout: 'added 245 packages, and audited 246 packages in 3s\n\nfound 0 vulnerabilities',
      stderr: '',
      exitCode: 0,
    };
  }

  if (lowerCommand.includes('npm run build')) {
    return {
      stdout: 'vite v5.0.0 building for production...\n✓ 42 modules transformed.\ndist/index.html  0.45 kB\ndist/assets/index.js  142.23 kB\n✓ built in 1.23s',
      stderr: '',
      exitCode: 0,
    };
  }

  if (lowerCommand.includes('npm start') || lowerCommand.includes('npm run dev')) {
    return {
      stdout: 'VITE v5.0.0  ready in 432 ms\n➜  Local:   http://localhost:5173/\n➜  Network: use --host to expose',
      stderr: '',
      exitCode: 0,
    };
  }

  if (lowerCommand.includes('git init')) {
    return {
      stdout: 'Initialized empty Git repository in /project/.git/',
      stderr: '',
      exitCode: 0,
    };
  }

  if (lowerCommand.includes('python') || lowerCommand.includes('node')) {
    return {
      stdout: 'Server running on port 3000',
      stderr: '',
      exitCode: 0,
    };
  }

  return {
    stdout: `Command executed: ${command}`,
    stderr: '',
    exitCode: 0,
  };
}

export function analyzeError(error: string): string {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('module not found') || errorLower.includes('cannot find module')) {
    return 'Missing dependency detected. Run: npm install';
  }

  if (errorLower.includes('enoent') || errorLower.includes('no such file')) {
    return 'File or directory not found. Verify the path exists.';
  }

  if (errorLower.includes('permission denied') || errorLower.includes('eacces')) {
    return 'Permission denied. Try running with appropriate permissions.';
  }

  if (errorLower.includes('port') && errorLower.includes('already in use')) {
    return 'Port already in use. Kill the existing process or use a different port.';
  }

  if (errorLower.includes('syntax error')) {
    return 'Syntax error detected. Check your code for typos or missing brackets.';
  }

  return 'Error detected. Review the error message for details.';
}
