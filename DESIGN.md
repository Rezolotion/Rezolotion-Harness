# Rezolotion Harness — Design System Specification

## 1. Philosophy & Aesthetic Direction
- **Reference Models:** Linear, Vercel Dashboard, Claude.ai.
- **Design Spirit:** Dark-first, restrained, precise engineering tool.
- **Rule Zero:** No visual noise. Every pixel must serve information density and legibility.
- **No Emojis:** Strictly prohibited anywhere in the interface or system badges.
- **No Inline Hand-Drawn SVGs:** Use standardized icon packages (`lucide-react` for system actions, `@icons-pack/react-simple-icons` or `simple-icons` for brand logos).

---

## 2. Color System & Surfaces

### Token Architecture (OKLCH CSS Custom Properties)
All colors must be declared once in `src/styles/tokens.css`. Never use arbitrary hex values in JSX or Tailwind utility classes.

### 3 Elevation Surfaces (Dark-First)
1. **Base Background (`--bg-base`):** `oklch(0.14 0.005 260)` (#121316) — The deepest layer, canvas of the app.
2. **Surface (`--bg-surface`):** `oklch(0.18 0.006 260)` (#1a1b1f) — Panels, sidebars, cards, and input areas.
3. **Elevated (`--bg-elevated`):** `oklch(0.22 0.007 260)` (#22242a) — Menus, dropdowns, dialogs, floating toolbars.

### Hairline Borders
- Surfaces are separated **exclusively by 1px borders at 8–10% alpha**, never by drop shadows:
  - `--border-subtle`: `oklch(1 0 0 / 0.08)`
  - `--border-hover`: `oklch(1 0 0 / 0.15)`
  - `--border-active`: `oklch(1 0 0 / 0.25)`

### Shadows
- Shadows are reserved **strictly for floating overlays** (Command Palette, Popovers, Modals, Drawers):
  - `--shadow-overlay`: `0 12px 32px -4px rgba(0, 0, 0, 0.45), 0 4px 12px -2px rgba(0, 0, 0, 0.25)`

### Single Accent Color
- Primary Action Accent: `--accent`: `oklch(0.65 0.20 250)` (Engineering Electric Indigo).
- Foreground: `--accent-fg`: `oklch(0.98 0 0)`.

### Agent Identity (Zero Colored Panels)
Agent attribution must never use colored gradient panels or colored text backgrounds.
Use a **2px status dot** + clean label:
- Claude: Status dot `oklch(0.68 0.16 45)` (Terracotta) + label
- Gemini / AntiGravity: Status dot `oklch(0.72 0.18 150)` (Emerald Teal) + label
- DeepSeek: Status dot `oklch(0.62 0.18 250)` (Royal Blue) + label
- OpenAI / Codex: Status dot `oklch(0.70 0.15 160)` (Mint) + label

---

## 3. Typography & Hierarchy

### Font Families
- **Interface Text (UI):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, sans-serif.
- **Code & Numbers:** `JetBrains Mono`, monospace.
- **Persian Text:** `Vazirmatn`, sans-serif.

### Type Scale
- `text-xs`: 12px / 16px line-height (metadata, timestamps, hotkeys)
- `text-sm`: 13px / 18px line-height (secondary labels, table rows)
- `text-base`: 14px / 22px line-height (chat body text, primary inputs) — **Body Default**
- `text-md`: 16px / 24px line-height (section subtitles, card headers)
- `text-lg`: 20px / 28px line-height (panel titles, modal headers)
- `text-xl`: 24px / 32px line-height (top-level page titles)

---

## 4. Spacing & Radius Scale

### Border Radius
- `rounded-sm`: `6px` (badges, inner pills, buttons)
- `rounded-md`: `10px` (cards, inputs, dropdown menus)
- `rounded-lg`: `14px` (modals, sheet drawers, outer panels)

### Motion & Transitions
- Micro-interactions: `150ms ease-out`.
- Transitions limited strictly to `opacity` and subtle `translateY(2px)`.
- No bouncy, playful spring physics.

---

## 5. Light Mode Derived Tokens
Light mode uses inverted values mapped to the exact same CSS variable names (`--bg-base`, `--bg-surface`, `--bg-elevated`). 
No custom component-level CSS logic for theme branching.
