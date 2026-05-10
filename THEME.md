# 🎨 Traveloop — Design System & Theme Guide

> **This file is the single source of truth for all visual decisions.**
> Every contributor must follow these guidelines to ensure a consistent look.

---

## Quick Start

### In CSS (Module files or globals)
Use the CSS custom properties defined in `app/globals.css`:
```css
.myButton {
  background: var(--tl-primary);
  border-radius: var(--tl-radius-full);
  box-shadow: var(--tl-shadow-md);
  transition: var(--tl-transition);
}
```

### In TypeScript / TSX
Import from the centralized theme file:
```tsx
import { colors, gradients, radii } from "@/app/lib/theme";

const style = {
  background: gradients.primary,
  borderRadius: radii.full,
  color: colors.primary,
};
```

---

## 🎨 Color Palette

### Brand Colors
| Token               | Hex         | Usage                                    |
|----------------------|-------------|------------------------------------------|
| `--tl-primary`       | `#0f766e`   | Buttons, links, primary actions          |
| `--tl-primary-light` | `#14b8a6`   | Gradients, hover states, highlights      |
| `--tl-primary-dark`  | `#0d5c56`   | Active/pressed states                    |
| Cyan                 | `#06b6d4`   | Secondary gradient stop                  |
| `--tl-accent`        | `#f59e0b`   | Step badges, warm highlights, warnings   |
| `--tl-accent-light`  | `#fbbf24`   | Accent hover states                      |

### Semantic Colors
| Token     | Hex         | Usage         |
|-----------|-------------|---------------|
| Danger    | `#ef4444`   | Errors, destructive actions |
| Success   | `#22c55e`   | Success states, confirmations |
| Warning   | `#f59e0b`   | Warnings (same as accent) |
| Info      | `#3b82f6`   | Informational badges |

### Surfaces
| Token                  | Hex         | Usage                            |
|------------------------|-------------|----------------------------------|
| `--tl-bg`              | `#f8fafc`   | Page background                  |
| `--tl-surface`         | `#ffffff`   | Cards, content areas             |
| Dark surface           | `#0f172a`   | Footer, CTA cards                |
| Dark surface alt       | `#1e293b`   | Dark card gradients              |

### Text
| Token                  | Value                          | Usage                    |
|------------------------|--------------------------------|--------------------------|
| `--tl-text`            | `#0f172a`                      | Headings, body text      |
| `--tl-text-secondary`  | `#475569`                      | Descriptions, subtitles  |
| `--tl-text-muted`      | `#94a3b8`                      | Captions, placeholders   |
| On dark                | `#ffffff`                      | White text on dark BG    |
| On dark secondary      | `rgba(255, 255, 255, 0.75)`    | Subtle text on dark BG   |
| On dark muted          | `rgba(255, 255, 255, 0.45)`    | Very subtle on dark BG   |

---

## ✏️ Typography

### Font Family
- **Primary:** `Geist Sans` (loaded via `next/font/google` in layout.tsx)
- **Monospace:** `Geist Mono` (for code blocks)
- CSS: `var(--font-geist-sans)` / `var(--font-geist-mono)`

### Font Sizes
| Name     | Size                          | Usage                    |
|----------|-------------------------------|--------------------------|
| xs       | `0.75rem` (12px)              | Badges, fine print       |
| sm       | `0.85rem` (~14px)             | Captions, labels         |
| base     | `1rem` (16px)                 | Body text, buttons       |
| lg       | `1.1rem` (~18px)              | Subtitles                |
| xl       | `1.25rem` (20px)              | Card titles              |
| 2xl      | `1.5rem` (24px)               | Stat numbers             |
| 3xl      | `2rem` (32px)                 | Section headings (min)   |
| 4xl      | `3rem` (48px)                 | Section headings (max)   |
| hero     | `clamp(2.5rem, 6vw, 4.5rem)` | Hero headline            |

### Font Weights
| Weight    | Value | Usage                        |
|-----------|-------|------------------------------|
| normal    | 400   | Body text                    |
| medium    | 500   | Nav links, labels            |
| semibold  | 600   | Buttons, subtitles           |
| bold      | 700   | Card titles, stat numbers    |
| extrabold | 800   | Section headings, hero       |

### Letter Spacing
- **Headings:** `-0.02em` to `-0.03em` (tight)
- **Body:** `0`
- **Labels/badges:** `0.02em` to `0.12em` (wide, uppercase)

---

## 📐 Spacing & Layout

### Spacing Scale
| Token | Size   | Usage                          |
|-------|--------|--------------------------------|
| xs    | 4px    | Tight gaps                     |
| sm    | 8px    | Icon gaps, badge padding       |
| md    | 12px   | Small element gaps             |
| base  | 16px   | Default padding, card gaps     |
| lg    | 20px   | Medium padding                 |
| xl    | 24px   | Section horizontal padding     |
| 2xl   | 32px   | Element groups                 |
| 3xl   | 48px   | Section dividers               |
| 4xl   | 64px   | Section header margins         |
| 5xl   | 80px   | Mobile section padding         |
| 6xl   | 120px  | Desktop section padding        |

### Layout Constants
| Token              | Value    | Usage                        |
|--------------------|----------|------------------------------|
| Max width          | 1200px   | Main content container       |
| Max width narrow   | 800px    | Hero text, narrow content    |
| Navbar height      | 72px     | Desktop navbar               |
| Navbar height mobile| 64px    | Mobile navbar                |
| Section padding    | 120px    | Desktop vertical padding     |
| Section padding mobile | 80px | Mobile vertical padding      |

---

## 🌊 Gradients

