# Rezolotion Studio — Brand Book & Design System Contract

> **Version**: 2.0 (Production / Commercial Grade)  
> **Target Audience**: AI Agentic Workspaces & Autonomous Engineering Studios  
> **Benchmark Standard**: Hybrid of **Linear**, **Vercel**, **Claude Desktop**, and **AntiGravity (Google)**  

---

## 1. Core Design Philosophy

1. **Dark-First, Zero-Distraction**:
   The studio is a deep-focus engineering environment. Backgrounds are deep, matte, and non-reflective. Bright accents are reserved strictly for active states, indicators, and key user actions.
2. **Absolute Zero-Emoji Policy**:
   Emojis are strictly prohibited across all UI surfaces (trees, buttons, cards, headers). All iconography must be rendered exclusively through clean vector glyphs from `lucide-react` or official SVG brand logos.
3. **Multi-Depth Surface Elevation (3-Tier Layering)**:
   Depth is achieved through calibrated lightness shifts rather than heavy drop shadows:
   - **Base** (`--bg-base`): The foundational canvas layer (#09090b / `oklch(0.12 0.005 260)`).
   - **Surface** (`--bg-surface`): Structural containers, sidebars, panels (#121215 / `oklch(0.15 0.006 260)`).
   - **Elevated** (`--bg-elevated`): Active controls, button surfaces, list items (#18181b / `oklch(0.19 0.007 260)`).
   - **Card / Floating** (`--bg-card`): Floating islands, popovers, modals (#1f1f23 / `oklch(0.23 0.008 260)`).
4. **Hairline Micro-Borders**:
   Dividers and outlines must use subtle white alpha overlays:
   - Subtly visible: `oklch(1 0 0 / 0.07)`
   - Hover highlight: `oklch(1 0 0 / 0.14)`
   - Active focus ring: `oklch(1 0 0 / 0.22)`

---

## 2. Color Tokens (OKLCH Specification)

### Theme Surfaces
```css
--bg-base:      oklch(0.12 0.005 260); /* 12% Lightness - Pitch void */
--bg-surface:   oklch(0.15 0.006 260); /* 15% Lightness - Structural panels */
--bg-elevated:  oklch(0.19 0.007 260); /* 19% Lightness - Controls & hover */
--bg-card:      oklch(0.23 0.008 260); /* 23% Lightness - Floating dialogs */
```

### Typography Hierarchy
```css
--fg-primary:   oklch(0.96 0.005 260); /* High-contrast white for titles */
--fg-secondary: oklch(0.72 0.010 260); /* Medium contrast for body */
--fg-muted:     oklch(0.48 0.012 260); /* Low contrast for meta & timestamps */
```

### Brand & Model Accents
```css
--color-accent:     oklch(0.68 0.18 250); /* Rezolotion Indigo */
--color-claude:     oklch(0.68 0.16 45);  /* Anthropic Terracotta */
--color-gemini:     oklch(0.72 0.18 165); /* Google AntiGravity Teal */
--color-openai:     oklch(0.70 0.15 110); /* OpenAI Emerald */
--color-deepseek:   oklch(0.62 0.18 265); /* DeepSeek Royal Blue */
--color-openrouter: oklch(0.65 0.20 300); /* OpenRouter Magenta */
--color-hermes:     oklch(0.75 0.18 70);  /* Nous Amber */
```

---

## 3. Typography & Font Stacks

- **Primary UI Font**: `'Inter', system-ui, -apple-system, sans-serif`  
  Feature settings: `'cv02', 'cv03', 'cv04', 'cv11'` enabled for tabular alignment and crisp legibility.
- **Code & Path Font**: `'JetBrains Mono', 'Fira Code', monospace`  
  Used for all file paths, token counts, tool commands, diff blocks, and execution steps.
- **Persian & RTL Fallback**: `'Vazirmatn', sans-serif`  
  Smoothly renders Persian conversation threads with natural baseline alignment.

### Type Scale
- `text-2xs`: 10px / 14px line-height (Badges, metadata tags)
- `text-xs`:  12px / 16px line-height (Secondary UI, buttons, file items)
- `text-sm`:  13px / 18px line-height (Default chat body text)
- `text-base`:14px / 20px line-height (Dialog headers, section labels)
- `text-lg`:  18px / 24px line-height (Card titles, modal headings)

---

## 4. UI Geometry & Radii

- **Micro Controls (Badges, tool tags)**: `rounded-md` (6px)
- **Standard Inputs, Buttons & Tree Items**: `rounded-lg` (8px to 10px)
- **Cards, Execution Blocks, Composer Island**: `rounded-2xl` (16px)
- **Modals & Overlays**: `rounded-2xl` (16px to 20px)

---

## 5. Interaction & Motion Rules

1. **Transition Speed**: All hover, focus, and state shifts must complete within `150ms` using `cubic-bezier(0, 0, 0.2, 1)`.
2. **Backdrop Blur**: Floating overlays must use `backdrop-filter: blur(8px)` with semi-opaque backgrounds (`rgba(0,0,0,0.75)`).
3. **No Heavy Dropshadows**: Avoid muddy drop shadows. Use crisp multi-step shadows for floating elements:
   `box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--color-border);`
