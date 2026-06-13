# API — Endpoints

Todos los endpoints viven en `app/api/`. Auth verificada con `lib/session.ts` (`getSession`) salvo `/api/youtube/sync` que usa `auth.api.getSession` directamente para poder llamar `auth.api.getAccessToken` después.

**Respuesta de error común**

```json
{ "error": "Mensaje descriptivo" }
```

---

## `GET /api/channel`

Retorna las métricas del canal del usuario autenticado.

| Campo | Detalle |
|-------|---------|
| Auth | Requerida (sesión de Better Auth) |
| Body | — |

**Response 200**

```json
{
  "channel": {
    "id": "uuid",
    "user_id": "uuid",
    "channel_id": "UCxxxxxx",
    "channel_name": "Mi Canal",
    "thumbnail_url": "https://...",
    "subscribers": 1200,
    "total_views": 450000,
    "video_count": 34,
    "last_synced_at": "2026-06-12T10:00:00.000Z"
  }
}
```

> `channel` es `null` si el usuario aún no ha sincronizado su canal.

**Errores**

| Status | Razón |
|--------|-------|
| 401 | Sin sesión activa |

---

## `POST /api/youtube/sync`

Llama a YouTube Data API v3, obtiene métricas del canal propio del usuario e inserta o actualiza la fila en `channels`.

| Campo | Detalle |
|-------|---------|
| Auth | Requerida |
| Body | — |
| Costo YouTube API | ~3 unidades (part=snippet,statistics) |

**Response 200**

```json
{
  "channel": {
    "channel_id": "UCxxxxxx",
    "channel_name": "Mi Canal",
    "thumbnail_url": "https://...",
    "subscribers": 1200,
    "total_views": 450000,
    "video_count": 34,
    "last_synced_at": "2026-06-12T10:00:00.000Z"
  }
}
```

**Errores**

| Status | Razón |
|--------|-------|
| 400 | No hay cuenta de Google vinculada / token no disponible |
| 401 | Sin sesión activa |
| 404 | La cuenta de Google no tiene canal de YouTube |
| 502 | YouTube API respondió con error (se incluye `detail` con el texto crudo) |

---

## `GET /api/tasks`

Retorna todas las tareas del usuario. Ordenadas: primero las que tienen `due_date` (ASC), luego las sin fecha (DESC por `created_at`).

| Campo | Detalle |
|-------|---------|
| Auth | Requerida |
| Query params | — (sin filtros por ahora) |

**Response 200**

```json
{
  "tasks": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Grabar intro",
      "description": "Con cámara nueva",
      "due_date": "2026-06-20",
      "status": "pending",
      "type": "video",
      "created_at": "2026-06-12T08:00:00"
    }
  ]
}
```

**Errores**

| Status | Razón |
|--------|-------|
| 401 | Sin sesión activa |

---

## `POST /api/tasks`

Crea una nueva tarea.

| Campo | Detalle |
|-------|---------|
| Auth | Requerida |
| Content-Type | `application/json` |

**Request body**

```json
{
  "title": "Grabar intro",          // requerido, string no vacío
  "description": "Con cámara nueva", // opcional
  "due_date": "2026-06-20",          // opcional, ISO 8601 YYYY-MM-DD
  "status": "pending",               // opcional: pending | in_progress | done (default: pending)
  "type": "video"                    // opcional: video | short | live | community_post | otro
}
```

**Response 201**

```json
{
  "task": { /* objeto Task completo */ }
}
```

**Errores**

| Status | Razón |
|--------|-------|
| 400 | `title` vacío, `type` inválido, o `status` inválido |
| 401 | Sin sesión activa |

---

## `PATCH /api/tasks/[id]`

Actualiza campos de una tarea existente. Solo actualiza los campos presentes en el body.

| Campo | Detalle |
|-------|---------|
| Auth | Requerida |
| Content-Type | `application/json` |

**Request body** (todos opcionales, al menos uno requerido)

```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "due_date": "2026-07-01",
  "status": "in_progress",
  "type": "short"
}
```

**Response 200**

```json
{
  "task": { /* objeto Task actualizado */ }
}
```

**Errores**

| Status | Razón |
|--------|-------|
| 400 | `title` vacío, `type` inválido, `status` inválido, o body sin campos válidos |
| 401 | Sin sesión activa |
| 404 | Tarea no encontrada o no pertenece al usuario |

---

## `DELETE /api/tasks/[id]`

Elimina una tarea del usuario.

| Campo | Detalle |
|-------|---------|
| Auth | Requerida |
| Body | — |

**Response 200**

```json
{ "ok": true }
```

**Errores**

| Status | Razón |
|--------|-------|
| 401 | Sin sesión activa |
| 404 | Tarea no encontrada o no pertenece al usuario |

---

## `ALL /api/auth/[...all]`

Manejado completamente por Better Auth (`lib/auth.ts`). Incluye los endpoints internos de OAuth (callback de Google, creación/invalidación de sesión, etc.). No documentar internos — ver [Better Auth docs](https://www.better-auth.com/).