| Name      | Value                                                           | Usage                      |
|-----------|-----------------------------------------------------------------|----------------------------|
| Primary   | `linear-gradient(135deg, #0f766e, #14b8a6)`                    | Buttons, nav CTA           |
| Hero      | `linear-gradient(135deg, #0f766e, #14b8a6 50%, #06b6d4)`       | Hero backgrounds           |
| Warm      | `linear-gradient(135deg, #f59e0b, #ef4444)`                    | Step number badges         |
| Text      | `linear-gradient(135deg, #14b8a6, #06b6d4, #f59e0b)`           | Gradient text effect       |
| Dark      | `linear-gradient(135deg, #0f172a, #1e293b)`                    | CTA cards, dark sections   |

### Gradient Text Pattern
```css
.gradientText {
  background: linear-gradient(135deg, #14b8a6, #06b6d4, #f59e0b);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 🪟 Glassmorphism

We use glassmorphism for elevated UI elements. Three presets:

### Dark Glass (hero overlays, dark sections)
```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.15);
```

### Light Glass (navbar, light cards)
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

### Navbar Glass
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(226, 232, 240, 0.6);
```

---

## 🔲 Border Radii

| Token  | Size     | Usage                             |
|--------|----------|-----------------------------------|
| sm     | 8px      | Small badges, inputs              |
| md     | 12px     | Feature icons, small cards        |
| lg     | 16px     | Destination cards, content cards  |
| xl     | 24px     | CTA cards, modals                 |
| full   | 9999px   | Buttons, pills, badges            |

---

## 🌑 Shadows

| Token  | Value                               | Usage                      |
|--------|-------------------------------------|----------------------------|
| sm     | `0 1px 2px rgba(0,0,0,0.05)`       | Subtle elevation           |
| md     | `0 4px 12px rgba(0,0,0,0.08)`      | Cards at rest              |
| lg     | `0 12px 40px rgba(0,0,0,0.12)`     | Cards on hover             |
| xl     | `0 20px 60px rgba(0,0,0,0.15)`     | Destination card hover     |

---

## ⚡ Transitions

| Name    | Value                                    | Usage                    |
|---------|------------------------------------------|--------------------------|
| Default | `0.3s cubic-bezier(0.4, 0, 0.2, 1)`     | Most interactions        |
| Slow    | `0.5s cubic-bezier(0.4, 0, 0.2, 1)`     | Large element transitions|
| Fast    | `0.15s cubic-bezier(0.4, 0, 0.2, 1)`    | Micro-interactions       |

---

## 🏗️ Z-Index Scale

| Layer     | Value | Usage                             |
|-----------|-------|-----------------------------------|
| Base      | 0     | Default content                   |
| Dropdown  | 100   | Dropdown menus                    |
| Sticky    | 200   | Sticky headers                    |
| Modal     | 500   | Modal dialogs                     |
| Overlay   | 600   | Modal backdrops                   |
| Navbar    | 1000  | Fixed navigation bar              |
| Toast     | 1100  | Toast notifications               |
| Tooltip   | 1200  | Tooltips                          |

---

## 📱 Breakpoints

| Name | Width   | Usage                      |
|------|---------|----------------------------|
| sm   | 640px   | Mobile landscape           |
| md   | 768px   | Tablets                    |
| lg   | 1024px  | Small desktops             |
| xl   | 1280px  | Large desktops             |

---

## 🎬 Animations

Available keyframes in `globals.css` (also redeclare in `.module.css` if needed):

| Name           | Effect              | Duration | Usage                   |
|----------------|---------------------|----------|-------------------------|
| `fadeInUp`     | Fade in + slide up  | 0.8s     | Section entries         |
| `fadeIn`       | Simple fade in      | 0.6s     | Delayed elements        |
| `slideInLeft`  | Slide from left     | 0.8s     | Left-aligned content    |
| `slideInRight` | Slide from right    | 0.8s     | Right-aligned content   |
| `scaleIn`      | Scale from 90%      | 0.6s     | Cards, modals           |
| `float`        | Gentle vertical bob | 4s loop  | Decorative elements     |
| `pulse-glow`   | Pulsing box shadow  | 2s loop  | Status indicators       |
| `shimmer`      | Loading shimmer     | —        | Skeleton loaders        |

> **⚠️ CSS Modules Note:** Keyframes defined in `globals.css` are NOT automatically
> available inside `.module.css` files. You must redeclare needed keyframes
> at the top of your module file.

---

## 📁 File Structure

```
app/
├── globals.css              ← CSS variables + animations + resets
├── lib/
│   ├── theme.ts             ← TypeScript theme constants (import this!)
│   └── prisma.ts            ← Database client
├── components/
│   ├── Navbar.tsx + .module.css
│   ├── HeroSection.tsx + .module.css
│   ├── DestinationsSection.tsx + .module.css
│   ├── FeaturesSection.tsx + .module.css
│   ├── HowItWorks.tsx + .module.css
│   ├── CTASection.tsx + .module.css
│   └── Footer.tsx + .module.css
└── page.tsx                 ← Assembles all sections
```

---

## ✅ Do's and Don'ts

### ✅ Do
- Use CSS custom properties (`var(--tl-*)`) in your `.module.css` files
- Import from `@/app/lib/theme` for inline styles in TSX
- Use CSS Modules (`.module.css`) for component-specific styles
- Keep all components in `app/components/`
- Use `next/link` for internal navigation, `next/image` for images
- Follow the spacing scale — don't use arbitrary values
- Use the glassmorphism presets for elevated elements

### ❌ Don't
- Don't hardcode color hex values — always use theme tokens
- Don't use inline styles for colors/shadows — use CSS variables
- Don't add global class names outside `globals.css`
- Don't create new font imports — we use Geist Sans/Mono only
- Don't skip hover/focus states on interactive elements
- Don't use `z-index` values outside the defined scale
