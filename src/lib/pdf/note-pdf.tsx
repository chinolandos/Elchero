/**
 * NotePdf — componente React-PDF que renderiza un apunte completo.
 *
 * Server-only: este archivo importa @react-pdf/renderer (~600KB) y solo
 * debe ejecutarse en Node runtime (nunca en cliente). Lo importamos desde
 * /api/notes/[id]/pdf/route.ts.
 *
 * Diseño:
 *   - Fondo blanco imprimible, texto negro, acentos violeta Aura (#9333ea).
 *   - Header con banda violeta + logo + materia/modo/fecha.
 *   - Sections: Resumen, Conceptos, Preguntas, Flashcards, Repaso 30s.
 *   - Footer con branding + page numbers.
 */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { CheroMode, CheroNote } from '@/lib/types/chero';

// Helvetica viene built-in en react-pdf — no necesitamos Font.register.
// Si en el futuro el equipo quiere Inter (la fuente web de la app), se
// agrega aquí con Font.register({ family: 'Inter', src: '...woff' }).

interface NotePdfProps {
  subject: string;
  mode: CheroMode;
  institution: string | null;
  createdAt: string;
  audioDurationMinutes: number | null;
  note: CheroNote;
}

const MODE_LABEL: Record<CheroMode, string> = {
  avanzo: 'AVANZO',
  periodo: 'Periodo',
  parciales: 'Parciales',
  repaso: 'Repaso',
};

