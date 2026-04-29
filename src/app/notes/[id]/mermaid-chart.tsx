'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface MermaidChartProps {
  /** Código mermaid puro (sin code fences). Ej: "graph TD\n  A --> B" */
  source: string;
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
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
            fontSize: '14px',
          },
          flowchart: {
            curve: 'basis',
            padding: 20,
            useMaxWidth: true,
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
    <div className="rounded-xl border border-white/10 bg-[#070710] p-5">
      {/* dangerouslySetInnerHTML es seguro acá: mermaid corre con securityLevel='strict'
          que sanitiza el output. Además el source viene de Claude (nuestro LLM, no del user). */}
      <div
        ref={containerRef}
        className="mermaid-container w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg ?? '' }}
      />
    </div>
  );
}
