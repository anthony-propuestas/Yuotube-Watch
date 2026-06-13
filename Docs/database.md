# Base de datos

Motor: **Cloudflare D1** (SQLite). El schema completo vive en `schema.sql` — es la fuente de verdad.

## Relaciones

```
user ──< session      (userId FK)
user ──< account      (userId FK)
user ──< channels     (user_id FK)
user ──< tasks        (user_id FK)
```

## Tablas de Better Auth

Gestionadas por Better Auth. **Nombres singulares, columnas camelCase** (convención de Better Auth para SQLite).

### `user`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | UUID |
| name | TEXT NOT NULL | Nombre de Google |
| email | TEXT NOT NULL UNIQUE | Email de Google |
| emailVerified | INTEGER NOT NULL | 0/1 (SQLite boolean) |
| image | TEXT | URL avatar Google |
| createdAt | DATE NOT NULL | |
| updatedAt | DATE NOT NULL | |

### `session`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | |
| expiresAt | DATE NOT NULL | |
| token | TEXT NOT NULL UNIQUE | Cookie de sesión |
| createdAt | DATE NOT NULL | |
| updatedAt | DATE NOT NULL | |
| ipAddress | TEXT | |
| userAgent | TEXT | |
| userId | TEXT NOT NULL | FK → user.id |

### `account`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | |
| accountId | TEXT NOT NULL | ID de cuenta en el proveedor |
| providerId | TEXT NOT NULL | `"google"` |
| userId | TEXT NOT NULL | FK → user.id |
| accessToken | TEXT | Token OAuth de Google |
| refreshToken | TEXT | Refresh token de Google |
| idToken | TEXT | JWT de Google |
| accessTokenExpiresAt | DATE | |
| refreshTokenExpiresAt | DATE | |
| scope | TEXT | Scopes concedidos |
| password | TEXT | — (no se usa con OAuth) |
| createdAt | DATE NOT NULL | |
| updatedAt | DATE NOT NULL | |

> `accessToken` y `refreshToken` son sensibles. Nunca devolverlos en responses de API.

### `verification`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | |
| identifier | TEXT NOT NULL | |
| value | TEXT NOT NULL | |
| expiresAt | DATE NOT NULL | |
| createdAt | DATE | |
| updatedAt | DATE | |

---

## Tablas del negocio

### `channels`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| user_id | TEXT NOT NULL | FK → user.id |
| channel_id | TEXT NOT NULL | ID del canal en YouTube (ej: `UCxxxxxxx`) |
| channel_name | TEXT | Nombre del canal |
| thumbnail_url | TEXT | URL de la miniatura del avatar |
| subscribers | INTEGER | Número de suscriptores |
| total_views | INTEGER | Vistas totales acumuladas |
| video_count | INTEGER | Total de videos públicos |
| last_synced_at | TEXT | ISO 8601 — controla cuándo hacer el próximo sync |

Índice: `idx_channels_user ON channels(user_id)`

> Un usuario puede tener un solo canal registrado por ahora. El endpoint `GET /api/channel` hace `LIMIT 1`.

### `tasks`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| user_id | TEXT NOT NULL | FK → user.id |
| title | TEXT NOT NULL | |
| description | TEXT | Nullable |
| due_date | TEXT | ISO 8601 YYYY-MM-DD, nullable |
| status | TEXT | `pending` \| `in_progress` \| `done` (default: `pending`) |
| type | TEXT | `video` \| `short` \| `live` \| `community_post` \| `otro`, nullable |
| created_at | TEXT | `datetime('now')` por defecto |

Índice: `idx_tasks_user ON tasks(user_id)`

---

## Reglas de D1 (SQLite en Workers)

| Regla | Detalle |
|-------|---------|
| Usar `TEXT` no `VARCHAR` | D1/SQLite ignora el largo en VARCHAR; TEXT es explícito |
| UUIDs en código | `crypto.randomUUID()` — D1 no tiene `uuid_generate_v4()` |
| Booleans como INTEGER | SQLite no tiene tipo BOOLEAN nativo |
| Queries parametrizadas | Siempre `.bind(valor)`, nunca interpolación de strings |
| Acceso via binding | `env.DB` obtenido de `getCloudflareContext()` en `lib/db.ts` |

---

## Migraciones

`schema.sql` contiene todos los `CREATE TABLE IF NOT EXISTS`. Para aplicar:

```bash
npm run db:migrate:local   # D1 local en .wrangler/
npm run db:migrate:prod    # D1 remota en Cloudflare
```

No hay sistema de versiones por ahora: si se modifica una tabla existente, crear la sentencia `ALTER TABLE` correspondiente manualmente y agregarla al final de `schema.sql`.
