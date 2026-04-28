# Chero — Contexto del Proyecto (CBE 2026)

> Documento maestro con todo el contexto del proyecto Chero para la Competencia Bachiller Emprendedor 2026 de la ESEN.
> Última actualización: 2026-04-27 (Día 3 cerrado — backend en producción, 13 fixes aplicados)
>
> **Estado actual:** [https://elchero.app](https://elchero.app) está LIVE con landing branded.
> Backend `/api/process` funcional. 13 días para el pitch del 9 de mayo.

---

## 1. Competencia

- **Nombre**: CBE 2026 (Competencia Bachiller Emprendedor) — ESEN, El Salvador
- **Organiza**: Centro Emprendedor + SAE (desde 2014)
- **Lanzamiento**: 28 de febrero de 2026 (ya ocurrido) — campus Ricardo Poma
- **🎯 PITCH FINAL: 9 de mayo de 2026 (13 días desde hoy)**
- **Tema 2026**: "IA - Impulsando Emprendimientos: Humanos + Tecnología"
- **Estructura (3 fases)**:
  1. Idea validada + pitch ← **estamos aquí**
  2. Modelo y plan de negocio
  3. Conexión con ecosistema

---

## 2. Equipo (5 activos + colaboradores)

**Activas (4)**:
- **Milton** — usuario / líder técnico / desarrollador principal junto a Claude
- **Isa Galdámez** — admin del grupo de WhatsApp · +503 6984 7175 — coordina con CBE, política privacidad y términos legales
- **Mariana** — +503 6984 7372 — KB universitario UCA/UES, validación bachilleres, Instagram/TikTok
- **Xime** — +503 7627 6796 — diseño visual pitch deck, testimonios filmados, copy salvadoreño

**Colaboradores clave**:
- **Hermano de Milton** — estudiante ESEN, **Ingeniería de Software y Negocios Digitales** — aporta parciales reales ESEN, beta tester intensivo, recluta validadores ESEN

**Inactivos**: Samuel y Cornejo (en el grupo pero no participan).

---

## 3. La idea: Chero

Web app que recibe el audio de una clase y devuelve apuntes en español salvadoreño con preguntas tipo examen, flashcards, audio para repasar, mapa mental, plan de estudio y modo aliado para el docente. Hecho específicamente para AVANZO, parciales universitarios y pruebas de período del bachillerato.

- **Tagline oficial**: "El Chero — apuntes con IA, hechos a tu medida"
- **Dominio elegido**: `elchero.app` (pendiente verificar/comprar — ~$10-18/año en Porkbun)

### Modos del producto (4)

| Modo | Audiencia | Cuándo se usa |
|---|---|---|
| **AVANZO** | Bachilleres último año | Prueba estandarizada nacional MINED |
| **Período** | Bachilleres + tercer ciclo | **4 períodos evaluativos** del MINED en bachillerato (terminología oficial) |
| **Parciales** | Universitarios | Exámenes parciales en universidades |
| **Repaso General** | Todos | Sin audio: tutor IA para repasar |

### Diferenciación vs Otter / Notion AI / Apple Intelligence

- ✅ Español salvadoreño con voseo y modismos suaves (no mexicanismos/españolismos)
- ✅ Currículo MINED + AVANZO 6 instrumentos + 12 universidades SV
- ✅ Formato estudiante (no ejecutivo): preguntas tipo examen, flashcards, repaso 30s
- ✅ Privacy-by-design: audio se borra al procesar
- ✅ Modo Aliado Docente con QR (único en el mercado)
- ✅ WhatsApp-first (Click-to-Chat en MVP, bot real en Q2 2026)
- ✅ Modo colaborativo de salón en tiempo real

### Modelo de negocio

- **Freemium**: $2.99/mes estudiante (free trial 7 días sin tarjeta)
- **B2B Colegios**: $49/aula/mes
- **B2B Universidades**: plan institucional negociable
- **Programa embajadores**: 1 mes Pro gratis por cada 5 amigos invitados

---

## 4. AVANZO — formato oficial verificado MINED 2025

> Reemplazó a la PAES. Aplicación virtual.

**6 instrumentos × 35 ítems opción múltiple (4 opciones, 30 puntuables + 5 investigación):**

1. **Precálculo** (no se llama "Matemática")
2. **Ciudadanía y Valores** (no "Estudios Sociales")
3. **Ciencia y Tecnología** (no "Ciencias Naturales")
4. **Lenguaje y Literatura**
5. **Inglés** (nuevo, no existía en PAES)
6. **Componente vocacional** (intereses y aptitudes)

---

## 5. Universidades cubiertas en el KB (12 universidades, ~22 carreras a profundidad)

**Tier 1 — Profundidad MÁXIMA**:
- **ESEN** (jueces aquí) — 4 carreras oficiales:
  1. Licenciatura en Economía y Negocios
  2. Licenciatura en Ciencias Jurídicas
  3. Ingeniería de Negocios
  4. **Ingeniería de Software y Negocios Digitales** ← *carrera del hermano de Milton*
- **UCA** (#58 QS regional, mejor SV en QS) — top 10 carreras
- **UES** (mayor matrícula pública, 80+ carreras) — top 10 carreras

**Tier 2 — Profundidad alta**:
- UDB (301-350 QS), UEES, UFG, UTEC, UNICAES — top 5 cada una

**Tier 3 — Reconocimiento básico**:
- UJMD, USAM, UPED, UMA — top 3 cada una

---

## 6. Estado al cierre de la sesión 2026-04-26

### Aprobado y diseñado
- ✅ Idea elegida y nombre decidido
- ✅ Equipo aceptó la idea de Chero
- ✅ Demo HTML construida ([index.html](./index.html) — 40KB)
- ✅ ZIP empaquetado y subido a Hostinger
- ✅ **Spec maestro completo escrito** ([2026-04-26-chero-mvp-design.md](./docs/superpowers/specs/2026-04-26-chero-mvp-design.md))
- ✅ Stack técnico decidido (Next.js + Supabase + Vercel + GPT-4o Mini + Claude Sonnet 4.6)
- ✅ Manifiesto de 39 skills (19 locales + 20 externas verificadas)
- ✅ Cronograma 13 días con distribución de equipo

### Día 0 (26 abr) — ✅ COMPLETADO
- ✅ `elchero.app` comprado en Porkbun (válido hasta 2027-04-26)
- ✅ Cuentas con saldo: OpenAI ($10), Anthropic ($12), Supabase, Vercel, GitHub
- ✅ Bases CBE recibidas de Isa (analizadas en `docs/bases-cbe-2026/`)
- ✅ Brief enviado al equipo

### Día 1 (27 abr) — ✅ COMPLETADO (en 1 día consolidados Días 1+2+3)
- ✅ Repo `Elchero` en GitHub
- ✅ Next.js 16 + Tailwind v4 + TypeScript bootstrapped
- ✅ Supabase: 4 tablas + RLS + Auth Google + 2 Storage buckets
- ✅ Vercel deploy + dominio `elchero.app` apuntando con SSL automático
- ✅ Knowledge Base ~10K tokens (5 archivos) consolidado en system prompt
- ✅ Backend `/api/process` (auth + counter atómico + transcribe + auto-detect)
- ✅ Cron `/api/cron/cleanup-audios` (1x/día Hobby compatible)
- ✅ `/auth/callback` Google OAuth handler
- ✅ Middleware Supabase session refresh
- ✅ Custom error/loading/not-found pages
- ✅ OG image dinámica (1200x630)
- ✅ next.config.ts con security headers (HSTS, X-Frame-Options, Permissions-Policy)
- ✅ 4 RPCs SQL atómicos (try_increment_usage, refund_usage, increment_global, increment_user)
- ✅ Audit deep 3 rondas + 13 fixes críticos aplicados
- ✅ Landing branded "El Chero" en producción

### Pendientes próximos días
- ⏳ Hermano de Milton aporta sus parciales viejos ESEN (esperando)
- ⏳ Mariana contacta UCA/UES por temarios + recluta bachilleres validadores día 8
- ⏳ Xime empieza pitch deck visual + identidad

### Lo que falta construir
- ❌ `/api/generate-notes` con Claude Sonnet 4.6 + KB cacheado (Día 4)
- ❌ `/api/tts` con OpenAI Nova (Día 4)
- ❌ `/api/profile` CRUD (Día 4)
- ❌ Frontend: login + onboarding + capture (Día 5)
- ❌ Frontend: vista apunte + library + transcript edit (Día 6)
- ❌ Landing completa + páginas legales (Día 7)
- ❌ Validación con 10-15 usuarios reales (Día 8)
- ❌ Pitch deck final + ensayos (Días 9-12)

---

## 7. Plan acordado: "MVP Demo + 50 Usos"

Web app totalmente funcional con feature set completo, **limitada a 50 procesamientos totales** (suficiente para pitch en vivo + validación con 10-15 estudiantes reales). Stack en free tiers.

- **Stack**: GPT-4o Mini Transcribe + Claude Sonnet 4.6 200K ctx (con prompt cache 90%, KB completo en cache, sin RAG) + **OpenAI TTS pagado** (comercial OK) + Supabase Free + **Vercel Pro 1 mes** (uso comercial obligatorio) + Stripe modo test
- **Tiempo**: 7-10 días de build + 3 días de buffer (26 abr - 9 may)
- **Costo total**: ~$63 USD una sola vez (dominio $15 + Vercel Pro $20 + APIs $18 + buffer $10)
- **Costo recurrente post-pitch**: $0 si downgradeás a free tiers / $45/mes si seguís con Pro
- **Límite técnico**: 5 audios por usuario × hasta 50 totales globales

### Lo que entra al MVP (todas funcionales)

- Audio in → 5 secciones core (resumen + conceptos + preguntas + flashcards + repaso 30s)
- Extras funcionales: audio TTS (Edge TTS es-MX), mapa mental Mermaid, quiz interactivo
- 4 modos (AVANZO + Período + Parciales + Repaso General)
- Login Google + onboarding 3 pasos
- Auto-detección de materia con confidence score
- Landing pública en `elchero.app`
- Validación real con 10-15 usuarios reales antes del pitch

### Lo que entra como mockup (visible pero no funcional)

- Modo Aliado Docente con QR (botón muestra "Próximamente Q2 2026")
- Plan de estudio personalizado (UI mostrada, sin SM-2 detrás)
- Stripe pricing page (botones "Suscribirse" abren modal "Próximamente")

### Roadmap visible en pitch (Q2 2026 — funcionales reales)

- Modo Aliado Docente con QR funcional
- Plan de estudio con repetición espaciada SM-2 funcional
- Modo Salón Colaborativo en tiempo real (websockets)
- Stripe checkout live con planes pagos
- App móvil nativa iOS/Android
- Bot WhatsApp Business API real
- Voice cloning con voz salvadoreña customizada

---

## 8. Riesgos que los jueces van a atacar y nuestras respuestas

| Objeción del jurado | Respuesta defensiva |
|---|---|
| "Otter ya hace esto" | "Otter no sabe AVANZO, no habla salvadoreño, no conoce el currículo MINED, no tiene modo aliado docente, no tiene plan de estudio" |
| "¿Es legal grabar a un docente?" | "Privacy-by-design: el audio se borra al procesar. Términos obligan a respetar reglamento institucional. Y tenemos modo Aliado Docente con QR: el profe recibe los apuntes y los corrige" |
| "Los estudiantes no pagan" | "Free trial 7 días + $2.99/mes = precio de un café. Programa embajadores. Y el revenue real está en B2B colegios y universidades" |
| "¿Cómo escalan?" | "Stack serverless (Vercel + Supabase pgvector). 1,000 usuarios cuesta ~$1,200/mes con margen positivo desde el día 1" |
| "¿De dónde sacan los exámenes?" | "Multi-fuente: Studocu, repositorios institucionales, programa embajadores estudiantiles, recolección directa por el equipo, y fallback sintético validado" |

---

## 9. Próximos pasos inmediatos

**Día 0 (HOY, 26 abr):**
1. Verificar y comprar `elchero.app`
2. Pedir bases CBE
3. Setup cuentas con saldo
4. Hermano confirma carrera y empieza recolección de parciales

**Días 1-2 (27-28 abr):**
1. KB pipeline ingesta + scraping (Claude + hermano)
2. Setup repo Next.js + Supabase + Vercel

**Días 3-7 (29 abr - 3 may):**
1. Build técnico FULL (backend + frontend)

**Día 8 (4 may):** Deploy producción + smoke test

**Días 9-10 (5-6 may):** Validación con 15-20 estudiantes reales

**Días 11-12 (7-8 may):** Bug fixes + pitch deck v2 + ensayo final

**Día 13 (9 MAY):** PITCH CBE 🎯

---

## 10. Archivos en esta carpeta

- [`index.html`](./index.html) — demo visual interactiva original (40KB) — se migra a Next.js en días 6-7
- `Chero-app.zip` — paquete Linux-compatible original para Hostinger (legacy)
- [`CONTEXTO.md`](./CONTEXTO.md) — este documento (siempre actualizado)
- [`docs/superpowers/specs/2026-04-26-chero-mvp-design.md`](./docs/superpowers/specs/2026-04-26-chero-mvp-design.md) — **spec maestro del MVP**
- `app/` — código Next.js de la app (vacío hasta día 1)
- `scripts/` — pipelines de KB ingesta (vacío hasta día 1)
- `.claude/skills/` — skills externas instaladas (vacío hasta día 0 setup)

---

## 11. Cambios documentados desde la versión original

1. ❌ "PAES" → ✅ "AVANZO 6 instrumentos" (verificado MINED)
2. ❌ "tu cuate de estudio" (mexicanismo) → ✅ "apuntes con IA, hechos a tu medida"
3. ❌ "1-2 días tiempo estimado" → ✅ "7-10 días build + 3 buffer (equipo de 5)"
4. ❌ "$5-10 costo API" → ✅ "**~$41 USD total una sola vez** (free tiers + límite 50 usos)"
5. ➕ 4 modos en lugar de 1 (AVANZO + Período + Parciales + Repaso General)
6. ➕ Lista verificada carreras ESEN (4 oficiales)
7. ➕ Equipo con roles asignados
8. ➕ Stack técnico definido (free tiers: Supabase Free + Vercel Hobby)
9. ➕ Manifiesto skills (17 externas + 19 locales = 36 totales)
10. ➕ Spec maestro escrito y vinculado
11. ➕ **Estrategia "Demo + 50 Usos":** producto completo funcional pero limitado a 50 procesamientos (5 por usuario, 50 globales) para mantener costos bajos
12. ➕ Features pospuestas a Q2 2026 documentadas como mockup en UI (modo docente, plan estudio, modo colaborativo)
13. ✅ **Auditoría legal aplicada (segunda revisión):**
    - Vercel Hobby PROHÍBE uso comercial → upgradeado a Vercel Pro 1 mes ($20)
    - Edge TTS scrapeada legalmente gris → cambiado a Azure Speech free tier oficial Microsoft
    - pgvector HNSW falla en Supabase Free con embeddings 3072-dim → cortado RAG entero, KB va en prompt cache de Claude
14. ✅ Renombrado "Período/Trimestre" → "Período" (4 períodos evaluativos en bachillerato, terminología oficial MINED)
15. ➕ Audio chunking >25MB para Whisper API + polyfill MediaRecorder para Safari iOS
16. ✅ **Auditoría legal aplicada (tercera revisión):**
    - Azure Speech free tier comercial uso restringido → cambiado a **OpenAI TTS pagado** ($2.25 para 50 audios, comercial OK explícito)
    - Claude 1M ventana requiere tier 4 → diseño con **200K ventana estándar** disponible para todos los tiers
    - Studocu scraping prohibido en TOS → **cortado**, reemplazado con 6 fuentes legales (MINED + universidades + **Quizlet sets públicos manual** + equipo + repositorios + sintéticos)
17. ✅ Confirmado dominio `elchero.app` disponible para compra
18. ✅ Confirmado CBE 2026 sin restricciones especiales
