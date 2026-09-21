import { useState, useEffect } from 'react'
import type { FSNode } from '@/types'
import { api } from '@/lib/api'
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  Settings,
  Database,
  Terminal,
  File,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderTree,
  FileCode,
} from 'lucide-react'

interface Props {
  projectPath: string
  onOpenFile?: (path: string, content: string) => void
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
      return <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
    case 'md':
    case 'txt':
      return <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'env':
      return <Settings className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
    case 'sql':
    case 'db':
      return <Database className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
    case 'sh':
    case 'bash':
      return <Terminal className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
    default:
      return <File className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
  }
}

function TreeNode({
  node,
  depth = 0,
  onOpenFile,
}: {
  node: FSNode
  depth?: number
  onOpenFile?: (path: string, content: string) => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const isDir = Boolean(node.is_dir)

  const handleClick = async () => {
    if (isDir) {
      setOpen(o => !o)
    } else {
      if (fileContent !== null) {
        setFileContent(null)
        return
      }
      setLoadingFile(true)
      try {
        const data = await api.get<{ content: string; path: string; error?: string }>(
          `/api/fs/file?path=${encodeURIComponent(node.path)}`
        )
        const c = data.content || data.error || '(Empty file)'
        setFileContent(c)
        onOpenFile?.(node.path, c)
      } catch (_) {
        setFileContent('Could not read file')
      } finally {
        setLoadingFile(false)
      }
    }
  }

  return (
    <div>
      <button
        onClick={() => void handleClick()}
        className="w-full flex items-center gap-1.5 py-1 text-left transition-colors cursor-pointer rounded hover:bg-[var(--color-elevated)]"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          color: isDir ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          background: 'transparent',
          fontSize: '12px',
        }}
      >
        {isDir ? (
          <>
            <span className="text-[var(--color-text-muted)]">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            {open ? (
              <FolderOpen className="w-3.5 h-3.5 text-[var(--color-accent)] flex-shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[var(--color-accent)] flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
          </>
        )}

        <span className="truncate font-mono text-[11px]">{node.name}</span>
        {loadingFile && <span className="ml-auto text-[10px] text-[var(--color-text-muted)] animate-pulse">loading</span>}
      </button>

      {/* Inline file preview */}
      {fileContent !== null && (
        <div style={{ paddingLeft: `${depth * 12 + 20}px` }}>
          <pre
            className="text-[11px] overflow-x-auto my-1 rounded-lg px-3 py-2 leading-relaxed"
            style={{
              background: 'var(--color-base)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--color-border)',
              maxHeight: '260px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {fileContent}
          </pre>
        </div>
      )}

      {/* Children */}
      {isDir && open && Array.isArray(node.children) && node.children.map(child => (
        <TreeNode key={child.path} node={child} depth={depth + 1} onOpenFile={onOpenFile} />
      ))}
    </div>
  )
}

export function FileExplorer({ projectPath, onOpenFile }: Props) {
  const [tree, setTree] = useState<FSNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'explorer' | 'mcp' | 'agents'>('explorer')

  const fetchTree = () => {
    setLoading(true)
    setError(null)
    api.get<FSNode[]>(`/api/fs/tree?path=${encodeURIComponent(projectPath || '.')}`)
      .then(data => {
        setTree(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('Failed to load file tree'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTree()
  }, [projectPath])

  return (
    <aside
      className="flex flex-col h-full border-l border-[var(--color-border)]"
      style={{
        background: 'var(--color-surface)',
        width: '280px',
        flexShrink: 0,
      }}
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-elevated)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-mono transition-colors cursor-pointer ${
              activeTab === 'mcp'
                ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>.mcp</span>
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-mono transition-colors cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-[var(--color-base)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>AGENTS</span>
          </button>
        </div>

        <button
          onClick={fetchTree}
          className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base)] transition-colors cursor-pointer"
          title="Refresh tree"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto py-1">
        {activeTab === 'explorer' && (
          <>
            {loading && (
              <div className="flex items-center justify-center h-24">
                <span className="text-xs text-[var(--color-text-muted)] animate-pulse font-mono">
                  Inspecting directory…
                </span>
              </div>
            )}
            {error && (
              <div className="px-4 py-3 text-xs text-rose-400 font-mono">{error}</div>
            )}
            {!loading && !error && (
              tree.length > 0 ? (
                tree.map(node => (
                  <TreeNode key={node.path} node={node} depth={0} onOpenFile={onOpenFile} />
                ))
              ) : (
                <div className="px-4 py-4 text-xs text-[var(--color-text-muted)] font-mono">
                  Empty directory
                </div>
              )
            )}
          </>
        )}

        {activeTab === 'mcp' && (
          <QuickFileViewer projectPath={projectPath} filename=".mcp.json" />
        )}

        {activeTab === 'agents' && (
          <QuickFileViewer projectPath={projectPath} filename="AGENTS.md" />
        )}
      </div>
    </aside>
  )
}

function QuickFileViewer({ projectPath, filename }: { projectPath: string; filename: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const path = `${projectPath}/${filename}`
    api.get<{ content?: string; error?: string }>(`/api/fs/file?path=${encodeURIComponent(path)}`)
      .then(d => setContent(d.content || d.error || null))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [projectPath, filename])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <span className="text-xs animate-pulse text-[var(--color-text-muted)] font-mono">Loading…</span>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="px-4 py-4 text-xs text-[var(--color-text-muted)] font-mono">
        {filename} not found in workspace
      </div>
    )
  }

  return (
    <pre
      className="text-xs px-3 py-3 whitespace-pre-wrap break-all leading-relaxed font-mono text-[var(--color-text-secondary)]"
    >
      {content}
    </pre>
  )
}
