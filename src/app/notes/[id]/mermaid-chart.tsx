'use client';

import { useEffect, useId, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface MermaidChartProps {
  /** Código mermaid puro (sin code fences). Ej: "graph TD\n  A --> B" */
  source: string;
}

const MERMAID_FONT_SIZE = '18px'; // bumped de 14px para mejor legibilidad mobile

/**
 * Renderiza un diagrama Mermaid client-side con dynamic import (no se carga en SSR).
 *
 * Notas de implementación:
 *   - Tema custom con paleta Aura (violeta + dark)
 *   - Si el source es inválido, muestra fallback con error breve
 *   - El SVG generado es responsive — toma 100% del width disponible
 *   - useId() evita colisiones cuando hay múltiples charts en la misma página
 */
export function MermaidChart({ source }: MermaidChartProps) {
  const reactId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            background: 'transparent',
            primaryColor: '#9333ea',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#a855f7',
            lineColor: 'rgba(255, 255, 255, 0.4)',
            secondaryColor: '#27273a',
            tertiaryColor: '#1e1e2e',
            mainBkg: '#1e1e2e',
            secondBkg: '#27273a',
            tertiaryBkg: '#14141f',
            nodeBkg: '#27273a',
            nodeBorder: 'rgba(168, 85, 247, 0.5)',
            clusterBkg: '#14141f',
            clusterBorder: 'rgba(255, 255, 255, 0.1)',
            edgeLabelBackground: '#1e1e2e',
            textColor: '#ffffff',
            fontSize: MERMAID_FONT_SIZE,
          },
          flowchart: {
            curve: 'basis',
            padding: 30,
            nodeSpacing: 50,
            rankSpacing: 70,
            useMaxWidth: false, // crítico: false = SVG con tamaño absoluto, scrolleable horizontal
          },
          securityLevel: 'strict',
        });

        // El id no puede tener caracteres raros — los reemplazamos
        const safeId = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;

        const { svg: rendered } = await mermaid.render(safeId, source.trim());
        if (!cancelled) {
          setSvg(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error renderizando el mapa mental';
          setError(msg);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  return <ChartViewer loading={loading} error={error} svg={svg} source={source} />;
}

/**
 * Viewer del SVG con botón "Expandir" que abre overlay fullscreen
 * con pinch-to-zoom y scroll en mobile.
 */
function ChartViewer({
  loading,
  error,
  svg,
  source,
}: {
  loading: boolean;
  error: string | null;
  svg: string | null;
  source: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#070710] py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="mb-2 text-sm font-semibold text-amber-200">
          No pudimos renderizar el mapa mental
        </div>
        <div className="mb-3 text-xs text-amber-200/70">{error}</div>
        <details className="cursor-pointer">
          <summary className="text-xs text-amber-200/60 hover:text-amber-200">
            Ver código fuente del mapa
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-3 font-mono text-xs text-white/60">
            {source}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl border border-white/10 bg-[#070710]">
        {/* Botón expandir (esquina superior derecha) */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expandir mapa mental"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/70 backdrop-blur transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-white"
        >
          <ExpandIcon />
        </button>

        {/* SVG inline — scrolleable horizontalmente si excede el ancho */}
        <div
          className="w-full overflow-auto p-5 [&_svg]:mx-auto [&_svg]:!max-w-none"
          style={{ maxHeight: '70vh' }}
          dangerouslySetInnerHTML={{ __html: svg ?? '' }}
        />

        <div className="border-t border-white/5 p-3 text-center text-xs text-white/40">
          💡 Tap el botón ↗ arriba para verlo en pantalla completa
        </div>
      </div>

      {/* Overlay fullscreen con pinch-to-zoom nativo (browser) */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a14]"
          onClick={() => setExpanded(false)}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold">Mapa mental</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕ Cerrar
            </button>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto p-4 [&_svg]:max-w-none"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg ?? '' }}
          />
          <div className="border-t border-white/10 px-4 py-2 text-center text-xs text-white/40">
            Pellizcá la pantalla para hacer zoom · tap fuera para cerrar
          </div>
        </div>
      )}
    </>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
