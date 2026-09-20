#!/usr/bin/env node
/**
 * Rezolotion Harness — design system lint.
 *
 * Enforces DESIGN.md section 10. Taste does not survive fifty tasks; a failing build does.
 * Ratified by Claude and AntiGravity, 2026-09-20.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const srcDir = join(root, 'frontend', 'src')

/** tokens.css is the one place raw colour values are allowed to exist. */
const TOKEN_FILE = 'tokens.css'
const ALLOWED_RADII = new Set(['var(--radius-sm)', 'var(--radius-md)', 'var(--radius-lg)', '50%', '9999px', 'inherit', '0'])

const violations = []
const report = (file, line, rule, text) =>
  violations.push({ file: relative(root, file), line, rule, text: text.trim().slice(0, 110) })

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return name === 'node_modules' ? [] : walk(p)
    return /\.(ts|tsx|css|js|jsx)$/.test(name) ? [p] : []
  })
}

const files = walk(srcDir)
let blurSites = 0

for (const file of files) {
  const isTokens = basename(file) === TOKEN_FILE
  const lines = readFileSync(file, 'utf8').split('\n')

  lines.forEach((raw, i) => {
    const n = i + 1
    // strip block comments and HTML entities (&#123; is not a hex colour)
    const line = raw.replace(/\/\*.*?\*\//g, '').replace(/&#\d+;/g, '')
    if (/^\s*(\/\/|\*|\/\*)/.test(raw)) return

    // 1. raw colour literals outside tokens.css
    if (!isTokens && /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/.test(line)) {
      report(file, n, 'raw-color', raw)
    }

    // 2. arbitrary-value utilities
    if (/\b(p|px|py|pt|pb|ps|pe|m|mx|my|w|h|text|rounded|gap|bg|border)-\[[^\]]+\]/.test(line)) {
      report(file, n, 'arbitrary-value', raw)
    }

    // 3. blur budget (counted, asserted after the walk)
    if (/backdrop-(filter|blur)/.test(line)) blurSites++

    // 4. gradients are not a design element here
    if (/\bgradient\(/.test(line) || /\bbg-gradient-/.test(line)) {
      report(file, n, 'gradient', raw)
    }

    // 5. physical direction utilities — RTL safety
    if (/\b(pl|pr|ml|mr)-(\d|px|auto)/.test(line)) {
      report(file, n, 'physical-direction', raw)
    }

    // 6. closed spacing set (DESIGN.md section 4) — no 2px sub-steps
    if (/\b(p|px|py|pt|pb|ps|pe|m|mx|my|gap|space-[xy])-\d+\.5\b/.test(line)) {
      report(file, n, 'off-scale-spacing', raw)
    }

    // 7. emoji
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(raw)) {
      report(file, n, 'emoji', raw)
    }

    // 8. off-scale radii
    const radius = line.match(/border-radius:\s*([^;]+);/)
    if (radius && !isTokens && !ALLOWED_RADII.has(radius[1].trim())) {
      report(file, n, 'off-scale-radius', raw)
    }
  })
}

if (blurSites > 2) {
  violations.push({
    file: 'frontend/src', line: 0, rule: 'blur-budget',
    text: `${blurSites} backdrop-filter call sites; DESIGN.md section 7 allows 2 (command palette, popover)`,
  })
}

// 8. Tailwind v4 is CSS-first. A JS config is dead code that silently diverges from @theme.
if (existsSync(join(root, 'frontend', 'tailwind.config.ts')) ||
    existsSync(join(root, 'frontend', 'tailwind.config.js'))) {
  violations.push({
    file: 'frontend/tailwind.config.ts', line: 0, rule: 'dead-tailwind-config',
    text: 'Tailwind v4 ignores this without an @config directive. Tokens belong in globals.css @theme.',
  })
}

if (violations.length === 0) {
  console.log(`design-lint: clean — ${files.length} files, ${blurSites}/2 blur sites used`)
  process.exit(0)
}

const byRule = violations.reduce((acc, v) => ((acc[v.rule] ??= []).push(v), acc), {})
console.error(`design-lint: ${violations.length} violation(s) across ${Object.keys(byRule).length} rule(s)\n`)
for (const [rule, items] of Object.entries(byRule)) {
  console.error(`  ${rule} (${items.length})`)
  for (const v of items.slice(0, 12)) {
    console.error(`    ${v.file}${v.line ? ':' + v.line : ''}  ${v.text}`)
  }
  if (items.length > 12) console.error(`    ... ${items.length - 12} more`)
  console.error('')
}
console.error('See DESIGN.md section 10. These are build failures, not warnings.')
process.exit(1)
