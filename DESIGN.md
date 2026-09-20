# Rezolotion Harness — Design System Contract

> **Status: RATIFIED.** This document is the single design authority for the repository.
> It is the outcome of a direct negotiation between the two agents working on this codebase —
> Claude (Claude Code CLI) and AntiGravity (`agy`) — conducted on 2026-09-20.
> Every numeric value below was agreed by both. See the Decision Log in section 13.
>
> **Rule for every future task, by either agent: read this file first, and do not renegotiate a
> locked value.** If a value here is wrong, change it here in its own commit, with a reason —
> never silently in an implementation commit.

---

## 0. Where tokens live

The frontend runs **Tailwind CSS v4** (`@tailwindcss/postcss`). In v4 a JavaScript config file is
opt-in and is loaded only through an explicit `@config` directive. There is no such directive.

**Therefore `frontend/tailwind.config.ts` is never read and must not exist.**
The single source of truth is the `@theme` block in `frontend/src/styles/globals.css`,
which consumes the raw values declared in `frontend/src/styles/tokens.css`.

```
tokens.css   → raw OKLCH values, light/dark, nothing else
globals.css  → @theme mapping tokens to Tailwind utilities + @layer base
components   → utilities only; never a raw color, size, or radius
```

A value that exists in only one of those three places is a bug.

---

## 1. Philosophy

- **Reference models:** Linear, Vercel dashboard, Claude.ai.
- **Spirit:** dark-first, restrained, precise engineering tool.
- **Rule zero:** no visual noise. Every pixel serves information density and legibility.
- **No emojis.** Anywhere. Interface, badges, empty states, commit-facing strings.
- **No hand-drawn inline SVG.** `lucide-react` for actions, `@icons-pack/react-simple-icons`
  for brand marks. An icon drawn by hand in JSX is a defect.

---

## 2. Color and surfaces

### Three elevation levels, separated by hairlines — never by shadow

| Level | Token | Dark | Use |
|---|---|---|---|
| 0 | `--bg-base` | `oklch(0.14 0.005 260)` | app canvas, workspace background |
| 1 | `--bg-surface` | `oklch(0.18 0.006 260)` | panels, sidebars, cards, inputs |
| 2 | `--bg-elevated` | `oklch(0.22 0.007 260)` | menus, popovers, dialogs, floating bars |

Borders: `--border-subtle` `oklch(1 0 0 / 0.08)`, `--border-hover` `/ 0.15`,
`--border-active` `/ 0.25`. One pixel. Always.

Shadows: exactly one token, `--shadow-overlay`, and it is permitted **only** on floating
overlays (command palette, popover, dialog, drawer). A shadow on a static panel is a defect.

### One accent

`--accent: oklch(0.65 0.20 250)` · `--accent-fg: oklch(0.98 0 0)` · `--accent-muted: … / 0.15`.
`--destructive: oklch(0.62 0.22 25)`.

There is no second accent. Per-agent colour is **not** an accent — see below.

### Agent identity — a 6px status dot and a text label, nothing else

Never a coloured panel, gradient background, tinted bubble, or coloured text block.
Hues are spaced at least 40° apart so the dots stay distinguishable at 6px:

| Agent | Token | Value | Hue |
|---|---|---|---|
| Claude Code | `--agent-claude` | `oklch(0.68 0.16 45)` | 45 |
| Codex / GPT | `--agent-codex` | `oklch(0.70 0.15 110)` | 110 |
| AntiGravity / Gemini | `--agent-gemini` | `oklch(0.72 0.18 165)` | 165 |
| DeepSeek | `--agent-deepseek` | `oklch(0.62 0.18 265)` | 265 |

> Changed from the first draft, where gemini (150) and codex (160) sat 10° apart and were
> indistinguishable as dots. Raised by Claude, values chosen by AntiGravity.

### Focus ring

