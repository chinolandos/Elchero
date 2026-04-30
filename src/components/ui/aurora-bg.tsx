/**
 * AuroraBg — fondo decorativo tipo "aurora boreal" con 3 blobs gigantes
 * con blur extremo, animados muy lento.
 *
 * Inspiración: hue-learn-glow.lovable.app (mesh background) + el OG de
 * referencia Aura AI imagen 4. Una capa de profundidad cromática debajo
 * del contenido sin robar protagonismo.
 *
 * Uso:
 *   <div className="relative">
 *     <AuroraBg />            // fondo
 *     <div className="relative z-10">contenido</div>
 *   </div>
 *
 * Variants:
 *   - intensity="full"     → opacity 0.7, blur 140px (landing, perfil hero)
 *   - intensity="medium"   → opacity 0.5, blur 130px (library home)
 *   - intensity="subtle"   → opacity 0.3, blur 120px (pages internas)
 */
import { cn } from '@/lib/utils';

interface AuroraBgProps {
  intensity?: 'full' | 'medium' | 'subtle';
  className?: string;
}

const INTENSITY_OPACITY: Record<NonNullable<AuroraBgProps['intensity']>, string> = {
  full: 'opacity-70',
  medium: 'opacity-50',
  subtle: 'opacity-30',
};

const INTENSITY_BLUR: Record<NonNullable<AuroraBgProps['intensity']>, string> = {
  full: 'blur-[140px]',
  medium: 'blur-[130px]',
  subtle: 'blur-[120px]',
};

export function AuroraBg({
  intensity = 'medium',
  className,
}: AuroraBgProps) {
  const opacity = INTENSITY_OPACITY[intensity];
  const blur = INTENSITY_BLUR[intensity];

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {/* Blob 1 — violeta + magenta (top-left quadrant) */}
      <div
        className={cn(
          'aurora-blob-1 absolute -left-[20%] -top-[15%] h-[60vw] w-[60vw] rounded-full will-change-transform',
          opacity,
          blur,
        )}
        style={{
          background:
            'radial-gradient(circle, #9333ea 0%, #ec4899 45%, transparent 70%)',
        }}
      />

      {/* Blob 2 — magenta + coral (right center) */}
      <div
        className={cn(
          'aurora-blob-2 absolute -right-[15%] top-[20%] h-[55vw] w-[55vw] rounded-full will-change-transform',
          opacity,
          blur,
        )}
        style={{
          background:
            'radial-gradient(circle, #ec4899 0%, #f97316 50%, transparent 75%)',
        }}
      />

      {/* Blob 3 — coral + naranja (bottom center) */}
      <div
        className={cn(
          'aurora-blob-3 absolute -bottom-[20%] left-[10%] h-[50vw] w-[50vw] rounded-full will-change-transform',
          opacity,
          blur,
        )}
        style={{
          background:
            'radial-gradient(circle, #f97316 0%, #ff6b35 40%, transparent 70%)',
        }}
      />
    </div>
  );
}
