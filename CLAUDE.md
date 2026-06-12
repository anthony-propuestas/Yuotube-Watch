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
| Deploy | Cloudflare Pages |

## Comandos

```bash
npm run dev          # desarrollo local
npm run build        # build
npx @cloudflare/next-on-pages   # build para Cloudflare Pages

# Migraciones D1
wrangler d1 execute youtube-watch-db --file=schema.sql          # producción
wrangler d1 execute youtube-watch-db --local --file=schema.sql  # local

wrangler login       # autenticarse en Cloudflare
wrangler d1 create youtube-watch-db  # crear base de datos D1
```

## Restricciones críticas

**Edge runtime (Cloudflare)**: Las API routes usan Cloudflare Workers, no Node.js estándar. No usar módulos nativos de Node.js (`fs`, `path`, etc.). El adaptador `@cloudflare/next-on-pages` transpila el código.

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

Better Auth crea automáticamente `users`, `sessions` y `accounts`. Solo crear:

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
- Los tokens OAuth se guardan en la tabla `accounts` de Better Auth (`access_token`, `refresh_token`). Better Auth refresca automáticamente el token expirado.

## Variables de entorno

```env
# Google OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Better Auth
BETTER_AUTH_SECRET=

# Cloudflare (en wrangler.toml o Cloudflare Pages dashboard)
# DB binding se configura en wrangler.toml, no como env var
```

### wrangler.toml (esquema base)

```toml
name = "youtube-watch"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "youtube-watch-db"
database_id = "TU_DATABASE_ID"
```
