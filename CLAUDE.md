# YouTube Watch — CLAUDE.md

## Descripción

YouTube Channel Monitor + Content Calendar. Los creadores se loguean con Google, conectan su canal y ven métricas clave. También organizan su contenido en un calendario/to-do list.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend/Backend | Next.js + TypeScript |
| Base de datos | Cloudflare D1 (SQLite) |
| Auth | Better Auth + Google OAuth 2.0 |
| API externa | YouTube Data API v3 |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext) |

> `@cloudflare/next-on-pages` está deprecado. Este proyecto usa OpenNext + Workers.

## Comandos

```bash
npm run dev            # desarrollo local (next dev, con bindings D1 locales via initOpenNextCloudflareForDev)
npm run build          # build de Next.js
npm run preview        # build OpenNext + preview local en workerd
npm run deploy         # build OpenNext + deploy a Cloudflare Workers
npm run cf-typegen     # regenerar cloudflare-env.d.ts tras cambiar wrangler.jsonc

# Migraciones D1
npm run db:migrate:local   # aplica schema.sql a la D1 local (.wrangler/)
npm run db:migrate:prod    # aplica schema.sql a la D1 remota

wrangler login       # autenticarse en Cloudflare
wrangler d1 create youtube-watch-db  # crear base de datos D1 (copiar database_id a wrangler.jsonc)
```

## Restricciones críticas

**Runtime Workers (Cloudflare)**: El código corre en Cloudflare Workers con el flag `nodejs_compat`. El binding D1 y demás `env` se obtienen con `getCloudflareContext({ async: true })` de `@opennextjs/cloudflare` (ver `lib/db.ts` y `lib/auth.ts`) — nunca importar `fs`/`path` ni asumir Node completo.

**D1 es SQLite**:
- Usar `TEXT` en lugar de `VARCHAR`
- Generar UUIDs en código: `crypto.randomUUID()` (no `uuid_generate_v4()`)
- El binding de D1 se accede via `env.DB` en los Workers/API routes

**Seguridad sin RLS**:
- D1 no tiene Row Level Security nativo
- Toda query DEBE incluir `WHERE user_id = ?` usando el ID de sesión de Better Auth
- Nunca exponer `env.DB` ni tokens de YouTube al cliente

## Rutas

```
/            → Landing page con botón "Entrar con Google"
/dashboard   → Métricas del canal (requiere auth)
/calendar    → Vista calendario mensual (requiere auth)
/tasks       → Vista lista to-do (requiere auth)
```

## Base de datos

El schema completo está en `schema.sql` (incluye las tablas de Better Auth: `user`, `session`, `account`, `verification` — **singulares**, columnas camelCase). Las tablas del negocio:

```sql
-- channels: métricas del canal de YouTube
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  thumbnail_url TEXT,
  subscribers INTEGER,
  total_views INTEGER,
  video_count INTEGER,
  last_synced_at TEXT  -- ISO 8601
);

-- tasks: calendario/to-do
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,  -- ISO 8601
  status TEXT DEFAULT 'pending',  -- pending | in_progress | done
  type TEXT,  -- video | short | live | community_post | otro
  created_at TEXT DEFAULT (datetime('now'))
);
```

## YouTube Data API

- **Límite**: 10.000 unidades/día por proyecto de Google Cloud
- **Costo**: ~3 unidades por sync de métricas básicas (~3.000 syncs/día máximo)
- **Estrategia**: No sincronizar en cada visita. Solo cuando el usuario lo pide o cada X horas. Usar `last_synced_at` para controlar frecuencia.
- Los tokens OAuth se guardan en la tabla `account` de Better Auth (`accessToken`, `refreshToken`). `auth.api.getAccessToken()` refresca automáticamente el token expirado (ver `app/api/youtube/sync/route.ts`).

## Variables de entorno

Locales: `.env.local` (para `next dev`) y `.dev.vars` (para `wrangler`/preview), mismas claves. En producción: `wrangler secret put <NOMBRE>`.

```env
GOOGLE_CLIENT_ID=        # Google Cloud Console
GOOGLE_CLIENT_SECRET=
BETTER_AUTH_SECRET=      # cualquier string aleatorio largo
BETTER_AUTH_URL=         # http://localhost:3000 en dev, URL del Worker en prod
```

El binding D1 se configura en `wrangler.jsonc` (`d1_databases` → binding `DB`), no como env var.
