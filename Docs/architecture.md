# Arquitectura del sistema

## Visión general

```
Browser
  │
  ├── Next.js App Router (Edge / Cloudflare Workers)
  │     ├── app/(app)/          ← páginas protegidas (React Server Components + Client)
  │     ├── app/api/            ← API routes (handlers de Workers)
  │     └── components/         ← UI React
  │
  ├── lib/
  │     ├── auth.ts             ← instancia de Better Auth (se crea por request)
  │     ├── session.ts          ← helper: getSession() con headers de Next.js
  │     ├── db.ts               ← conexión a D1 via getCloudflareContext
  │     └── types.ts            ← tipos TypeScript (Task, Channel)
  │
  ├── Cloudflare D1 (SQLite)    ← única fuente de verdad de datos
  └── YouTube Data API v3       ← solo en POST /api/youtube/sync
```

## Capas y responsabilidades

### `app/` — Páginas y rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `app/page.tsx` | RSC | Landing page pública |
| `app/(app)/dashboard/page.tsx` | RSC | Muestra métricas del canal |
| `app/(app)/calendar/page.tsx` | RSC | Vista calendario mensual de tareas |
| `app/(app)/tasks/page.tsx` | RSC | Vista lista to-do de tareas |
| `app/(app)/layout.tsx` | RSC | Layout con navbar; redirige a `/` si no hay sesión |
| `app/api/*/route.ts` | Workers handler | API REST, siempre verifican sesión antes de tocar D1 |

### `components/` — UI

Componentes Client (`"use client"`) que reciben datos de las páginas RSC y manejan interacciones:

| Componente | Función |
|------------|---------|
| `dashboard-view.tsx` | Muestra métricas del canal + botón sync |
| `calendar-view.tsx` | Grid mensual con tareas |
| `tasks-view.tsx` | Lista de tareas con filtros y acciones |
| `task-modal.tsx` | Modal para crear/editar tareas |
| `navbar.tsx` | Navegación + avatar de usuario |
| `sign-in-button.tsx` | Botón OAuth de Google |

### `lib/` — Utilidades del servidor

| Archivo | Función |
|---------|---------|
| `auth.ts` | Instancia Better Auth con D1 como DB y Google como proveedor OAuth. Se instancia por request (no en módulo global) porque `getCloudflareContext` solo está disponible dentro de un request. |
| `session.ts` | Wrapper de `auth.api.getSession` que ya inyecta los headers de Next.js. Todos los API routes lo usan. |
| `db.ts` | Accede a `env.DB` (binding D1) via `getCloudflareContext({ async: true })` y retorna el cliente Kysely. |
| `types.ts` | Tipos `Task`, `Channel`, `TaskStatus`, `TaskType`. |
| `labels.ts` | Constantes de UI: etiquetas y colores por tipo/estado. |

## Flujo de una request autenticada

```
1. Browser → POST /api/tasks
2. Workers handler recibe la request
3. getSession() → auth.api.getSession() → busca cookie de sesión en headers → D1 session table
4. Si no hay sesión: return 401
5. getDb() → getCloudflareContext() → env.DB → cliente Kysely
6. Query D1 con WHERE user_id = session.user.id (nunca sin este filtro)
7. return Response.json(resultado)
```

## Patrón de seguridad de datos

Todas las queries de negocio filtran por `user_id`:

```ts
// Ejemplo canónico (tasks route)
const session = await getSession();
if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

db.prepare("SELECT * FROM tasks WHERE user_id = ?").bind(session.user.id)
```

D1 no tiene Row Level Security, por lo que este filtro es la única barrera entre los datos de distintos usuarios. Nunca hacer queries sin `WHERE user_id = ?`.

## Cómo OpenNext adapta Next.js a Workers

`@opennextjs/cloudflare` compila la app Next.js y genera un Worker en `.open-next/worker.js`. Este Worker:
- Sirve los assets estáticos via binding `ASSETS`
- Ejecuta los API routes y Server Components en el runtime de Workers (Edge, no Node.js)
- Expone los bindings de Cloudflare (`env.DB`, `env.ASSETS`) via `getCloudflareContext`

Por esto no se puede usar `fs`, `path`, ni APIs de Node.js puras — el runtime es Workers con `nodejs_compat`, no Node.js completo.
