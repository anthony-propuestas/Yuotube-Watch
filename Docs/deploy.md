# Deploy

## Entornos

| Entorno | Comando | Runtime | D1 |
|---------|---------|---------|-----|
| Desarrollo local | `npm run dev` | Node.js (next dev) | D1 local (`.wrangler/`) |
| Preview local | `npm run preview` | workerd (Workers real) | D1 local (`.wrangler/`) |
| Producción | `npm run deploy` | Cloudflare Workers | D1 remota |

---

## Desarrollo local

```bash
npm run dev
```

Usa `next dev` con `initOpenNextCloudflareForDev()` (en `next.config.ts`). Esto hace que los bindings D1 funcionen en local apuntando a la base SQLite en `.wrangler/state/`. El hot reload funciona normalmente.

**Variables de entorno locales**: `.env.local` (leídas por Next.js).

---

## Preview local (Workers real)

```bash
npm run preview
```

1. Hace build de OpenNext (`opennextjs-cloudflare build`)
2. Lanza el Worker en `workerd` local (mismo runtime que producción)
3. No hay hot reload — requiere re-correr el comando tras cambios

**Variables de entorno**: `.dev.vars` (leídas por wrangler). Mismas claves que `.env.local`.

Usar preview para validar comportamiento real de Workers antes de hacer deploy.

---

## Producción — primer setup

### 1. Autenticarse en Cloudflare

```bash
wrangler login
```

### 2. Crear la base D1

```bash
wrangler d1 create youtube-watch-db
```

Copiar el `database_id` devuelto y pegarlo en `wrangler.jsonc`:

```jsonc
"d1_databases": [{
  "binding": "DB",
  "database_name": "youtube-watch-db",
  "database_id": "<pegar aquí>"
}]
```

### 3. Aplicar schema a producción

```bash
npm run db:migrate:prod
```

### 4. Configurar secrets

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL   # URL del Worker en producción
```

> `BETTER_AUTH_URL` debe ser la URL pública del Worker (ej: `https://youtube-watch.mi-usuario.workers.dev`).

### 5. Deploy

```bash
npm run deploy
```

Esto ejecuta `opennextjs-cloudflare build && wrangler deploy`. El Worker queda activo en la URL de Cloudflare.

---

## Producción — deploys subsiguientes

```bash
npm run deploy
```

Si el schema cambió:

```bash
npm run db:migrate:prod
npm run deploy
```

---

## Variables de entorno

| Variable | Dónde configurar (dev) | Dónde configurar (prod) |
|----------|------------------------|-------------------------|
| `GOOGLE_CLIENT_ID` | `.env.local` / `.dev.vars` | `wrangler secret put` |
| `GOOGLE_CLIENT_SECRET` | `.env.local` / `.dev.vars` | `wrangler secret put` |
| `BETTER_AUTH_SECRET` | `.env.local` / `.dev.vars` | `wrangler secret put` |
| `BETTER_AUTH_URL` | `.env.local` / `.dev.vars` | `wrangler secret put` |
| D1 (`DB`) | `wrangler.jsonc` binding | `wrangler.jsonc` binding |

`.env.local` es para `npm run dev`. `.dev.vars` es para `npm run preview`. En producción solo existen los secrets de wrangler.

---

## `npm run cf-typegen`

Regenera `cloudflare-env.d.ts` con los tipos TypeScript de los bindings declarados en `wrangler.jsonc`. Correr tras cualquier cambio en `wrangler.jsonc` (nuevo binding, nuevo KV, etc.).

---

## Google Cloud Console — configuración OAuth

Para que el login con Google funcione en producción, agregar la URL del Worker en:
- **Orígenes de JavaScript autorizados**: `https://youtube-watch.mi-usuario.workers.dev`
- **URIs de redireccionamiento autorizados**: `https://youtube-watch.mi-usuario.workers.dev/api/auth/callback/google`
