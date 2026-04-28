/**
 * Chero — Design Tokens v2 (paleta oficial)
 *
 * Inspiración: Aura AI vibe — morado profundo con orb gradient.
 * Aesthetic: dark elegante, premium, con violeta como protagonista,
 * sutiles tonos magenta/cyan para el orb central.
 *
 * Filosofía visual:
 *   - Negro con tinte morado de base (no negro plano, no morado plano)
 *   - Violeta vibrante para CTAs y elementos primarios
 *   - Lavanda claro para acentos y highlights
 *   - Orb central con gradient orgánico (morado + magenta + cyan)
 */

export const colors = {
  // Backgrounds — negro con tinte violeta (no plano)
  background: '#0a0a14',
  surface: '#14141f',
  surfaceHigh: '#1e1e2e',
  surfaceElev: '#27273a',

  // Foreground
  foreground: '#ffffff',
  foregroundMuted: 'rgba(255, 255, 255, 0.72)',
  foregroundSubtle: 'rgba(255, 255, 255, 0.50)',
  foregroundFaint: 'rgba(255, 255, 255, 0.30)',

  // Primary — violeta vibrante (botones, links, focus)
  primary: '#9333ea', // violet-600
  primaryHover: '#a855f7', // violet-500
  primaryDeep: '#6b21a8', // violet-700
  primarySoft: '#c084fc', // violet-400 (highlights, accents)

  // Secondary — para el orb gradient
  magenta: '#ec4899', // pink-500
  cyan: '#22d3ee', // cyan-400
  indigo: '#4f46e5', // indigo-600

  // Borders + dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.16)',
  borderFocus: 'rgba(147, 51, 234, 0.5)', // violet glow

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

/**
 * Background gradient principal — morado vibrante arriba, negro abajo.
 * Inspirado en OnlyPipe / Aura AI sign-up screen.
 */
export const heroBackground = `
  linear-gradient(180deg, #6b21a8 0%, #2d1b69 35%, #0a0a14 100%)
`.trim();

/**
 * Brand gradient — para textos con clip y CTAs hero.
 */
export const brandGradient =
  'linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #c084fc 100%)';

/**
 * Orb gradient — para la "esfera" central del logo / hero.
 * Multi-color radial: morado + magenta + cyan.
 */
export const orbGradient = `
  radial-gradient(circle at 30% 30%, #c084fc 0%, transparent 50%),
  radial-gradient(circle at 70% 60%, #ec4899 0%, transparent 50%),
  radial-gradient(circle at 50% 80%, #22d3ee 0%, transparent 40%),
  linear-gradient(135deg, #6b21a8 0%, #1e1b4b 100%)
`.trim();

/**
 * Ambient glow para fondos decorativos sutiles.
 */
export const ambientGlow = `
  radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.25), transparent 50%),
  radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.20), transparent 55%),
  radial-gradient(circle at 50% 100%, rgba(76, 29, 149, 0.30), transparent 60%)
`.trim();

/** Sombras matched al violeta. */
export const shadows = {
  glow: '0 0 60px rgba(147, 51, 234, 0.5)',
  glowSoft: '0 0 40px rgba(168, 85, 247, 0.35)',
  glowOrb: '0 0 80px rgba(192, 132, 252, 0.4), 0 0 40px rgba(236, 72, 153, 0.3)',
  card: '0 8px 32px rgba(0, 0, 0, 0.5)',
  cardHover: '0 12px 48px rgba(147, 51, 234, 0.25)',
} as const;

/** Tipografía scales. */
export const typography = {
  display: 'clamp(48px, 8vw, 96px)',
  h1: 'clamp(36px, 5vw, 64px)',
  h2: 'clamp(28px, 3vw, 40px)',
  h3: 'clamp(20px, 2.5vw, 28px)',
  body: '16px',
  small: '14px',
  caption: '12px',
} as const;

/** Spacing scale (en px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

/** Radii. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;
