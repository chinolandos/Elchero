# Chero MVP — Plan de Implementación Día por Día

**Spec base:** [2026-04-26-chero-mvp-design.md](../specs/2026-04-26-chero-mvp-design.md)
**Estado dominio:** ✅ `elchero.app` comprado en Porkbun (cuenta `ELcheroapp`, expira 2027-04-26)
**Pitch CBE:** Sábado 9 de mayo de 2026 (13 días)
**Versión:** 1.0

---

## 📅 Cronograma maestro

```
Día 0 — Domingo  26 abr  Setup cuentas + dominio + brief equipo
Día 1 — Lunes    27 abr  Repo Next.js + Supabase + Vercel deploy inicial
Día 2 — Martes   28 abr  KB pipeline (currículo MINED + AVANZO + parciales)
Día 3 — Miércoles 29 abr Backend: audio→transcripción→detección
Día 4 — Jueves   30 abr  Backend: generación de apuntes + TTS
Día 5 — Viernes  1  may  Frontend: auth + onboarding + capture
Día 6 — Sábado   2  may  Frontend: vista apunte + library + transcript edit
Día 7 — Domingo  3  may  Landing pública + páginas legales + deploy producción
Día 8 — Lunes    4  may  VALIDACIÓN con 10-15 estudiantes (2 sesiones de 1h)
Día 9 — Martes   5  may  Bug fixes + filmación testimonios
Día 10 — Miércoles 6 may Pitch deck v1 + integración métricas validación
Día 11 — Jueves  7  may  Reels Instagram + ensayo pitch v1
Día 12 — Viernes 8  may  Buffer / detalles finales / ensayo pitch v2
Día 13 — Sábado  9 MAY   PITCH CBE 🎯
```

---

## 🎯 Día 0 — HOY (26 abril)

**Objetivo:** todas las cuentas listas + equipo briefed + dominio comprado.

### Tareas Milton (3-4 horas total, distribuibles)

#### ✅ T0.1 — Comprar `elchero.app` en Porkbun
- **Estado:** ✅ COMPLETADO (verificado screenshot 26 abr)

