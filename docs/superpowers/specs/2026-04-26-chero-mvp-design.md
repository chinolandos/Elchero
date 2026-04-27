# Chero — Spec del MVP "Demo + 50 Usos"

**Versión:** 2.0 (recortada para CBE pitch)
**Fecha:** 2026-04-26
**Pitch CBE:** 2026-05-09 (13 días desde hoy, 7-10 de build + 3 de buffer)
**Autores:** Milton + Claude (sesión de brainstorming 2026-04-26)
**Estado:** Aprobado para implementación

---

## 1. Resumen ejecutivo

Chero es una web app que recibe el audio de una clase y, en menos de 2 minutos, devuelve apuntes en español salvadoreño con preguntas tipo examen, flashcards, audio para repasar, mapa mental y quiz interactivo. Hecho específicamente para AVANZO, parciales universitarios y pruebas de período del bachillerato.

**Timing privilegiado para el pitch:** AVANZO 2026 se aplica **28-29 de octubre de 2026** (verificado MINED). Pitch de la CBE es **9 de mayo de 2026**. Esto da a los bachilleres salvadoreños **6 meses** para usar Chero antes de su prueba nacional — narrativa killer para el jurado.

**Versión MVP "Demo + 50 Usos":** producto totalmente funcional, limitado a 50 procesamientos totales (suficiente para pitch en vivo + validación con 10-15 estudiantes reales). Costo total: ~$63.60 USD one-time. Stack legalmente sólido (Vercel Pro 1 mes + OpenAI TTS pagado + Supabase Free para uso comercial).

**Tagline oficial:** "El Chero — apuntes con IA, hechos a tu medida"

**Propósito doble:**
1. Ganar la **CBE 2026** (ESEN, pitch 9 de mayo de 2026)
2. Validar con **10-15 usuarios reales** y obtener métricas + testimonios para el pitch

**Límite técnico de uso:** Híbrido — 5 audios por usuario × hasta 50 totales globales. Cuando se alcanza el tope: mensaje "Beta cerrada. Lanzamiento Q2 2026 — dejá tu correo".

---

## 2. Audiencias y modos del producto

| Modo | Audiencia | Cuándo se usa |
|---|---|---|
| **AVANZO** | Bachilleres de último año (2°) | Estudiar para la prueba estandarizada nacional MINED |
| **Período** | Bachilleres 1°-2° + tercer ciclo | Pruebas de los **4 períodos evaluativos** del MINED en bachillerato (terminología oficial) |
| **Parciales** | Universitarios | Exámenes parciales (1°, 2°, 3°) en universidades |
| **Repaso General** | Cualquier estudiante | Sin audio: tutor IA para repasar tema específico |

---

## 3. Posicionamiento competitivo

| Eje | Otter / Notion AI / Apple Intelligence | Chero |
|---|---|---|
| Idioma | Inglés primero, español neutro | **Español salvadoreño con voseo y modismos suaves** |
| Currículo | Genérico ejecutivo | **Currículo MINED + AVANZO 6 instrumentos + universidades SV** |
| Formato | Notas de reunión | **Apuntes de estudiante: resumen + conceptos + preguntas + flashcards + repaso 30s + audio + mapa mental + quiz** |
| Caso de uso | Profesionales | **Estudiantes salvadoreños — bus, estudio, examen** |
| Privacidad | Audio guardado en la nube | **Audio se borra al procesar (data minimization)** |
| Aliado del profe | No existe | **Modo QR mostrado en roadmap** |
| Modelo B2B | No existe | **Plan colegio $49/aula + plan universidad negociable** |

---

## 4. Arquitectura del sistema

