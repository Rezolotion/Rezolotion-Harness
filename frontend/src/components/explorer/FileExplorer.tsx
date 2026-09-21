import { useState, useEffect } from 'react'
import type { FSNode } from '@/types'
import { api } from '@/lib/api'

interface Props {
  projectPath: string
}

function TreeNode({ node, depth = 0 }: { node: FSNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const isDir = node.type === 'directory'

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
        const data = await api.get<{ content: string; path: string }>(`/api/fs/file?path=${encodeURIComponent(node.path)}`)
        setFileContent(data.content)
      } catch (_) {
        setFileContent('⚠ Could not read file')
      } finally {
        setLoadingFile(false)
      }
    }
  }

  const ext = node.name.includes('.') ? node.name.split('.').pop() ?? '' : ''
  const ICON: Record<string, string> = {
    py: '🐍', ts: '⬡', tsx: '⬡', js: '⬡', json: '{}', md: '📝',
    css: '🎨', html: '◻', toml: '⚙', yaml: '⚙', yml: '⚙', env: '🔑',
    txt: '📄', sh: '⚡', sql: '🗄', ipynb: '📓',
  }
  const icon = isDir ? (open ? '▾' : '▸') : (ICON[ext] ?? '·')

  return (
    <div>
      <button
        onClick={() => void handleClick()}
        className="w-full flex items-center gap-1.5 py-0.5 text-left transition-colors cursor-pointer rounded"
        style={{
          paddingLeft: `${(depth * 12) + 8}px`,
          color: isDir ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
          background: 'transparent',
          fontSize: '12px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-elevated)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span className="text-xs w-4 text-center flex-shrink-0">{icon}</span>
        <span className="truncate">{node.name}</span>
        {loadingFile && <span className="ml-auto text-xs opacity-50 animate-pulse">loading</span>}
      </button>

      {/* Inline file preview */}
      {fileContent !== null && (
        <div style={{ paddingLeft: `${(depth * 12) + 8}px` }}>
          <pre
            className="text-xs overflow-x-auto my-1 rounded-lg px-3 py-2"
            style={{
              background: 'var(--color-base)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--color-border)',
              maxHeight: '300px',
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
      {isDir && open && node.children?.map(child => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function FileExplorer({ projectPath }: Props) {
  const [tree, setTree] = useState<FSNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'explorer' | 'mcp' | 'agents'>('explorer')

  useEffect(() => {
    setLoading(true)
    api.get<{ tree: FSNode[] }>(`/api/fs/tree?path=${encodeURIComponent(projectPath)}`)
      .then(data => setTree(data.tree))
      .catch(() => setError('Failed to load file tree'))
      .finally(() => setLoading(false))
  }, [projectPath])

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        width: '260px',
        flexShrink: 0,
      }}
    >
      {/* Tab bar */}
      <div
        className="flex gap-px px-2 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {(['explorer', 'mcp', 'agents'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer"
            style={{
              background: activeTab === tab ? 'var(--color-elevated)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {tab === 'mcp' ? '.mcp.json' : tab === 'agents' ? 'AGENTS.md' : 'Files'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {activeTab === 'explorer' && (
          <>
            {loading && (
              <div className="flex items-center justify-center h-20">
                <span className="text-xs animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading tree…</span>
              </div>
            )}
            {error && (
              <div className="px-4 py-3 text-xs" style={{ color: 'oklch(0.65 0.22 25)' }}>{error}</div>
            )}
            {!loading && !error && tree.map(node => (
              <TreeNode key={node.path} node={node} depth={0} />
            ))}
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
    api.get<{ content: string }>(`/api/fs/file?path=${encodeURIComponent(path)}`)
      .then(d => setContent(d.content))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [projectPath, filename])

  if (loading) return (
    <div className="flex items-center justify-center h-20">
      <span className="text-xs animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
    </div>
  )

  if (!content) return (
    <div className="px-4 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
      <em>{filename}</em> not found in this project
    </div>
  )

  return (
    <pre
      className="text-xs px-3 py-3 whitespace-pre-wrap break-all"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.5',
      }}
    >
      {content}
    </pre>
  )
}
