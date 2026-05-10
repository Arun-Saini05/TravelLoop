// ─────────────────────────────────────────────────────────────
//  Traveloop — Centralized Theme Constants
//  Import from "@/app/lib/theme" in any component.
//  CSS variables are defined in globals.css (same values).
// ─────────────────────────────────────────────────────────────

// ── Brand Colors ────────────────────────────────────────────
export const colors = {
  /** Core teal brand color — buttons, links, primary accents */
  primary: "#0f766e",
  /** Lighter teal — gradients, hover states, highlights */
  primaryLight: "#14b8a6",
  /** Darker teal — active / pressed states */
  primaryDark: "#0d5c56",
  /** Cyan — secondary accent in gradients */
  cyan: "#06b6d4",

  /** Amber accent — step badges, warm highlights */
  accent: "#f59e0b",
  /** Lighter amber — hover states of accent elements */
  accentLight: "#fbbf24",

  /** Danger / error red */
  danger: "#ef4444",
  /** Success green */
  success: "#22c55e",
  /** Warning yellow (same as accent) */
  warning: "#f59e0b",
  /** Info blue */
  info: "#3b82f6",
} as const;

// ── Surfaces & Backgrounds ─────────────────────────────────
export const surfaces = {
  /** Page background — very light slate */
  background: "#f8fafc",
  /** Card / content background */
  surface: "#ffffff",
  /** Raised surface (modals, dropdowns) */
  surfaceRaised: "#ffffff",
  /** Dark surface — footer, CTA cards */
  surfaceDark: "#0f172a",
  /** Dark surface secondary */
  surfaceDarkAlt: "#1e293b",
} as const;

// ── Text Colors ─────────────────────────────────────────────
export const text = {
  /** Primary text — headings, body */
  primary: "#0f172a",
  /** Secondary text — descriptions, subtitles */
  secondary: "#475569",
  /** Muted text — captions, placeholders, timestamps */
  muted: "#94a3b8",
  /** Inverted text — white on dark backgrounds */
  onDark: "#ffffff",
  /** Subtle white text on dark backgrounds */
  onDarkSecondary: "rgba(255, 255, 255, 0.75)",
  onDarkMuted: "rgba(255, 255, 255, 0.45)",
} as const;

// ── Borders ─────────────────────────────────────────────────
export const borders = {
  /** Default border — cards, dividers */
  default: "#e2e8f0",
  /** Subtle border — light dividers */
  light: "#f1f5f9",
  /** Focus ring color */
  focus: "#0f766e",
} as const;

// ── Shadows ─────────────────────────────────────────────────
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 12px rgba(0, 0, 0, 0.08)",
  lg: "0 12px 40px rgba(0, 0, 0, 0.12)",
  xl: "0 20px 60px rgba(0, 0, 0, 0.15)",
  /** Colored glow for primary buttons */
  primaryGlow: "0 8px 30px rgba(15, 118, 110, 0.4)",
  primaryGlowHover: "0 12px 40px rgba(15, 118, 110, 0.55)",
} as const;

// ── Gradients ───────────────────────────────────────────────
export const gradients = {
  /** Primary brand gradient — buttons, hero overlays */
  primary: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
  /** Extended brand gradient — hero backgrounds */
  hero: "linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #06b6d4 100%)",
  /** Warm gradient — step badges, secondary accents */
  warm: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  /** Text gradient — animated headings */
  text: "linear-gradient(135deg, #14b8a6, #06b6d4, #f59e0b)",
  /** Dark gradient — CTA cards, footer sections */
  dark: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  /** Glassmorphism background */
  glass: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
} as const;

// ── Border Radii ────────────────────────────────────────────
export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

// ── Spacing (consistent padding/margin scale) ───────────────
export const spacing = {
  /** 4px */   xs: "4px",
  /** 8px */   sm: "8px",
  /** 12px */  md: "12px",
  /** 16px */  base: "16px",
  /** 20px */  lg: "20px",
  /** 24px */  xl: "24px",
  /** 32px */  "2xl": "32px",
  /** 48px */  "3xl": "48px",
  /** 64px */  "4xl": "64px",
  /** 80px */  "5xl": "80px",
  /** 120px */ "6xl": "120px",
} as const;

// ── Typography ──────────────────────────────────────────────
export const typography = {
  fontFamily: {
    /** Primary font — Geist Sans (loaded via next/font) */
    sans: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
    /** Monospace font — Geist Mono (loaded via next/font) */
    mono: "var(--font-geist-mono), 'Courier New', monospace",
  },
  fontSize: {
    xs: "0.75rem",    // 12px — badges, fine print
    sm: "0.85rem",    // ~14px — captions, labels
    base: "1rem",     // 16px — body text, buttons
    lg: "1.1rem",     // ~18px — subtitles
    xl: "1.25rem",    // 20px — card titles
    "2xl": "1.5rem",  // 24px — stat numbers
    "3xl": "2rem",    // 32px — section headings (min)
    "4xl": "3rem",    // 48px — section headings (max)
    hero: "clamp(2.5rem, 6vw, 4.5rem)", // hero headline
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tight: "-0.03em",    // hero headings
    snug: "-0.02em",     // section headings
    normal: "0",
    wide: "0.02em",      // badges, labels
    wider: "0.1em",      // all-caps labels
  },
  lineHeight: {
    tight: 1.1,   // headings
    snug: 1.2,    // subheadings
    normal: 1.5,  // body text
    relaxed: 1.65, // descriptions
    loose: 1.7,   // long-form
  },
} as const;

// ── Transitions ─────────────────────────────────────────────
export const transitions = {
  /** Default — 300ms with material easing */
  default: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  /** Slow — 500ms for larger elements */
  slow: "0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  /** Fast — 150ms for micro-interactions */
  fast: "0.15s cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ── Z-Index Scale ───────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 500,
  overlay: 600,
  navbar: 1000,
  toast: 1100,
  tooltip: 1200,
} as const;

// ── Breakpoints ─────────────────────────────────────────────
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

// ── Layout ──────────────────────────────────────────────────
export const layout = {
  /** Max width for main content areas */
  maxWidth: "1200px",
  /** Max width for narrow content (hero text, etc.) */
  maxWidthNarrow: "800px",
  /** Navbar height */
  navbarHeight: "72px",
  navbarHeightMobile: "64px",
  /** Section padding (vertical) */
  sectionPadding: "120px",
  sectionPaddingMobile: "80px",
} as const;

// ── Glassmorphism Presets ────────────────────────────────────
export const glass = {
  /** Dark glass — hero overlays, dark sections */
  dark: {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
  },
  /** Light glass — navbar, light cards */
  light: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  /** Navbar specific */
  navbar: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
  },
} as const;

// ── Full Theme Object (for passing as a prop) ───────────────
const theme = {
  colors,
  surfaces,
  text,
  borders,
  shadows,
  gradients,
  radii,
  spacing,
  typography,
  transitions,
  zIndex,
  breakpoints,
  layout,
  glass,
} as const;

export type Theme = typeof theme;
export default theme;
