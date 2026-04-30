/**
 * PremiumButton — botón estilo VibeMove (Phenomenon Studio).
 *
 * Diferente al `<Button />` de shadcn (que usa Base-UI y radius-md): éste
 * es **rounded-full** con padding generoso, animación press scale 0.96
 * (ease-out 100ms), y 3 variants pensadas para el rediseño v3.
 *
 * Variants:
 *   - "primary"   → pill blanco con texto dark, shadow soft. CTA hero.
 *   - "gradient"  → pill con gradient violeta-magenta, color-shadow.
 *                   Acción secundaria destacada.
 *   - "ghost"     → pill transparente con border white/15. Acciones tertiary.
 *
 * Sizes:
 *   - "lg"  → py-4 px-8 text-base (default, lo más usado)
 *   - "md"  → py-3 px-6 text-sm
 *   - "sm"  → py-2 px-4 text-xs
 *
 * Soporta `asChild` (estilo Radix) para envolver <Link href>.
 * Tap target mínimo 44px (Apple HIG / WCAG 2.5.5 AAA).
 */
'use client';

import { cloneElement, isValidElement, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Slot mini — clona el único child y le pasa props del Comp. Replica el
// patrón de Radix UI/base-ui sin la dependencia. Suficiente para envolver
// <Link href> en un <PremiumButton asChild>.
type SlotChildProps = {
  className?: string;
  children?: React.ReactNode;
} & Record<string, unknown>;

function Slot({ children, ...props }: SlotChildProps) {
  if (!isValidElement(children)) return null;
  const childProps = (children.props as SlotChildProps) ?? {};
  return cloneElement(children as ReactElement<SlotChildProps>, {
    ...props,
    ...childProps,
    className: cn(
      props.className,
      childProps.className,
    ),
  });
}

const premiumButtonVariants = cva(
  'group inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline-none transition-all duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a14] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-white text-[#0a0a14] shadow-[0_8px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.18)] hover:bg-white/95',
        gradient:
          'text-white shadow-[0_8px_28px_rgba(147,51,234,0.35)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.45)]',
        ghost:
          'border border-white/15 bg-white/[0.04] text-white backdrop-blur hover:border-white/25 hover:bg-white/[0.08]',
      },
      size: {
        lg: 'h-14 px-8 text-base',
        md: 'h-12 px-6 text-sm',
        sm: 'h-10 px-4 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  },
);

interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
}

export function PremiumButton({
  className,
  variant = 'primary',
  size = 'lg',
  asChild = false,
  style,
  ...props
}: PremiumButtonProps) {
  const Comp = asChild ? Slot : 'button';
  // Para variant gradient, el background es un linear-gradient inline porque
  // tailwind arbitrary gradients con stops complejos a veces no se purguean
  // bien. Inline style garantiza que se aplique.
  const gradientStyle =
    variant === 'gradient'
      ? {
          backgroundImage:
            'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
          ...style,
        }
      : style;

  return (
    <Comp
      data-slot="premium-button"
      className={cn(premiumButtonVariants({ variant, size }), className)}
      style={gradientStyle}
      {...props}
    />
  );
}

export { premiumButtonVariants };
