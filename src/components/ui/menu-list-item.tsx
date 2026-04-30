'use client';

/**
 * MenuListItem — item de lista premium estilo screenshot del perfil ref.
 *
 * Layout:
 *   [icono circular gradient] [label medio] [badge opcional] [chevron right]
 *
 * Comportamiento:
 *   - Glassmorphism dark uniforme (no más gradient saturado por item)
 *   - Press animation: scale 0.98 con spring suave
 *   - Hover desktop: border violeta sutil + bg lift
 *   - Solo 1 lenguaje visual para todos los items — coherencia total
 *
 * Usage:
 *   <MenuListItem
 *     icon={Bell}
 *     label="Notificaciones"
 *     href="/perfil/notificaciones"
 *     badge="Próximamente"
 *   />
 */
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface MenuListItemProps {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  /** Si se pasa href → renderiza Link. Si se pasa onClick → button. */
  href?: string;
  onClick?: () => void;
  /** Color del gradient del icono. Default: violeta-magenta. */
  iconGradient?: 'violet' | 'magenta' | 'coral' | 'cyan' | 'amber';
  /** Badge opcional al lado del label (ej: "Próximamente", "Pro", "5") */
  badge?: string;
  /** Si es true, el item se renderiza como destructivo (rojo). */
  destructive?: boolean;
  /** Aria label si label visible no es descriptivo. */
  ariaLabel?: string;
}

const ICON_GRADIENTS: Record<NonNullable<MenuListItemProps['iconGradient']>, string> = {
  violet: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  magenta: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
  coral: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  cyan: 'linear-gradient(135deg, #22d3ee 0%, #4f46e5 100%)',
  amber: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
};

export function MenuListItem({
  icon: Icon,
  label,
  href,
  onClick,
  iconGradient = 'violet',
  badge,
  destructive = false,
  ariaLabel,
}: MenuListItemProps) {
  const gradient = ICON_GRADIENTS[iconGradient];

  const content = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur transition-colors',
        destructive
          ? 'border-red-500/20 bg-red-500/[0.04] hover:border-red-500/30 hover:bg-red-500/[0.08]'
          : 'border-white/[0.08] bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]',
      )}
    >
      {/* Icono circular gradient */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)]"
        style={
          destructive
            ? { background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }
            : { background: gradient }
        }
        aria-hidden
      >
        <Icon className="h-5 w-5 text-white" />
      </span>

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-sm font-medium',
          destructive ? 'text-red-200' : 'text-white/90',
        )}
      >
        {label}
      </span>

      {/* Badge opcional */}
      {badge && (
        <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {badge}
        </span>
      )}

      {/* Chevron right */}
      <ChevronRight
        className={cn(
          'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5',
          destructive ? 'text-red-300/60' : 'text-white/40',
        )}
        aria-hidden
      />
    </motion.div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel ?? label}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
    >
      {content}
    </button>
  );
}