// Paleta del PDF — derivada de design-tokens.ts pero adaptada para imprenta:
// blanco de fondo, negro para texto principal, violeta Aura como acento,
// verde para respuestas correctas. NO usamos los oscuros de la app web
// porque chuparían toner y se verían raros impresos.
const palette = {
  primary: '#9333ea',
  primaryDeep: '#6b21a8',
  primarySoft: '#f3e8ff',
  ink: '#0a0a14',
  inkSoft: '#3a3a4a',
  inkMuted: '#6b6b7a',
  border: '#e4e4ea',
  surface: '#fafafc',
  success: '#10b981',
  successSoft: '#ecfdf5',
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: palette.ink,
    backgroundColor: '#ffffff',
  },

  // ── Header (banda violeta arriba) ─────────────────────────────────────
  header: {
    backgroundColor: palette.primary,
    paddingVertical: 24,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: palette.primary,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // ── Meta strip (chips bajo el header) ─────────────────────────────────
  metaStrip: {
    backgroundColor: palette.primaryDeep,
    paddingVertical: 10,
    paddingHorizontal: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaChip: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
  },
  metaChipBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  // ── Body ──────────────────────────────────────────────────────────────
  body: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 26,
    color: palette.ink,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  subtitle: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: palette.inkMuted,
    marginBottom: 20,
  },

  // ── Sections ──────────────────────────────────────────────────────────
  section: {
    marginTop: 18,
  },
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: palette.primary,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: palette.ink,
    lineHeight: 1.55,
    marginBottom: 8,
  },

  // ── Concepts ──────────────────────────────────────────────────────────
  conceptCard: {
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 12,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  conceptName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: palette.ink,
    marginBottom: 4,
  },
  conceptDef: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: palette.inkSoft,
    lineHeight: 1.5,
  },
  conceptExample: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 10,
    color: palette.inkMuted,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: palette.border,
  },
  conceptExampleLabel: {
    fontFamily: 'Helvetica-Bold',
    color: palette.primaryDeep,
  },

  // ── Questions ─────────────────────────────────────────────────────────
  questionBlock: {
    marginBottom: 14,
  },
  questionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  questionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.primary,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
    paddingTop: 4,
  },
  questionContent: {
    flex: 1,
  },
  questionPrompt: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: palette.ink,
    marginBottom: 6,
    lineHeight: 1.45,
  },
  optionsList: {
    marginTop: 4,
    marginBottom: 6,
  },
  option: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: palette.inkSoft,
    marginBottom: 2,
    paddingLeft: 6,
  },
  answerBox: {
    backgroundColor: palette.successSoft,
    borderLeftWidth: 2,
    borderLeftColor: palette.success,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  answerLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: palette.success,
  },
  answerText: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: palette.ink,
  },
  justification: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: palette.inkMuted,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  justificationLabel: {
    fontFamily: 'Helvetica-Bold',
    fontStyle: 'normal',
    color: palette.inkSoft,
  },

  // ── Flashcards ────────────────────────────────────────────────────────
  flashcardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flashcard: {
    width: '48.5%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: palette.surface,
    borderWidth: 0.5,
    borderColor: palette.border,
    borderRadius: 6,
    marginBottom: 8,
  },
  flashcardFront: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 10,
    color: palette.primaryDeep,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  flashcardBack: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: palette.inkSoft,
    lineHeight: 1.45,
  },

  // ── Repaso 30s ────────────────────────────────────────────────────────
  quickReview: {
    backgroundColor: palette.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    padding: 14,
    marginTop: 4,
  },
  quickReviewText: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: palette.ink,
    lineHeight: 1.55,
    marginBottom: 6,
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: palette.inkMuted,
  },
  footerBrand: {
    fontFamily: 'Helvetica-Bold',
    color: palette.primaryDeep,
  },
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function NotePdf({
  subject,
  mode,
  institution,
  createdAt,
  audioDurationMinutes,
  note,
}: NotePdfProps) {
  return (
    <Document
      title={`Chero - ${subject}`}
      author="El Chero"
      subject={`Apunte ${MODE_LABEL[mode]} - ${subject}`}
      keywords={`apuntes, ${MODE_LABEL[mode]}, ${subject}, AVANZO, IA`}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header} fixed>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>C</Text>
          </View>
          <View>
            <Text style={styles.brandName}>EL CHERO</Text>
            <Text style={styles.brandTagline}>
              apuntes con IA, hechos a tu medida
            </Text>
          </View>
        </View>

        {/* ── Meta strip ──────────────────────────────────────────── */}
        <View style={styles.metaStrip} fixed>
          <Text style={styles.metaChip}>
            <Text style={styles.metaChipBold}>{MODE_LABEL[mode]}</Text>
          </Text>
          <Text style={styles.metaChip}>{subject}</Text>
          {institution && <Text style={styles.metaChip}>{institution}</Text>}
          <Text style={styles.metaChip}>{formatDate(createdAt)}</Text>
          {audioDurationMinutes && (
            <Text style={styles.metaChip}>
              {audioDurationMinutes.toFixed(1)} min de audio
            </Text>
          )}
        </View>

        {/* ── Body ────────────────────────────────────────────────── */}
        <View style={styles.body}>
          <Text style={styles.title}>{subject}</Text>
          <Text style={styles.subtitle}>
            Apunte generado con IA - revisalo antes de estudiar
          </Text>

          {/* Resumen */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Resumen ejecutivo</Text>
            {splitParagraphs(note.summary).map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>

          {/* Conceptos */}
          {note.concepts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Conceptos clave</Text>
              {note.concepts.map((c, i) => (
                <View key={i} style={styles.conceptCard} wrap={false}>
                  <Text style={styles.conceptName}>{c.name}</Text>
                  <Text style={styles.conceptDef}>{c.definition}</Text>
                  {c.example && (
                    <Text style={styles.conceptExample}>
                      <Text style={styles.conceptExampleLabel}>Ejemplo: </Text>
                      {c.example}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Preguntas */}
          {note.questions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Preguntas tipo examen</Text>
              {note.questions.map((q, i) => (
                <View key={i} style={styles.questionBlock} wrap={false}>
                  <View style={styles.questionRow}>
                    <Text style={styles.questionNumber}>{i + 1}</Text>
                    <View style={styles.questionContent}>
                      <Text style={styles.questionPrompt}>{q.prompt}</Text>
                      {q.options && q.options.length > 0 && (
                        <View style={styles.optionsList}>
                          {q.options.map((opt, j) => (
                            <Text key={j} style={styles.option}>
                              {opt}
                            </Text>
                          ))}
                        </View>
                      )}
                      {q.correct && (
                        <View style={styles.answerBox}>
                          <Text>
                            <Text style={styles.answerLabel}>
                              {'✓ Respuesta correcta: '}
                            </Text>
                            <Text style={styles.answerText}>{q.correct}</Text>
                          </Text>
                        </View>
                      )}
                      <Text style={styles.justification}>
                        <Text style={styles.justificationLabel}>
                          Justificacion:{' '}
                        </Text>
                        {q.justification}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Flashcards */}
          {note.flashcards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Flashcards</Text>
              <View style={styles.flashcardsGrid}>
                {note.flashcards.map((f, i) => (
                  <View key={i} style={styles.flashcard} wrap={false}>
                    <Text style={styles.flashcardFront}>{f.front}</Text>
                    <Text style={styles.flashcardBack}>{f.back}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Repaso 30s */}
          {note.quick_review && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Repaso de 30 segundos</Text>
              <View style={styles.quickReview}>
                {splitParagraphs(note.quick_review).map((p, i) => (
                  <Text key={i} style={styles.quickReviewText}>
                    {p}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generado por <Text style={styles.footerBrand}>El Chero</Text> -
            elchero.app
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
