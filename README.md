# YouTube Watch

Monitor de canal de YouTube + calendario de contenido. Login con Google, métricas del canal (suscriptores, vistas, videos) y un to-do list/calendario para organizar publicaciones.

Stack: Next.js + TypeScript · Cloudflare D1 · Better Auth (Google OAuth) · YouTube Data API v3 · Deploy en Cloudflare Workers via OpenNext.

## Setup local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear credenciales en [Google Cloud Console](https://console.cloud.google.com/):
   - Habilitar **YouTube Data API v3**.
   - Crear **OAuth client ID** (tipo "Web application") con redirect URI `http://localhost:3000/api/auth/callback/google`.

3. Copiar `.dev.vars.example` a `.env.local` y a `.dev.vars`, y completar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `BETTER_AUTH_SECRET` (string aleatorio largo).

4. Aplicar el schema a la D1 local y arrancar:

   ```bash
   npm run db:migrate:local
   npm run dev
   ```

## Deploy (Cloudflare Workers)

```bash
wrangler login
wrangler d1 create youtube-watch-db   # copiar database_id a wrangler.jsonc
npm run db:migrate:prod
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL   # https://<worker>.workers.dev
npm run deploy
```

Después agregar `https://<worker>.workers.dev/api/auth/callback/google` como redirect URI autorizado en Google Cloud Console.

Más detalle en `CLAUDE.md` y `PLAN.md`.
