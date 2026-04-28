/**
 * Chero — Design Tokens (paleta oficial)
 *
 * Inspiración: gradient fluido naranja → magenta → morado sobre negro profundo.
 * Aesthetic: premium agency, distinctive, elegante.
 *
 * Uso: importá las constantes en componentes para mantener consistencia.
 * Tailwind: las clases inline-style con CSS vars usan estas tokens.
 */

export const colors = {
  // Backgrounds
  background: '#000000', // Negro profundo
  surface: '#0a0a0a', // Card / surface elevation
  surfaceHigh: '#161616', // Modal / elevated card

  // Foreground
  foreground: '#ffffff',
  foregroundMuted: 'rgba(255, 255, 255, 0.7)',
  foregroundSubtle: 'rgba(255, 255, 255, 0.5)',
  foregroundFaint: 'rgba(255, 255, 255, 0.3)',

  // Brand gradient stops (de izq a der / arriba a abajo)
  orange: '#FF6B1A', // Naranja vibrante (fuego)
  magenta: '#FF0080', // Magenta saturado
  purple: '#6B0FAD', // Morado profundo
  purpleDark: '#2D0959', // Morado muy oscuro

  // Borders + dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.16)',

  // Status (mantenidos de antes pero ajustados al dark)
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

/** Gradiente principal de la marca (linear, dark→light izq a der). */
export const brandGradient =
  'linear-gradient(135deg, #6B0FAD 0%, #FF0080 50%, #FF6B1A 100%)';

/** Gradiente alternativo más "fuego" (naranja dominante). */
export const fireGradient =
  'linear-gradient(135deg, #FF6B1A 0%, #FF0080 60%, #6B0FAD 100%)';

/** Glow sutil para fondos (radial blob). */
export const ambientGlow = `
  radial-gradient(circle at 20% 50%, rgba(255, 107, 26, 0.15), transparent 40%),
  radial-gradient(circle at 80% 30%, rgba(255, 0, 128, 0.18), transparent 45%),
  radial-gradient(circle at 50% 80%, rgba(107, 15, 173, 0.20), transparent 50%)
`.trim();

/** Sombras matched al brand. */
export const shadows = {
  glow: '0 0 60px rgba(255, 107, 26, 0.4)',
  glowMagenta: '0 0 60px rgba(255, 0, 128, 0.5)',
  glowPurple: '0 0 60px rgba(107, 15, 173, 0.6)',
  card: '0 8px 32px rgba(0, 0, 0, 0.4)',
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
  full: 9999,
} as const;
