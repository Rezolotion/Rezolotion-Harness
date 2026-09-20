import { useState } from 'react'
import { Sun, Moon, Terminal } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ui/status-dot'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function KitchenSinkPage() {
  const { theme, toggleTheme } = useTheme()
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen bg-base text-fg p-6 sm:p-10 max-w-7xl mx-auto space-y-10">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border-subtle gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-sm bg-accent flex items-center justify-center text-accent-fg">
              <Terminal className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-fg">Rezolotion Harness</h1>
            <Badge variant="accent">Step 1: Design Tokens & Primitives</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-1">
            Strict engineering-tool aesthetic, OKLCH token system, 3 elevation levels, zero emojis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="subtle" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* 1. Surfaces & Elevation Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight uppercase text-fg-muted">
            1. Surfaces & Elevation Scale (1px Hairline Borders, Zero Box-Shadow)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-md border border-border-subtle bg-base space-y-2">
            <span className="text-xs font-mono text-fg-subtle">Level 0: --bg-base</span>
            <p className="text-sm font-medium text-fg">Base Canvas</p>
            <p className="text-xs text-fg-muted">Deepest background surface for app canvas and workspace background.</p>
          </div>

          <div className="p-4 rounded-md border border-border-subtle bg-surface space-y-2">
            <span className="text-xs font-mono text-fg-subtle">Level 1: --bg-surface</span>
            <p className="text-sm font-medium text-fg">Surface Layer</p>
            <p className="text-xs text-fg-muted">Panels, input containers, sidebars, and structural content cards.</p>
          </div>

          <div className="p-4 rounded-md border border-border-subtle bg-elevated space-y-2">
            <span className="text-xs font-mono text-fg-subtle">Level 2: --bg-elevated</span>
            <p className="text-sm font-medium text-fg">Elevated Layer</p>
            <p className="text-xs text-fg-muted">Dropdowns, popovers, context drawers, and modal dialog content.</p>
          </div>
        </div>
      </section>

      {/* 2. Agent Status Dots Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-fg-muted">
          2. Agent Identity (2px / 6px Status Dots + Label, Zero Colored Panels)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-sm border border-border-subtle bg-surface">
            <StatusDot agent="claude" pulse />
            <span className="text-xs font-medium text-fg">Claude Code</span>
            <span className="text-xs font-mono text-fg-subtle ms-auto">Terracotta</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-sm border border-border-subtle bg-surface">
            <StatusDot agent="gemini" pulse />
            <span className="text-xs font-medium text-fg">AntiGravity</span>
            <span className="text-xs font-mono text-fg-subtle ms-auto">Teal</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-sm border border-border-subtle bg-surface">
            <StatusDot agent="deepseek" />
            <span className="text-xs font-medium text-fg">DeepSeek R1</span>
            <span className="text-xs font-mono text-fg-subtle ms-auto">Royal Blue</span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-sm border border-border-subtle bg-surface">
            <StatusDot agent="codex" />
            <span className="text-xs font-medium text-fg">Codex / GPT-4o</span>
            <span className="text-xs font-mono text-fg-subtle ms-auto">Mint</span>
          </div>
        </div>
      </section>

      {/* 3. Typography Scale & Multilingual Support */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-fg-muted">
          3. Typography & Multilingual Hierarchy (Inter / JetBrains Mono / Vazirmatn)
        </h2>

        <Card elevation="surface">
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle pb-2">
              <span className="text-xl font-bold">Display Title (text-xl / 24px)</span>
              <span className="text-xs font-mono text-fg-subtle">Inter 700</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle pb-2">
              <span className="text-base font-medium">Body Text (text-base / 14px default, line-height 1.6)</span>
              <span className="text-xs font-mono text-fg-subtle">Inter 400</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle pb-2">
              <code className="text-xs font-mono bg-elevated px-2 py-1 rounded-sm text-accent">
                const event: Event = &#123; type: 'tool_call', name: 'bash' &#125;;
              </code>
              <span className="text-xs font-mono text-fg-subtle">JetBrains Mono 400</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
              <span className="text-sm font-persian text-fg" dir="rtl">
                رزولوشن هارنس — محیط ارکستراسیون ایجنت‌های کدنویسی با معماری مدرن و استاندارد
              </span>
              <span className="text-xs font-mono text-fg-subtle">Vazirmatn 400</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Interactive Primitives: Buttons, Inputs, Overlays */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-fg-muted">
          4. Interactive Primitives (Visible Focus Rings, Accessible Radix Overlays)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons & Badges */}
          <Card elevation="surface">
            <CardHeader>
              <CardTitle>Buttons & Badges</CardTitle>
              <CardDescription>CVA-driven variant scale with 150ms transitions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm">Primary Accent</Button>
                <Button variant="subtle" size="sm">Subtle Border</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
                <Button variant="destructive" size="sm">Destructive</Button>
                <Button variant="default" size="sm" disabled>Disabled</Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                <Badge variant="default">Default</Badge>
                <Badge variant="accent">Accent Tag</Badge>
                <Badge variant="destructive">Critical Error</Badge>
                <Badge variant="outline">Monochrome</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Overlays & Tabs */}
          <Card elevation="surface">
            <CardHeader>
              <CardTitle>Radix Overlays & Tabs</CardTitle>
              <CardDescription>Radix Popover, Dialog modal, and Linear-style tabs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="subtle" size="sm">Open Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-fg">Context Inspector</p>
                      <p className="text-xs text-fg-muted">
                        3-elevation floating overlay using shadow-overlay and subtle border.
                      </p>
                      <div className="pt-2 border-t border-border-subtle flex justify-end">
                        <Button size="sm" variant="default">Confirm</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Dialog Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Open Dialog Modal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Permission Request</DialogTitle>
                      <DialogDescription>
                        Agent is requesting permission to run a bash tool command.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-3 bg-base rounded-sm font-mono text-xs text-fg-muted border border-border-subtle">
                      $ git diff --stat HEAD
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm">Deny</Button>
                      <Button variant="default" size="sm">Allow Tool Call</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="skills" className="w-full pt-2 border-t border-border-subtle">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="connectors">Connectors (MCP)</TabsTrigger>
                  <TabsTrigger value="plugins">Plugins</TabsTrigger>
                </TabsList>
                <TabsContent value="skills">
                  <p className="text-xs text-fg-muted py-2">
                    Tab content rendering on --bg-surface without layout shift.
                  </p>
                </TabsContent>
                <TabsContent value="connectors">
                  <p className="text-xs text-fg-muted py-2">
                    Official ~/.claude.json and .mcp.json connectors list.
                  </p>
                </TabsContent>
                <TabsContent value="plugins">
                  <p className="text-xs text-fg-muted py-2">
                    Active workspace plugins and extensions.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Input Test */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-fg-muted">
          5. Precision Input & Focus Ring Test
        </h2>
        <div className="max-w-md">
          <Input
            placeholder="Type / for commands, or write a prompt..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