```css
--ring: oklch(0.65 0.20 250 / 0.6);

.focus-ring {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

`outline`, never `box-shadow` — box-shadow rings are suppressed in forced-colors mode.
Every interactive element carries a visible focus ring. This is a release gate, not a nicety.

---

## 3. Typography — locked

```js
xs:   ['12px', '16px']   // metadata, timestamps, hotkeys
sm:   ['13px', '18px']   // secondary labels, table rows
base: ['14px', '22px']   // BODY DEFAULT — chat text, inputs
md:   ['16px', '24px']   // section subtitles, card headers
lg:   ['20px', '28px']   // panel titles, modal headers
xl:   ['24px', '32px']   // page titles
```

Declared as `--text-*` entries inside the `@theme` block of `globals.css`.
Until they are declared there, `text-base` resolves to Tailwind's 16px default and this scale
is fiction — which was measured to be the case at ratification time.

Families: **Inter** (UI) · **JetBrains Mono** (code, numerals, token counts) · **Vazirmatn** (Persian).

Fonts are installed locally via `@fontsource/inter`, `@fontsource/jetbrains-mono`,
`@fontsource/vazirmatn` and imported from `globals.css`. **No `<link>` to fonts.googleapis.com** —
this is a local-first tool and must run air-gapped with no request on launch.

---

## 4. Spacing and radius — closed sets

Spacing: `4 · 8 · 12 · 16 · 24 · 32` px. Nothing else. No arbitrary `p-[13px]`.

Radius: `--radius-sm: 6px` (badges, pills, buttons) · `--radius-md: 10px` (cards, inputs, menus)
· `--radius-lg: 14px` (modals, drawers, outer panels). Three values, no fourth.

---

## 5. Motion

150ms `ease-out`. Only `opacity` and a 2px `translateY`. No spring physics, no bounce, no scale.
`framer-motion` is restricted to message entry and drawer open/close.

Respect `prefers-reduced-motion: reduce` by dropping the transform and keeping the opacity fade.

---

## 6. RTL and Persian

- Direction is set on `<html>`; components never assume a side.
- **CSS logical properties only.** `ps-*`/`pe-*`, `ms-*`/`me-*`, `start`/`end`, `border-inline-*`.
  Physical `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left`, `right` are defects.
- Latin identifiers, code spans, and numerals embedded in Persian prose are wrapped in `<bdi>`
  so bidi reordering does not scramble them.
- **Known first failure point**, flagged by AntiGravity: split-pane drag handles and terminal
  horizontal-scroll maths that derive offsets from `e.clientX` relative to the left edge.
  These must be computed against the inline-start edge, not the physical left.

---

## 7. Blur and glass budget

`backdrop-filter` is permitted at **two call sites only**: the command palette and the popover.
That is the entire budget. The previous UI had five and read as a toy.

No gradient may be used as a surface, panel, or agent background. Gradients are not a design
element in this system.

---

## 8. Streaming surfaces

*Contributed by AntiGravity as the gap neither of us had specified.*

Multi-agent streaming produces high-frequency DOM churn, which is the single most likely cause
of the UI freezing under real load. Every streaming surface must therefore declare:

- **A stick-to-bottom contract.** Auto-scroll while the user is pinned to the bottom; the moment
  they scroll up, detach and show a "jump to latest" affordance. Never yank the viewport.
- **Virtualization.** Message lists and tool-output logs render only the visible window.
- **Batched flushes.** Token deltas coalesce on animation frames rather than committing per event.

---

## 9. Light mode

Derived from the same variable names — `--bg-base`, `--bg-surface`, `--bg-elevated`, and the rest.
No component-level theme branching, no `dark:` variant carrying design decisions.
The theme provider sets both the class and `data-theme` on `<html>`.

---

## 10. Enforcement

Taste does not survive fifty tasks; a failing build does. `npm run design:lint` fails on:

1. Any `#hex`, `rgb()`, `rgba()`, `hsl()` literal in `frontend/src/**` outside `tokens.css`.
2. Arbitrary-value classes: `p-[…]`, `text-[…]`, `w-[…]`, `rounded-[…]`, and friends.
3. More than two `backdrop-filter` / `backdrop-blur` call sites.
4. Any `gradient(` in component source.
5. Physical direction utilities (`pl-`, `pr-`, `ml-`, `mr-`) — logical properties only.
6. Emoji in any source file.
7. A `border-radius` value that is not one of the three tokens.
8. The existence of `frontend/tailwind.config.ts`.

A violation is a build failure, not a warning.

---

## 11. Acceptance gate per step

- `tsc --noEmit` passes, strict, zero `any`.
- `npm run design:lint` passes.
- Every interactive element reachable and visibly focused via keyboard.
- Renders correctly at 1280px and 1920px.
- No mock or placeholder data in committed code.
- Persian smoke test: a long RTL paragraph containing Latin code and numerals renders correctly.

---

## 12. Decision log

| # | Issue | Raised by | Resolution |
|---|---|---|---|
| 1 | Gemini and Codex dot hues 10° apart, identical at 6px | Claude | AntiGravity respaced to 45 / 110 / 165 / 265 |
| 2 | No focus-ring token despite an accessibility acceptance criterion | Claude | `--ring` + `.focus-ring` using `outline` |
| 3 | "Spacing & Radius" section defined no spacing | Claude | Closed set 4/8/12/16/24/32 |
| 4 | Type scale never enforced; AntiGravity's first reply drifted to 11/15/18/22 and a 1.43 body ratio | Claude | AntiGravity withdrew the drift; DESIGN.md scale holds, body 14/22 |
| 5 | Fonts loaded from a CDN in a local-first tool | Claude | `@fontsource` packages |
| 6 | No RTL strategy despite Vazirmatn in the stack | Claude | Logical properties, `<bdi>`; AntiGravity identified `clientX` panes as first breakage |
| 7 | `components.json` missing, so shadcn CLI unusable | Claude | Required before step 3 |
| 8 | No blur budget | Claude | Two call sites; AntiGravity added the literal-colour and arbitrary-class lint rules |
| 9 | Tailwind v4 ignores `tailwind.config.ts` with no `@config`; its whole theme block is inert | Claude, measured in the running page | Delete the config; `@theme` is the sole source |
| 10 | No contract for high-frequency streaming surfaces | AntiGravity | Section 8 |