### 4.1 Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTE (Next.js 14 App Router · React · Tailwind · PWA)   │
│  Onboarding · Capture · Notes · Library                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│  VERCEL PRO 1 mes ($20) — uso comercial permitido           │
│  /api/process · /api/detect · /api/tts · /api/profile       │
│  Counter check: si total >= 50, devuelve 429 (Beta cerrada) │
└───────┬─────────────┬───────────────┬───────────────────────┘
        │             │               │
        ▼             ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────────┐
   │GPT-4o   │   │Claude    │   │OpenAI TTS    │
   │Mini Tx  │   │Sonnet 4.6│   │$0.015/1K char│
   │$.003/min│   │200K ctx  │   │Voz neuronal  │
   │+chunking│   │cache 90% │   │~$3 total     │
   │ >25MB   │   │KB en cache│  │Comercial OK  │
   └─────────┘   └─────┬────┘   └──────────────┘
                       │
                       ▼
              ┌──────────────────────────┐
              │ KB en prompt cache       │
              │ (sin RAG, sin pgvector)  │
              │ Cabe en ventana 1M Claude│
              └──────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────┐
   │ SUPABASE FREE                       │
   │ Auth Google · Postgres 500MB        │
   │ Storage 1GB · 50K MAU               │
   │ Audio TTL 1h (auto-delete)          │
   │ Tabla `usage_counter` global        │
   └─────────────────────────────────────┘