#### T0.2 — Cuentas técnicas con saldo
- [ ] **OpenAI Platform** (https://platform.openai.com)
  - Crear cuenta
  - Add billing → cargar **$30 USD** (suficiente para todo el MVP)
  - **Si tarjeta SV declina:** crear cuenta Wise (https://wise.com), generar virtual card USD, reintentar
  - Generar API key, guardar en notes (la usaremos día 3)
- [ ] **Anthropic Console** (https://console.anthropic.com)
  - Crear cuenta
  - Add billing → cargar **$30 USD**
  - Generar API key, guardar
- [ ] **Supabase** (https://supabase.com)
  - Login con GitHub
  - Crear proyecto nuevo: `cheroapp` (región más cercana: East US — Virginia)
  - **NO crear tablas todavía** (lo hacemos mañana juntos)
- [ ] **Vercel** (https://vercel.com)
  - Login con GitHub
  - **NO upgradear a Pro todavía** (lo hacemos día 7 al deployar a producción)
- [ ] **GitHub** — verificar que tenés cuenta

#### T0.3 — Mensajes WhatsApp al equipo

**A Isa (URGENTE):**
> "Hola Isa! Necesito las bases oficiales de la CBE 2026 lo antes posible. ¿Las podés conseguir hoy o mañana en coordinación? Las necesitamos para definir bien el alcance del proyecto Chero."

**A todo el equipo (Mariana, Xime, hermano, Isa):**
> "Familia, arrancamos hoy el build del Chero con plan de 13 días para el pitch del 9 de mayo. Mañana lunes les paso roles específicos. Por ahora preparen lo siguiente:
>
> - **Mariana:** lista de 5-10 contactos bachilleres + universitarios para validación día 8 (lunes 4 mayo)
> - **Xime:** referencias visuales que te gusten para inspiración pitch deck
> - **Hermano:** seguir digitalizando parciales viejos ESEN
> - **Isa:** conseguir bases CBE + plantilla simple consentimiento parental
>
> Vamos a ganar esto. 🐎"

#### T0.4 — Confirmar al final del día
- [ ] Tarjeta internacional disponible: SÍ / NO / Wise plan B
- [ ] OpenAI con $30 cargados ✓
- [ ] Anthropic con $30 cargados ✓
- [ ] Supabase project `cheroapp` creado ✓
- [ ] Vercel cuenta lista ✓
- [ ] GitHub listo ✓
- [ ] Mensajes enviados al equipo ✓

### Acceptance criteria día 0
✅ Todas las cuentas creadas y con saldo verificado.
✅ Equipo briefed por WhatsApp.
✅ Hermano confirmó envío de parciales.

### Si algo falla
- **Tarjeta internacional declina:** plan B Wise (10 min). Plan C: tarjeta familiar.
- **Isa no responde:** seguir sin bases, scope se mantiene tal cual el spec.

---

## 🚀 Día 1 — Lunes 27 abr (Setup técnico)

**Objetivo:** repo en GitHub, app Next.js corriendo localmente, Supabase configurado.

### T1.1 — Repo + Next.js base (1.5 h)
- [ ] Crear repo `chero` en GitHub (privado)
- [ ] `npx create-next-app@latest chero --typescript --tailwind --app --src-dir`
- [ ] Estructura de carpetas según spec sección 4.2
- [ ] Configurar `.env.local` con keys de OpenAI, Anthropic, Supabase
- [ ] `git init`, primer commit, push a GitHub

### T1.2 — Setup Supabase (2 h)
- [ ] Schema inicial en Supabase SQL editor:
  ```sql
  -- Tabla profiles
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    email TEXT,
    age INT,
    is_minor BOOLEAN DEFAULT FALSE,
    has_guardian_consent BOOLEAN DEFAULT FALSE,
    user_type TEXT, -- 'bachiller' | 'universitario'
    institution TEXT,
    career TEXT,
    year INT,
    subjects TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Tabla notes
  CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    mode TEXT, -- 'avanzo' | 'periodo' | 'parciales' | 'repaso'
    subject TEXT,
    institution TEXT,
    transcript TEXT,
    summary TEXT,
    concepts JSONB,
    questions JSONB,
    flashcards JSONB,
    quick_review TEXT,
    audio_tts_url TEXT,
    mermaid_chart TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Tabla usage_counter (limit 50 globales + 5 por usuario)
  CREATE TABLE usage_counter (
    id INT PRIMARY KEY DEFAULT 1,
    total_uses INT DEFAULT 0,
    CONSTRAINT singleton CHECK (id = 1)
  );
  INSERT INTO usage_counter (id, total_uses) VALUES (1, 0);

  CREATE TABLE user_usage (
    user_id UUID PRIMARY KEY REFERENCES auth.users,
    uses INT DEFAULT 0
  );
  ```
- [ ] Habilitar Row Level Security (RLS) en todas las tablas
- [ ] Crear policies: cada user solo ve sus propios `notes` y `user_usage`
- [ ] Setup Supabase Auth → Google Provider
- [ ] Storage bucket `audios` con TTL configurado (signed URLs 1h expiry)
- [ ] Storage bucket `tts-output` (público, audios generados)

### T1.3 — Vercel deploy inicial (30 min)
- [ ] Conectar repo GitHub a Vercel
- [ ] Configurar env vars en Vercel dashboard
- [ ] Configurar `vercel.json`:
  ```json
  {
    "regions": ["iad1"],
    "functions": {
      "src/app/api/**/*.ts": { "maxDuration": 300 }
    }
  }
  ```
- [ ] Deploy a `*.vercel.app` (preview, no prod todavía)

### T1.4 — Configurar dominio en Vercel
- [ ] Vercel → Settings → Domains → Add `elchero.app`
- [ ] En Porkbun → DNS → cambiar nameservers a Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
- [ ] Esperar propagación (puede tardar 1-24h, no bloquea trabajo)

### Acceptance criteria día 1
✅ Repo en GitHub funcionando.
✅ App Next.js corre localmente en `localhost:3000`.
✅ Supabase schema creado con RLS.
✅ Deploy preview funcional en Vercel.
✅ DNS apuntando a Vercel (propagándose).

---

## 📚 Día 2 — Martes 28 abr (Knowledge Base)

**Objetivo:** KB completo en formato consumible por Claude prompt cache.

### T2.1 — Recolectar contenido oficial (2 h)
- [ ] Descargar PDF MINED currículo bachillerato 2026 (sitios oficiales)
- [ ] Descargar AVANZO 2025 informativo PDF
- [ ] Descargar PAES históricos disponibles (2019-2024)
- [ ] Procesar PDFs a texto plano (skill `anthropics/skills@pdf`)

### T2.2 — Quizlet AVANZO public sets (1 h)
- [ ] Visitar manualmente sets públicos AVANZO (ej: "Avanzo 2020 - Estudios Sociales")
- [ ] Copiar contenido relevante (texto público, uso legal)
- [ ] Estructurar en archivos markdown por instrumento AVANZO

### T2.3 — Recibir parciales del hermano (depende de él)
- [ ] Recibir PDFs/fotos de parciales ESEN del hermano
- [ ] Procesar con `pdf` skill, organizar por carrera/materia

### T2.4 — Construir KB consolidado (`scripts/kb/`)
- [ ] `scripts/kb/build.ts` — script que consolida todo en un solo archivo `kb-prompt.md`
- [ ] Estructura del KB final:
  ```
  ## CURRÍCULO MINED
  [bachillerato general 1° y 2°]
  [tercer ciclo]

  ## ESTRUCTURA AVANZO 2026
  [6 instrumentos con detalle]
  [ejemplos de preguntas reales por instrumento]

  ## ESTRUCTURA PARCIALES UNIVERSITARIOS
  [ESEN: 4 carreras + ejemplos]
  [UCA: top 4 carreras + ejemplos]
  [UES: top 4 carreras + ejemplos]
  [UDB, UEES: top 1 c/u]

  ## REGLAS ESPAÑOL SALVADOREÑO
  [voseo, modismos suaves, prohibición mexicanismos]

  ## FORMATO DE APUNTES POR MODO
  [AVANZO: estructura preguntas]
  [PERÍODO: estructura mixta]
  [PARCIALES: por tipo de materia]
  ```
- [ ] Verificar tamaño total: target <120K tokens (cabe en 200K Claude estándar)

### Acceptance criteria día 2
✅ Archivo `kb-prompt.md` consolidado, <120K tokens.
✅ Cobertura mínima: ESEN 4 carreras + UCA/UES top 4 + AVANZO 6 instrumentos + currículo MINED bachillerato.
✅ Reglas español salvadoreño claras.

---

## 🔧 Día 3 — Miércoles 29 abr (Backend: audio → transcripción → detección)

**Objetivo:** API endpoints procesando audio funcionalmente.

### T3.1 — `/api/process` esqueleto (1 h)
- [ ] Crear `src/app/api/process/route.ts`
- [ ] Recibe FormData con audio
- [ ] Auth check (usuario autenticado)
- [ ] Counter check: total_uses < 50 AND user_uses < 5
- [ ] Si pasa → continúa a transcripción

### T3.2 — Integración GPT-4o Mini Transcribe (2 h)
- [ ] Instalar OpenAI SDK
- [ ] Función `transcribe(audioFile)` con chunking si >25MB
- [ ] Chunking: dividir audio en pedazos de 24MB, transcribir cada uno, concatenar
- [ ] Devolver transcripción cruda

### T3.3 — Subir audio a Supabase Storage con signed URL (1 h)
- [ ] Storage upload con path `audios/{user_id}/{timestamp}.mp3`
- [ ] Crear signed URL con expiry 1h
- [ ] Cron job Vercel para borrar audios >1h (scheduled cron en `vercel.json`)

### T3.4 — `/api/detect-context` (auto-detección con Claude Haiku) (1.5 h)
- [ ] Endpoint recibe primeros 30s de transcripción + perfil del usuario
- [ ] Llama Claude Haiku con prompt corto: "Detecta materia, modo, confianza"
- [ ] Devuelve JSON estructurado
- [ ] Si confianza <85%, marca como `needs_user_confirmation`

### T3.5 — Test end-to-end
- [ ] Upload audio de prueba (1 min) → recibe transcripción
- [ ] Detección devuelve materia razonable

### Acceptance criteria día 3
✅ Audio sube → transcripción funcional.
✅ Detección automática funciona con confidence score.
✅ Counter incrementa.
✅ Audio se borra después de 1h (verificable manualmente).

---

## 🧠 Día 4 — Jueves 30 abr (Backend: generación de apuntes + TTS)

**Objetivo:** Claude genera apuntes completos + TTS funciona.

### T4.1 — Generación de apuntes con Claude Sonnet 4.6 (3 h)
- [ ] Construir system prompt con KB completo + reglas español + formato modo
- [ ] Prompt cache enabled (90% descuento)
- [ ] User prompt: transcripción + perfil + modo detectado
- [ ] Output structured JSON: `{summary, concepts, questions, flashcards, quick_review}`
- [ ] Validar estructura antes de guardar

### T4.2 — Almacenar apunte en Supabase (30 min)
- [ ] Insert en tabla `notes` con todos los campos
- [ ] RLS verifica que solo el user puede leer

### T4.3 — `/api/tts` — generar audio del apunte (2 h)
- [ ] Endpoint recibe `note_id`, identifica secciones a leer
- [ ] Concatena: resumen + conceptos + repaso 30s
- [ ] Llamada a OpenAI TTS modelo `tts-1` voz `nova` (femenina cálida)
- [ ] Sube MP3 a Supabase Storage bucket `tts-output`
- [ ] Devuelve URL pública

### T4.4 — Generación de Mermaid mapa mental (1 h)
- [ ] En el mismo prompt de Claude, pedir también código Mermaid del mapa mental
- [ ] Guardar en `notes.mermaid_chart`

### Acceptance criteria día 4
✅ Audio entra → en <60s recibís apunte completo JSON.
✅ TTS genera MP3 reproducible.
✅ Mermaid chart se genera correctamente.

---

## 🎨 Día 5 — Viernes 1 may (Frontend: auth + onboarding + capture)

**Objetivo:** flujo de usuario desde login hasta subir audio.

### T5.1 — Setup shadcn/ui (30 min)
- [ ] `npx shadcn-ui@latest init`
- [ ] Instalar componentes: button, card, dialog, input, select, checkbox, form, toast, tabs

### T5.2 — Auth con Google + página login (1 h)
- [ ] `app/(auth)/login/page.tsx`
- [ ] Botón "Continuar con Google" → Supabase Auth
- [ ] Callback handler en `app/auth/callback/route.ts`
- [ ] Redirige a `/onboarding` si nuevo, `/capture` si existente

### T5.3 — Onboarding de 3 pasos (3 h)
- [ ] Paso 1: edad (gate)
- [ ] Si <18: pantalla "Necesitamos consentimiento de tu tutor" + checkbox
- [ ] Paso 2: bachiller/universitario + institución + año
- [ ] Paso 3: materias actuales (multi-select)
- [ ] Checkbox final: aceptar términos + privacidad
- [ ] Guardar en tabla `profiles`

### T5.4 — Página `/capture` (2 h)
- [ ] Botón grande "Subir audio" + "Grabar en vivo"
- [ ] Drag & drop file upload
- [ ] Web Audio API + MediaRecorder polyfill para grabar
- [ ] Indicador de progreso de upload
- [ ] Loader mientras procesa

### Acceptance criteria día 5
✅ Login con Google funcional.
✅ Onboarding completo guarda perfil.
✅ Página capture sube audio y dispara `/api/process`.

---

## 📖 Día 6 — Sábado 2 may (Frontend: vista apunte + library + transcript edit)

**Objetivo:** usuario puede ver, editar y compartir su apunte.

### T6.1 — Vista de transcripción con edición (1.5 h)
- [ ] `app/(app)/transcript-edit/[id]/page.tsx`
- [ ] Muestra transcripción cruda en textarea editable
- [ ] Botones: "Procesar" / "Editar" / "Descartar"
- [ ] Después de procesar, redirige a `/notes/[id]`

### T6.2 — Vista de apunte completo (3 h)
- [ ] `app/(app)/notes/[id]/page.tsx`
- [ ] Header: materia, modo, fecha, botón ⚙️ opciones
- [ ] Sección Resumen
- [ ] Sección Conceptos clave (cards)
- [ ] Sección Preguntas tipo examen (collapsible)
- [ ] Sección Flashcards interactivas (animación voltear)
- [ ] Sección Repaso 30s (card destacada)
- [ ] Botón "🎧 Escuchar apunte" → reproduce TTS
- [ ] Botón "🗺️ Ver mapa mental" → lazy load Mermaid (`{ ssr: false }`)
- [ ] Botón "🎮 Quiz interactivo" → modal con preguntas + score
- [ ] Botón "📲 Compartir por WhatsApp" → `wa.me?text=...`
- [ ] Botón "📋 Copiar link"

### T6.3 — Library / historial (1 h)
- [ ] `app/(app)/library/page.tsx`
- [ ] Grid de cards de apuntes anteriores
- [ ] Filtros: por materia, por modo, por fecha
- [ ] Click → abre apunte

### T6.4 — Mockups de features pospuestas (30 min)
- [ ] Botón "Plan de estudio" en library → modal "Próximamente Q3 2026"
- [ ] Botón "Compartir con profe (modo aliado)" en notes → modal QR placeholder

### Acceptance criteria día 6
✅ Flujo completo: subir audio → ver transcripción → editar → procesar → ver apunte.
✅ Compartir por WhatsApp funciona (abre wa.me).
✅ TTS, Mermaid, Quiz funcionan.
✅ Library muestra apuntes del usuario.

---

## 🚀 Día 7 — Domingo 3 may (Landing + páginas legales + deploy producción)

**Objetivo:** `elchero.app` live con todo el flujo funcionando.

### T7.1 — Landing pública (`/`) (3 h)
- [ ] Hero: "El Chero — apuntes con IA, hechos a tu medida"
- [ ] Features (3 columnas con iconos)
- [ ] Demo video / GIF de uso
- [ ] Counter público "Hoy: X/50 audios procesados — únete a la beta"
- [ ] Sección AVANZO timing: "Faltan X días para AVANZO 2026 (28 oct)"
- [ ] Diferenciación vs Otter (tabla)
- [ ] Pricing (con disclaimer "Beta gratis, suscripciones desde Q3 2026")
- [ ] Footer con links a legales

### T7.2 — Páginas legales (2 h)
- [ ] `/privacidad` — política completa cumpliendo Ley Datos SV Nov 2024
  - Qué datos recolectamos (audio, perfil, transcripciones)
  - Bases legales (consentimiento informado)
  - Retención (audio 1h, apuntes hasta que el user los borre)
  - Derechos del usuario (acceso, rectificación, supresión)
  - Contacto Oficial Protección de Datos (Isa)
- [ ] `/terminos` — TOS profesionales
  - Uso solo para estudio personal
  - No compartir audio crudo
  - Respetar reglamento institucional
  - Sin garantías de exactitud (educational tool)
- [ ] `/como-funciona` — explicación del privacy-by-design

### T7.3 — Settings: eliminar cuenta (30 min)
- [ ] `app/(app)/profile/page.tsx` con info perfil
- [ ] Botón "Eliminar mi cuenta y todos mis datos"
- [ ] Confirmación double-check
- [ ] Backend: cascade delete (apuntes, perfil, auth user)

### T7.4 — Upgrade Vercel a Pro + Fluid Compute (15 min)
- [ ] Vercel dashboard → Upgrade plan to Pro ($20)
- [ ] Settings → Functions → Enable Fluid Compute
- [ ] Verificar deploy region `iad1`

### T7.5 — Deploy a producción (1 h)
- [ ] Verificar DNS de `elchero.app` apunta a Vercel ✓
- [ ] Push a `main` branch
- [ ] Smoke test: navegar todo el flujo en producción
- [ ] Verificar HTTPS automático funciona
- [ ] Verificar TTL de audios funciona (esperar 1h, ver si se borra)

### Acceptance criteria día 7
✅ `https://elchero.app` live y funcional.
✅ Todo el flujo end-to-end funciona en producción.
✅ Páginas legales accesibles.
✅ Vercel Pro + Fluid Compute habilitados.

---

## 👥 Día 8 — Lunes 4 may (VALIDACIÓN con usuarios reales)

**Objetivo:** 10-15 estudiantes salvadoreños prueban Chero, recoger métricas y testimonios.

### Sesión 1: 3pm-4pm (5-7 estudiantes) — Mariana coordina
- Bachilleres reclutados por Mariana
- Cada uno sube 1 audio de su clase reciente
- Acompañamiento en vivo (Zoom o presencial)
- Encuesta NPS al final (Google Form simple)

### Sesión 2: 5pm-6pm (5-7 estudiantes más)
- Universitarios reclutados por hermano + Mariana
- Mismo protocolo

### Para cada validación:
- [ ] Usuario crea cuenta + onboarding
- [ ] Usuario sube/graba audio real
- [ ] Recibe apunte
- [ ] Llena encuesta:
  - ¿Te sirvió? (1-10)
  - ¿Lo usarías de nuevo? (Sí/No)
  - ¿Pagarías $2.99/mes? (Sí/No/Quizás)
  - Lo mejor del Chero
  - Lo peor del Chero
  - 1 sugerencia
- [ ] Xime filma testimonio en video corto (1-2 min) si el usuario acepta

### Acceptance criteria día 8
✅ 10-15 usuarios completaron flujo end-to-end.
✅ NPS recolectado.
✅ 3-5 testimonios filmados.
✅ Lista de bugs descubiertos (prioridad alta vs baja).

---

## 🔧 Día 9 — Martes 5 may (Bug fixes + processing testimonios)

**Objetivo:** arreglar bugs críticos del feedback + montar testimonios.

### Mañana — Bug fixes (Milton + yo)
- [ ] Triage de bugs por severidad
- [ ] Fix bugs críticos (los que tumban el flow)
- [ ] Defer bugs cosméticos a roadmap

### Tarde — Testimonios (Xime)
- [ ] Editar 3-5 videos de 30-60s cada uno
- [ ] Subir a YouTube unlisted o Cloudinary
- [ ] Crear página `/historias` o sección en landing

### Métricas para el pitch
- [ ] Calcular NPS final
- [ ] Top 3 quotes positivos
- [ ] Estadísticas: "X% diría que es útil", "X% pagaría"

### Acceptance criteria día 9
✅ App estable sin bugs críticos.
✅ Wall of love con testimonios visible en landing.
✅ Métricas validación procesadas.

---

## 🎤 Día 10 — Miércoles 6 may (Pitch deck v1 + métricas)

**Objetivo:** primer borrador del pitch deck completo.

### Estructura del pitch (15 slides max, 8-10 minutos)

1. **Slide 1 — Título:** "El Chero — apuntes con IA, hechos a tu medida"
2. **Slide 2 — El problema:** "Bachilleres y universitarios salvadoreños pierden 1-2 horas diarias tomando apuntes mediocres"
3. **Slide 3 — La solución:** demo del producto en 30s
4. **Slide 4 — Demo en vivo:** procesar audio del jurado AHÍ MISMO
5. **Slide 5 — Validación real:** "15 usuarios reales, NPS X, X% diría que es útil"
6. **Slide 6 — Testimonios filmados:** 3 videos de 20s
7. **Slide 7 — Diferenciación:** tabla vs Otter / Notion / Apple
8. **Slide 8 — Mercado:** AVANZO 28 oct + 184K universitarios SV
9. **Slide 9 — Modelo de negocio:** Freemium + B2B
10. **Slide 10 — Privacy + Compliance:** Ley Datos Nov 2024 + Ley IA Feb 2025
11. **Slide 11 — Roadmap Q3 2026:** WhatsApp bot + app móvil + voice cloning + modo docente funcional
12. **Slide 12 — Equipo:** fotos + roles
13. **Slide 13 — Métricas que pedimos:** dominio comprado, app live, validación real
14. **Slide 14 — Visión:** "Cada estudiante salvadoreño con su Chero"
15. **Slide 15 — Cierre:** CTA + contacto + redes

### Tareas
- [ ] Xime crea slides en Figma o Canva
- [ ] Milton revisa contenido
- [ ] Recopila assets (testimonios, screenshots, métricas)

### Acceptance criteria día 10
✅ Pitch deck v1 listo (15 slides).
✅ Demo backup video grabado de 60s (por si algo falla en vivo).

---

## 📱 Día 11 — Jueves 7 may (Reels + ensayo pitch)

### T11.1 — Reels Instagram (Mariana + Xime)
- [ ] Reel 1: "Cómo nació Chero" (storytelling, 30s)
- [ ] Reel 2: Demo de uso (30s)
- [ ] Reel 3: Testimonio destacado (15s)
- [ ] Programar publicación

### T11.2 — Ensayo del pitch v1 (todo el equipo)
- [ ] Milton presenta el pitch completo
- [ ] Equipo da feedback
- [ ] Cronometrar (8-10 min target)
- [ ] Identificar palabras o slides débiles

### T11.3 — Iteración pitch deck v2
- [ ] Aplicar feedback del ensayo
- [ ] Pulir transiciones
- [ ] Agregar/quitar slides según feedback

### Acceptance criteria día 11
✅ 3 reels publicados o programados.
✅ Pitch ensayado mínimo 1 vez.

---

## ✨ Día 12 — Viernes 8 may (Buffer + ensayo final)

**Objetivo:** pulir últimos detalles, ensayar pitch 3-5 veces más.

### Mañana — Buffer
- [ ] Cualquier bug pendiente
- [ ] Cualquier mejora visual de última hora
- [ ] Verificar que counter de 50 usos NO se haya agotado (si sí, resetear)
- [ ] Preparar backup video demo
- [ ] Verificar internet en lugar del pitch

### Tarde — Ensayos (4-5 rondas)
- [ ] Ensayo 1: Milton solo
- [ ] Ensayo 2: con equipo, simulando jurado
- [ ] Ensayo 3: foco en demo en vivo
- [ ] Ensayo 4: foco en respuestas a preguntas difíciles
- [ ] Ensayo 5: pitch final completo, cronometrado

### Preparación logística
- [ ] Llevar laptop + cargador + adaptador HDMI
- [ ] Backup en USB del video demo + pitch deck PDF
- [ ] Hotspot del celular como backup de internet
- [ ] Camisa/look profesional listo

### Acceptance criteria día 12
✅ Pitch fluido, dentro de tiempo.
✅ Equipo confiado en el demo.
✅ Backups preparados.

---

## 🏆 Día 13 — Sábado 9 MAYO — PITCH CBE 🎯

**Objetivo:** GANAR.

### Antes del pitch
- [ ] Llegar 30 min antes
- [ ] Verificar setup técnico (proyector, audio, internet)
- [ ] Verificar app funciona en vivo (subir audio de prueba)
- [ ] Equipo en posiciones

### Durante el pitch
- [ ] Milton presenta
- [ ] Demo en vivo del audio del jurado (si se puede)
- [ ] Xime/Mariana pasan diapositivas
- [ ] Isa asiste con cualquier pregunta legal/operacional

### Después del pitch
- [ ] Networking con jurado y otros equipos
- [ ] Recopilar contactos
- [ ] Compartir el `elchero.app` con quien pregunte
- [ ] Celebrar 🎉

---

## 📋 Riesgos identificados con mitigación

Ver [spec sección 14](../specs/2026-04-26-chero-mvp-design.md#14-riesgos-y-mitigaciones).

---

## 📊 Métricas de éxito del plan

- ✅ App live en `elchero.app` antes del día 8
- ✅ Mínimo 10 usuarios reales validaron antes del pitch
- ✅ NPS >40 (industry baseline para apps SaaS)
- ✅ 3+ testimonios filmados auténticos
- ✅ Pitch dentro de tiempo (8-10 min)
- ✅ Demo en vivo funciona durante el pitch
- ✅ **CBE 2026 ganada (objetivo último)**

---

## 🆘 Plan de contingencia

### Si la app cae en vivo durante el pitch
1. No entrar en pánico
2. Mostrar el video backup grabado (Día 10)
3. Continuar el pitch con confianza
4. "Tenemos backup justamente porque sabemos que vivo todo puede pasar"

### Si los 50 usos se acaban antes del pitch
1. Resetear contador en Supabase (1 query)
2. O agregar 50 más al counter (mismo)

### Si Vercel cae
- Backup: tener ZIP del proyecto local listo, deploy a Netlify en 5 min como fallback (Netlify free tier permite comercial)

### Si Anthropic API falla
- Fallback a Claude vía AWS Bedrock (mismo modelo, otra ruta)
- O tener apuntes pre-generados de demo (5-10 ejemplos) en caso de demo

### Si las cuentas de Milton no funcionan
- Pedir API keys prestadas a un compañero/familiar con cuentas activas
- Wise virtual card como plan B universal

---

## 💬 Comunicación del equipo

**Canal único:** WhatsApp del equipo Chero
**Updates diarios:** 9pm cada noche, breve update de cada miembro
**Decisiones críticas:** confirmadas por Milton en chat
**Bloqueadores:** se reportan inmediatamente, no se acumulan

---

## ✅ Checklist final pre-pitch

- [ ] Dominio `elchero.app` funcionando con HTTPS
- [ ] App live en producción
- [ ] 50 contador con holgura para el pitch (≥10 usos disponibles)
- [ ] Pitch deck en USB + Google Slides + email
- [ ] Backup video demo en USB + Drive
- [ ] Laptop cargada + cargador + adaptadores
- [ ] Métricas validación impresas en hoja
- [ ] 3 testimonios listos para mostrar
- [ ] Equipo descansó la noche anterior
- [ ] Camisa Chero (si Xime alcanzó a hacer) o look profesional

---

🐎 **Vamos por la CBE 2026.**
