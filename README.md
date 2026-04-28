# 🐎 El Chero

> Apuntes con IA, hechos a tu medida — para AVANZO, parciales universitarios y pruebas de período del bachillerato salvadoreño.

**Producción:** [https://elchero.app](https://elchero.app)
**Pitch CBE 2026:** 9 de mayo de 2026 (ESEN, Centro Emprendedor)
**Estado:** MVP "Demo + 50 usos" en construcción

---

## Stack

- **Frontend:** Next.js 16 App Router · React 19 · Tailwind v4 · shadcn/ui
- **Hosting:** Vercel (region `iad1`)
- **DB + Auth + Storage:** Supabase (Postgres con RLS, Google OAuth, Storage buckets)
- **Transcripción:** OpenAI GPT-4o Mini Transcribe ($0.003/min)
- **LLM principal:** Anthropic Claude Sonnet 4.6 (con prompt caching 90% descuento)
- **LLM detección:** Claude Haiku 4.5
- **TTS:** OpenAI TTS (voz Nova/Echo)

## Estructura

```
.
├── docs/                       Specs, plans, análisis bases CBE
├── scripts/
│   ├── kb/                     Knowledge Base (~10K tokens consolidados)
│   │   ├── 00-system-prompt.md System prompt maestro
│   │   ├── 01-core-mined.md    Currículo + AVANZO + períodos
│   │   ├── 02-universidades-sv Universidades + parciales
│   │   ├── 03-espanol-...      Reglas de tono salvadoreño
│   │   ├── 04-prompts-por-modo Specs por modo
│   │   └── build.ts            Consolidador
│   └── sql/                    Schemas Supabase
│       ├── 01-schema.sql       Tablas + RLS + trigger
│       ├── 02-counter-rpcs.sql RPCs atómicos counters
│       └── 03-improvements.sql CHECK constraints + índices adicionales
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── process/        Audio → transcript → detect
│   │   │   └── cron/           Cleanup audios huérfanos (1x/día)
│   │   ├── auth/callback/      Google OAuth handler
│   │   ├── error.tsx           Error UI custom
│   │   ├── not-found.tsx       404 UI custom
│   │   ├── loading.tsx         Loading UI
│   │   ├── layout.tsx          Root layout con metadata SEO
│   │   ├── opengraph-image.tsx OG image dinámica (1200x630)
│   │   └── page.tsx            Landing pública
│   ├── lib/
│   │   ├── anthropic/          Cliente Claude + detect
│   │   ├── openai/             Cliente OpenAI + transcribe
│   │   ├── supabase/           Server + browser clients
│   │   ├── usage/              Counter atómico (try_increment_usage)
│   │   ├── types/              TypeScript types compartidos
│   │   └── logger.ts           Logger estructurado
│   └── middleware.ts           Supabase session refresh
├── vercel.json                 Regions, maxDuration, cron schedule
└── next.config.ts              Security headers (HSTS, X-Frame-Options, etc)
```

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar .env.local.example a .env.local y rellenar las keys
cp .env.local.example .env.local

# 3. Correr SQL en Supabase (en orden):
#    - scripts/sql/01-schema.sql
#    - scripts/sql/02-counter-rpcs.sql
#    - scripts/sql/03-improvements.sql

# 4. Build el knowledge base
npx tsx scripts/kb/build.ts

# 5. Dev server
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## API endpoints

| Método | Path | Descripción |
|---|---|---|
| POST | `/api/process` | Audio → transcript + auto-detect contexto. Counter check atómico. |
| GET | `/auth/callback` | OAuth Google callback handler. |
| GET | `/api/cron/cleanup-audios` | Cron diario (3am UTC) — limpia audios huérfanos. Protegido por `CRON_SECRET`. |

Próximos endpoints (Día 4):
- `POST /api/generate-notes` — Claude Sonnet 4.6 + KB cacheado → apunte completo
- `POST /api/tts` — Audio del apunte vía OpenAI TTS
- `GET/PUT /api/profile` — CRUD del perfil del usuario

## Compliance

- ✅ **Ley de Protección de Datos Personales SV** (Nov 2024): consent explícito, derecho a borrar datos, audio se borra en 1h
- ✅ **HTTPS forzado** (HSTS preload del TLD `.app`)
- ✅ **RLS Postgres** — cada user solo accede a sus propios datos
- ✅ **Counter atómico** — sin race conditions
- ✅ **Audio TTL real** — borrado inmediato post-transcripción + cron backup

## Equipo

- **Milton** — Lead técnico
- **Isa** — Coordinación CBE + legales
- **Mariana** — Validación + Instagram/TikTok
- **Xime** — Pitch deck visual + testimonios

## Licencia

Privado. Todos los derechos reservados.