```

### 4.2 Componentes (cada uno con UNA responsabilidad)

**Frontend:**
- `app/(public)/` — landing pública en `elchero.app` (HTTPS automático por TLD)
- `app/(public)/privacidad/` — política de privacidad (cumplimiento Ley Protección Datos SV Nov 2024)
- `app/(public)/terminos/` — términos de servicio
- `app/(auth)/` — login Google
- `app/(app)/onboarding/` — perfil del usuario en 3 pasos + **gate de edad** (si <18: pantalla con checkbox "Tengo consentimiento de mi tutor") + checkbox términos explícito (compliance Ley Datos SV)
- `app/(app)/capture/` — grabar o subir audio
- `app/(app)/transcript-edit/[id]/` — vista de transcripción cruda con edición antes de procesar (mitigación accuracy Whisper en salvadoreño ~92%)
- `app/(app)/notes/[id]/` — vista del apunte (5 secciones core + extras)
- `app/(app)/library/` — historial de apuntes del usuario
- `app/(app)/profile/` — perfil + botón "Eliminar mi cuenta y todos mis datos" (cumplimiento Ley Datos)
- `app/(app)/pricing/` — planes mostrados (Stripe en modo test, sin checkout activo)

**Backend (API Routes en Vercel):**
- `/api/process` — orquesta audio → transcripción → detección → RAG → notas (con check de límite 50)
- `/api/detect-context` — auto-detección de materia desde primeros 30s
- `/api/tts` — genera audio MP3 del apunte vía Edge TTS
- `/api/profile` — CRUD del perfil del usuario

**Pipeline de KB (offline, una vez):**
- `scripts/kb-ingest/` — scraping multi-fuente
- `scripts/kb-process/` — extracción + chunking + embeddings
- `scripts/kb-update/` — actualizaciones incrementales (post-pitch)

### 4.3 Features pospuestas a Q2 2026 (mockup en UI, no funcional)

- ❌ Modo Salón Colaborativo en tiempo real (websockets)
- ❌ Modo Aliado Docente con QR funcional (mockup en pantalla, código generado pero sin flujo docente)
- ❌ Plan de estudio personalizado con repetición espaciada SM-2 (mockup visual)
- ❌ Stripe checkout live (botones "Suscribirse" abren modal "Próximamente")
- ❌ App móvil nativa
- ❌ Bot WhatsApp Business API
- ❌ Voice cloning con voz salvadoreña

---

## 5. Knowledge Base — TODO en prompt cache (sin RAG)

**Decisión clave:** para 50 usos, el KB recortado cabe holgado en la ventana de 1M tokens de Claude Sonnet 4.6 con prompt caching (90% descuento). **Cortamos pgvector + embeddings + ingestion vectorial para simplificar.**

### Contenido del KB (todo va en prompt cache)

- Plan de estudios MINED — bachillerato general 1° y 2°
- **Estructura oficial AVANZO 2025:** 6 instrumentos × 35 ítems opción múltiple
  1. Precálculo
  2. Ciudadanía y Valores
  3. Ciencia y Tecnología
  4. Lenguaje y Literatura
  5. Inglés
  6. Componente vocacional
- **Estructura 4 períodos evaluativos** del MINED en bachillerato
- Glosario de términos técnicos por materia
- Reglas de español salvadoreño (voseo, modismos suaves)
- **Banco de exámenes recortado:**
  - 5-7 AVANZO/PAES públicos
  - 10-20 parciales ESEN reales (vía hermano de Milton)
  - 5-10 parciales UCA/UES (vía Mariana)
  - 3-5 parciales sintéticos generados con Claude para Tier 2/3
- **Cobertura por universidad:**

| Tier | Universidades | Carreras |
|---|---|---|
| **Tier 1 — Profundidad MÁXIMA** | ESEN | 4 carreras (Economía, Jurídicas, Ing. Negocios, Ing. Software y Negocios Digitales) |
| **Tier 1 — Profundidad alta** | UCA, UES | Top 4 cada una (8 total) |
| **Tier 2 — Cobertura media** | UDB, UEES | Top 1 c/u (Computación + Admin) |
| **Tier 3 — Sin profundidad** | UFG, UTEC, UJMD, UNICAES | Solo metadata + temarios genéricos |

**Tamaño total estimado del KB:** ~80-120K tokens (cabe en Claude 200K ventana estándar con holgura para transcripción + output del apunte).

### Capa de memoria del usuario (Postgres en Supabase Free)

- `user_profiles` — perfil con universidad/colegio + materias actuales
- `user_notes_history` — apuntes generados (texto, no audio)
- `usage_counter` — contador global de los 50 usos + por usuario (5 c/u)

### Estrategia de obtención de contenido para el KB (6 fuentes legales)

1. **Sitios oficiales MINED** — currículo + estructura AVANZO (público oficial)
2. **Sitios oficiales universidades** (esen.edu.sv, uca.edu.sv, ues.edu.sv) — catálogos + syllabi públicos
3. **Quizlet sets públicos AVANZO/PAES** — review manual de sets relevantes (ej: "Avanzo 2020 - Estudios Sociales", "Examen de Guerra Civil Salvadoreña") — uso legal de contenido público
4. **Hermano de Milton (ESEN, Ing. Software y Negocios Digitales)** — sus parciales viejos propios, mínimo 5-10 exámenes
5. **Mariana + Xime** — parciales propios y de conocidos UCA/UES con permiso explícito
6. **Repositorios institucionales públicos** — `ri.ues.edu.sv` y similares
7. **Generación sintética con Claude** para llenar huecos (marcado `synthetic: true` en metadata)

**Cortado por riesgo legal:** ~~scraping masivo Studocu~~

**Objetivo:** 60% real (5 fuentes legales) + 40% sintético en Tier 1.

### Beneficios de cortar RAG en MVP

- ✅ Build 1-2 días más rápido (sin pgvector setup, sin embeddings, sin chunking vectorial)
- ✅ Cero costos de embeddings ($0.40 ahorrados)
- ✅ Cero riesgo de falla técnica HNSW en Supabase Free tier
- ✅ Misma calidad de output (Claude tiene todo el KB en cada llamada)
- ✅ Cuando crezca a 100+ usuarios y el KB pase 500K tokens, ahí reintroducimos RAG. Ahora no.

---

## 6. Flujo de procesamiento (end-to-end por audio)

```
1. AUDIO ENTRA (subido o grabado en navegador con polyfill MediaRecorder)
2. CHECK COUNTER → si total_uses >= 50 OR user_uses >= 5 → 429 "Beta cerrada"
3. CHECK SIZE → si >25MB, chunk en cliente (MP3 64kbps) o backend
4. UPLOAD → Supabase Storage (TTL 1h, auto-delete)
5. TRANSCRIBE → GPT-4o Mini Transcribe ($0.003/min) con chunking si >25MB
6. SHOW TRANSCRIPT (mitigación Whisper accuracy ~92% en salvadoreño)
   Usuario ve transcripción cruda y puede EDITAR antes de procesar
   Botones: [✓ Procesar] [✏️ Editar] [✗ Descartar]
7. AUTO-DETECT (Claude Haiku, ~$0.0005)
   Input: transcripción editada + perfil usuario
   Output: { modo, universidad?, materia, confianza }
8. CONFIDENCE GATE
   ≥85% → procesa
   <85% → pregunta al usuario
9. GENERATE NOTES (Claude Sonnet 4.6, 200K ctx)
   System: KB completo cacheado (MINED + AVANZO + parciales + reglas español) - 90% descuento
   User: transcripción editada + perfil
   Output: 5 secciones + extras
10. POST-PROCESS
    - TTS (OpenAI tts-1 voz Nova/Echo) si usuario pidió audio
    - Mermaid mapa mental (lazy load client-side)
11. INCREMENT COUNTER (atomicamente)
12. DELIVER → Frontend renderiza en <60s totales (Vercel Pro Fluid Compute hasta 800s)
13. AUDIO SE BORRA (job programado, TTL 1h)
```

---

## 7. Output del apunte

### Core (siempre se generan)

1. **🎯 Resumen ejecutivo** — 3-5 párrafos en español salvadoreño
2. **📚 Conceptos clave** — términos con definición corta + ejemplo
3. **❓ Preguntas tipo examen** — formato adaptado al modo:
   - AVANZO: opción múltiple 4 opciones con justificación, organizadas por instrumento
   - Período: mix selección múltiple + completación + abiertas
   - Parciales: problemas resueltos paso a paso (Mate/Física) o desarrollo (Sociales)
4. **🧠 Flashcards** — pares interactivos con animación voltear
5. **📝 Repaso 30s** — un párrafo absolutamente esencial

### Extras funcionales (entran al MVP)

6. **🎧 Audio TTS** del apunte (Edge TTS es-MX neutro — gratis)
7. **🗺️ Mapa mental** (Mermaid.js → SVG inline, **lazy load con dynamic import `{ ssr: false }`** — bundle de 400KB se carga solo cuando el usuario hace click en "Ver mapa mental")
8. **🎮 Quiz interactivo** — preguntas gamificadas con score y racha (UI puro, sin persistencia)

### Extras mockup (visible pero no funcional, para roadmap del pitch)

9. **📅 Plan de estudio** — UI mostrando "Hoy: Microeconomía" pero sin SM-2 funcional detrás
10. **👨‍🏫 Modo aliado docente** — botón "Compartir con profe (próximamente)"

---

## 8. Auto-detección de contexto (clave del "wow")

### Estrategia C+D (auto IA + perfil)

1. **Onboarding (30 segundos):**
   - ¿Bachiller o universitario?
   - Si bachiller: año (1° o 2°), modalidad (general/técnico), institución
   - Si universitario: universidad, carrera, año
   - Materias actuales (checklist)

2. **Al subir/grabar audio:**
   - Perfil pre-selecciona modo y reduce universo de materias
   - Claude transcribe primeros 30s y auto-detecta materia con confidence score
   - Si ≥85% → procesa, muestra "📚 [Materia] · [Universidad] · ¿correcto? [Sí] [Cambiar]"
   - Si <85% → pregunta antes de seguir
   - Botón "Cambiar materia" siempre visible

3. **Aprendizaje continuo:**
   - Correcciones del usuario se guardan en `user_corrections` (para post-pitch)

---

## 9. Privacidad, legal y posicionamiento defensivo

### Privacy-by-design

- **Audio se borra automáticamente** después de generar el apunte (TTL máximo 1 hora) vía **Vercel Cron Job (Pro permite 1x/min)** + **Supabase signed URLs por usuario** (cada audio privado al uploader)
- **Apuntes son texto** (no contienen voz del docente)
- Términos de uso obligan al estudiante a:
  1. No compartir el audio crudo
  2. Usar los apuntes solo para estudio personal
  3. Cumplir con el reglamento de su institución
- Checkbox obligatorio en onboarding aceptando términos
- **Gate de edad:** menores (<18) requieren consentimiento de tutor (compliance Ley Datos SV Nov 2024)
- **Botón "Eliminar mi cuenta y datos"** en perfil — borra todo en cascada (apuntes, perfil, auth)
- **Supabase Row Level Security (RLS):** cada usuario solo ve sus propios datos

### Modo Aliado Docente (mockup en UI)

Aunque no esté funcional en MVP, el botón visible y el slide del pitch defienden:
> "Estudiante invita al docente con código QR. Docente acepta, recibe los apuntes de su clase, puede revisar y corregir. Convierte al docente de obstáculo a aliado."

### Defensa ante objeciones del jurado

> "Chero está diseñado privacy-first y cumple con la **Ley de Protección de Datos Personales de El Salvador** aprobada en noviembre 2024. Política de privacidad explícita, consentimiento informado en onboarding, derecho a borrar datos en un click, audio auto-eliminable después de procesar. Términos de uso obligan al estudiante a respetar el reglamento de su institución. Modo Aliado Docente vía QR (Q2 2026): el profesor recibe los apuntes de su propia clase, puede corregirlos y validarlos."

### Alineación con política nacional de IA

> "El Salvador aprobó la **Ley para la Promoción de IA** el 25 de febrero de 2025 con foco explícito en integrar IA al sistema educativo. ANIA (Agencia Nacional de IA) tiene mandato de colaborar con el MINED. Chero es exactamente el caso de uso que esta ley quiere promover — somos un partner natural para esa colaboración pública-privada."

---

## 10. Stack técnico y costos para "Demo + 50 Usos"

### Stack (legalmente sólido para uso comercial)

| Capa | Servicio | Tier | Por qué |
|---|---|---|---|
| Frontend | Next.js 14 App Router + React + Tailwind + shadcn/ui (MIT) | — | Estándar, soporte PWA, license OK |
| Hosting | **Vercel Pro 1 mes ($20)** | 1TB bandwidth, **Fluid Compute habilitado para timeout 800s**, **deploy region `iad1`** (US East — mejor latencia para SV: 80-120ms) | Hobby PROHÍBE uso comercial — Pro obligatorio. Fluid Compute crítico para procesamiento de audios largos (60-90s). Configurado en `vercel.json` |
| DB + Auth + Storage | **Supabase Free** | 500MB, 1GB storage, 50K MAU | Permite uso comercial. Pausa después de 7 días sin actividad — mitigación: tráfico día 8-12 |
| Transcripción | OpenAI GPT-4o Mini Transcribe | Pay-per-use | $0.003/min, chunking si >25MB |
| LLM principal | Claude Sonnet 4.6 (1M ventana) | Pay-per-use con cache 90% | $3/$15 per 1M, KB completo cabe en cache |
| LLM detección | Claude Haiku 4.5 | Pay-per-use | Bajo costo, rápido |
| TTS | **OpenAI TTS** (pay-per-use, modelo `tts-1`) | $0.015/1K chars | **Comercial OK explícito, mismo proveedor que Whisper, acento Latinoamericano por defecto (perfecto para audiencia SV). Voces: Nova (femenina cálida) o Echo (masculino profesional). Configurable por usuario.** |
| Audio recording | MediaRecorder API + `audio-recorder-polyfill` | Open-source | Compatibilidad cross-browser incluyendo Safari iOS |
| Pagos | Stripe **modo test** | — | UI de pricing visible, sin checkout activo |
| RAG | **Cortado** | — | KB completo cabe en prompt cache de Claude 1M |

### ⚠️ Riesgos del free tier

- **Supabase Free pausa proyecto después de 7 días sin actividad** → mitigación: durante validación días 8-12, generar tráfico cada 3-4 días para mantenerlo despierto
- **Vercel Hobby muere si excede 100GB bandwidth** → con 50 usos, imposible llegar a eso
- **Si Chero se vuelve viral antes del pitch** → upgrade emergencia a Pro ($45/mes)

### Costo total para los 50 usos

| Item | Cálculo | Costo USD |
|---|---|---|
| Dominio `elchero.app` | 1 año en Porkbun (CONFIRMADO disponible) | ~$15 |
| **Vercel Pro 1 mes** | **Obligatorio para uso comercial** | **$20** |
| GPT-4o Mini Transcribe | 50 × 30 min × $0.003 | $4.50 |
| Claude Sonnet 4.6 (apuntes, 200K ctx) | 50 calls × ~15K tokens output × $15/1M | $11 |
| Claude Haiku (auto-detect) | 50 calls × ~2K tokens × $1/1M | $0.10 |
| OpenAI TTS | 150K chars × $0.015/1K | **$2.25** |
| Supabase Free | Permite uso comercial | $0 |
| Embeddings | Cortado (KB en prompt cache) | $0 |
| **Subtotal APIs + dominio + hosting** | | **~$52.85** |
| **Buffer para imprevistos** | | **+$10** |
| **TOTAL** | | **~$63 USD** |

**Revenue:** $0 (no se cobra en MVP). El revenue arranca post-pitch si ganan la CBE o levantan capital.

---

## 11. Manifiesto de skills (locales + externas)

### Locales (ya instaladas, no se reinstalan)

`claude-api`, `agent-browser`, `frontend-design`, `impeccable`, `redesign-existing-projects`, `12k-site-builder`, `banana`, `seo-strategy`, `programmatic-seo-builder`, `simplify`, `security-review`, `init`, `ads-dna`, `ads-create`, `ads-photoshoot`, `email-sequence-writer`, `content-repurposer`, `utm-tracking-generator`, `full-output-enforcement`.

### Externas a instalar en `Cheroapp/.claude/skills/`

**Backend & infra (esenciales):**
- `supabase/agent-skills@supabase-postgres-best-practices`
- `supabase/agent-skills@supabase`
- `sickn33/antigravity-awesome-skills@nextjs-supabase-auth`
- `wshobson/agents@nextjs-app-router-patterns`
- `vercel-labs/agent-skills@vercel-react-best-practices`
- `vercel-labs/agent-skills@vercel-composition-patterns`

**Audio (con chunking >25MB y polyfill Safari iOS):**
- `steipete/clawdis@openai-whisper-api` (incluye chunking nativo)

**KB y procesamiento de contenido:**
- `anthropics/skills@pdf` (procesamiento PDFs MINED y materiales del equipo)

*(Cortados: ~~`mindrally/skills@web-scraping`~~ (no scraping Studocu — riesgo legal), ~~`wshobson/agents@rag-implementation`~~, ~~`timescale/pg-aiguide@pgvector-semantic-search`~~, ~~`yoanbernabeu/grepai-skills@grepai-embeddings-openai`~~)*

**Diseño de app:**
- `sleekdotdesign/agent-skills@sleek-design-mobile-apps`
- `shadcn/ui@shadcn`
- `wshobson/agents@tailwind-design-system`
- `vercel-labs/agent-skills@web-design-guidelines`

**Cortadas (no necesarias en MVP recortado):**
- ~~`stripe/ai@stripe-best-practices`~~ (Stripe solo modo test, no checkout live)
- ~~`currents-dev/playwright-best-practices-skill`~~ (testing manual con equipo es suficiente para 50 usos)
- ~~`arvindrk/extract-design-system`~~ (usamos shadcn directo)
- ~~RAG/embeddings/pgvector skills~~ (KB completo va en prompt cache de Claude)
- ~~`aahl/skills@edge-tts`~~ (cambiamos a Azure Speech oficial)

**Total skills externas: 14 (vs 20 originales)**
**Total: 14 externas + 19 locales = 33 skills coordinadas**

---

## 12. Cronograma 7-10 días + 3 buffer

```
Día  Fecha          Hito principal                      Quién
─── ────────────── ───────────────────────────────────── ──────────────
0   26 abr (HOY)   Setup + verificaciones              Milton + equipo
1   27 abr (Lun)   Repo + Next.js + Supabase free       Yo + Milton
2   28 abr (Mar)   KB pipeline (ESEN+UCA+UES recortado) Yo + hermano
3   29 abr (Mie)   Backend audio→apunte funcional       Yo + Milton
4   30 abr (Jue)   Frontend capture + vista apunte      Yo + Milton
5   1  may (Vie)   Onboarding + library + extras (TTS)  Yo + Milton
6   2  may (Sab)   Landing elchero.app + polish UI      Xime + yo
7   3  may (Dom)   Smoke test + deploy a producción     Equipo
8   4  may (Lun)   VALIDACIÓN: 10-15 estudiantes        Mariana + hermano
9   5  may (Mar)   Bug fixes urgentes + testimonios     Xime + yo
10  6  may (Mie)   Pitch deck v1 + métricas validación  Xime + Milton
11  7  may (Jue)   Ensayo del pitch + reels Instagram   Equipo
12  8  may (Vie)   Buffer / detalles finales            Equipo
13  9 MAY (Sab)    PITCH CBE 🎯                         Equipo
```

### Distribución del trabajo

- **Milton:** desarrollo técnico junto a Claude, decisiones de producto, demo en vivo del pitch
- **Hermano (ESEN, Ing. Software y Negocios Digitales):** parciales reales ESEN, beta tester intensivo, recluta 3-5 ESEN para validación
- **Mariana:** parciales UCA/UES vía conocidos, recluta 3-5 bachilleres validadores, Instagram/TikTok
- **Xime:** pitch deck visual, filma testimonios día 8, copy salvadoreño, reels
- **Isa:** bases CBE, política privacidad + términos legales, logística pitch
- **Claude (yo):** build técnico, KB, skills coordination, ejecución día a día

---

## 13. Definición de "hecho" para cada feature

### Backend

- [ ] Endpoint `/api/process` recibe audio, devuelve apunte JSON estructurado
- [ ] Counter check funcionando (rechaza con 429 si supera 50 globales o 5 por usuario)
- [ ] Auto-detección con confidence score
- [ ] RAG funcionando con top-5 chunks
- [ ] TTS genera MP3 válido en es-MX
- [ ] Audio se borra automáticamente <1h post-procesado

### Frontend

- [ ] Landing en `elchero.app` con copy final, lighthouse score >85
- [ ] Login Google funciona
- [ ] Onboarding 3 pasos guarda perfil
- [ ] Capture (subir + grabar en vivo) funciona en Chrome, Safari, Firefox móvil
- [ ] Vista de apunte renderiza las 5 secciones core + extras correctamente
- [ ] Mapa mental Mermaid renderiza SVG válido
- [ ] Quiz interactivo cuenta score correctamente
- [ ] Botones de "Plan estudio" y "Modo docente" muestran modal "Próximamente Q2 2026"

### KB

- [ ] ESEN: 4 carreras con material en pgvector
- [ ] UCA + UES: 4 carreras top cada una
- [ ] AVANZO 6 instrumentos + currículo MINED ingeridos
- [ ] Búsqueda RAG <100ms p99 (sobra con free tier)

### Validación día 8

- [ ] 10-15 usuarios reales generaron al menos 1 apunte
- [ ] NPS promedio recolectado
- [ ] 3+ testimonios filmados por Xime
- [ ] 0 bugs críticos en flujo principal

### Pitch (día 13)

- [ ] Demo en vivo funciona sin caerse
- [ ] Backup video grabado por si falla algo
- [ ] Pitch deck final con métricas reales de validación
- [ ] Slides de roadmap Q2 2026 claras

---

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Bases CBE imponen restricciones que cambian scope | Pedir bases HOY a Isa antes de codear |
| `elchero.app` se lleva alguien antes que Milton | **Comprar HOY mismo** (confirmado disponible) |
| Supabase Free pausa en 7 días | Generar tráfico día 8-12 manteniéndolo activo |
| Whisper accuracy ~92% en salvadoreño | Vista de "Editar transcripción" antes de procesar; Claude post-fixes contexto |
| Anthropic Tier 1 RPM limit (50 RPM) en validación día 8 | Spread validación en 2 sesiones de 1h |
| Demo en vivo falla | Backup video pre-grabado de 60s + screenshots |
| Algún miembro del equipo no aporta tiempo | Re-asignar tareas, scope ya recortado |
| Bug crítico día 11 | Días 11-12 son ensayo + buffer; día 9 es fix dedicado |
| 50 usos se acaban antes del pitch | Counter resetable en producción si urgente |
| Cumplimiento Ley Datos SV (Nov 2024) | Páginas /privacidad + /terminos + checkbox consent + botón delete account + gate edad + RLS Supabase |
| Tarjetas SV declinadas en OpenAI/Anthropic | Plan B: Wise virtual card USD (gratis, 10 min) o tarjeta familiar |
| Bachilleres menores (<18) sin consent parental | Onboarding pregunta edad, si <18 muestra pantalla pidiendo consent del tutor antes de aceptar términos |
| Mermaid bundle 400KB pesado | Dynamic import client-side con `{ ssr: false }`, lazy load on click |
| `next-pwa` abandonado | Usar **Serwist** (sucesor mantenido) si hacemos PWA stretch goal |

---

## 15. Bloqueadores activos (HOY, 26 abr) — pendientes del equipo

1. ✅ Confirmado: `elchero.app` disponible — comprar HOY (5 min, $15)
2. **CRÍTICO:** Isa solicita bases oficiales CBE 2026 a coordinación ESEN
3. **CRÍTICO:** Milton confirma cuentas con saldo: OpenAI ($30+), Anthropic ($30+), Vercel, GitHub, Supabase
   - **Plan B si tarjeta SV declina:** crear Wise virtual card USD (10 min, gratis), o usar tarjeta familiar
4. ✅ Hermano confirmado: carrera "Ingeniería de Software y Negocios Digitales" en ESEN
5. Hermano envía sus parciales viejos ESEN (ya pedido)
6. Mariana contacta UCA/UES por temarios y recluta 5 bachilleres validadores
7. Xime define identidad visual del pitch deck
8. **CRÍTICO:** Mariana prepara hoja de consentimiento simple para validadores menores (~1 página, plantilla básica de "padre/tutor autoriza uso de Chero por X")
9. Confirmar lugar y formato del pitch del 9 de mayo (presencial/virtual, duración, materiales permitidos)

---

## 16. Lo que el jurado VE el 9 de mayo

✅ **Demo en vivo funcional** — un juez sube audio, recibe apuntes en 2 minutos
✅ **Demo killer:** procesar audio del propio jurado en vivo durante el pitch (su voz se vuelve apunte)
✅ **Validación real** — "tenemos 15 usuarios reales, X% NPS, acá los testimonios filmados"
✅ **App pulida** en `elchero.app`, identidad fuerte, dark/neón
✅ **5 secciones de apunte + audio TTS + mapa mental + quiz**
✅ **Modelo de negocio claro** con planes de pricing
✅ **Diferenciación brutal** vs Otter / Notion / Apple Intelligence
✅ **Privacy-by-design** defendible legalmente
✅ **Roadmap Q2 2026 visible** — TTS salvadoreño + WhatsApp bot + app móvil + colegios B2B + modo aliado docente funcional + plan estudio funcional

### Narrativa central del pitch (timing AVANZO)

> "Hoy es 9 de mayo. AVANZO 2026 se aplica el 28 y 29 de octubre. Los bachilleres salvadoreños tienen 6 meses entre el lanzamiento del Chero y su prueba nacional. Si empiezan a usar Chero desde HOY en cada clase, llegan al AVANZO con 100+ apuntes generados, flashcards listas, quizzes practicados. Mientras los demás se desesperan en la última semana, los usuarios de Chero llegan tranquilos. Esa conversión de free a Pro va a ser brutal en septiembre-octubre."

**El jurado no sabe (y no le importa) que internamente está limitado a 50 usos.** Lo que ven es un producto que funciona, que validó con 15 usuarios reales, y que tiene una ventana de mercado clara hasta octubre.

---

## 17. Sources verificadas

- **MINED — AVANZO 2025 (PDF oficial):** https://www.mined.gob.sv/avanzo/2025/Documento%20Informativo%20AVANZO%202025_VF.pdf
- **ESEN — Carreras de pregrado:** https://www.esen.edu.sv/carreras-de-pregrado/
- **ESEN — Centro Emprendedor (CBE):** https://www.esen.edu.sv/centro-emprendedor-2/
- **UCA — Oferta académica:** https://uca.edu.sv/oferta-academica/carreras/
- **Anthropic — Pricing oficial:** https://platform.claude.com/docs/en/about-claude/pricing
- **OpenAI — Pricing oficial:** https://developers.openai.com/api/docs/pricing
- **Supabase — Pricing:** https://supabase.com/pricing
- **Vercel — Limits:** https://vercel.com/docs/limits
- **QS World Rankings — Central America 2026:** https://www.topuniversities.com/latin-america-central-america-rankings?countries=sv
- **vercel-labs/skills (registry):** https://github.com/vercel-labs/skills
- **skills.sh (directorio):** https://skills.sh/
