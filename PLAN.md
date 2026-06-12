# Plan: YouTube Channel Monitor + Content Calendar

> **Actualización (junio 2026)**: `@cloudflare/next-on-pages` quedó deprecado. La implementación usa **`@opennextjs/cloudflare` (OpenNext) + Cloudflare Workers** en lugar de Pages. El deploy es `npm run deploy` (no requiere conectar GitHub a Pages). La configuración vive en `wrangler.jsonc`. Ver CLAUDE.md para los comandos reales.

---

## Vision general

Una web donde creadores de YouTube se loguean, conectan su canal, ven sus métricas clave y organizan su contenido en un calendario tipo to-do list.

---

## Stack recomendado

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | Next.js (React) | Full-stack en un repo, SSR para SEO |
| Base de datos | Cloudflare D1 (SQLite) | Distribuido, integrado con Workers, gratis hasta 5 GB |
| Auth | Better Auth + Google OAuth | Librería moderna con adaptador nativo para D1, maneja Google OAuth |
| API YouTube | YouTube Data API v3 | Oficial, gratuita hasta 10k unidades/día |
| Deploy | Cloudflare Pages | CDN global, free tier generoso, integración con D1 y Workers |

> **Por qué Google OAuth**: Como YouTube es de Google, el mismo login sirve para pedir permisos al canal del usuario. Un solo flujo, sin pasos extra.

> **Nota importante**: Cloudflare usa **edge runtime** (no Node.js estándar). El adaptador `@cloudflare/next-on-pages` transpila el código para que funcione en Cloudflare Pages. Esto restringe el uso de módulos de Node.js nativos en las API routes.

---

## Paso 1 — Configurar el proyecto base

1. Crear proyecto en Next.js con TypeScript.
2. Instalar **Wrangler CLI** — herramienta oficial de Cloudflare:
   ```
   npm i -g wrangler
   ```
3. Autenticarse en Cloudflare: `wrangler login`
4. Crear la base de datos D1: `wrangler d1 create youtube-watch-db`
5. Crear archivo `wrangler.toml` en la raíz del proyecto con el binding a D1.
6. Instalar el adaptador de Cloudflare para Next.js: `@cloudflare/next-on-pages`
7. Conectar Cloudflare Pages al repositorio de GitHub para deploy automático.
8. Configurar variables de entorno en el Cloudflare Pages dashboard: credenciales de Google OAuth, secretos de sesión, etc.

**Resultado**: App vacía que despliega correctamente en Cloudflare Pages con acceso a D1.

---

## Paso 2 — Autenticación con Google OAuth

1. Crear una aplicación en Google Cloud Console.
2. Activar las APIs necesarias: **YouTube Data API v3** y **OAuth 2.0**.
3. Instalar Better Auth: `npm install better-auth`
4. Configurar Better Auth con:
   - El **adaptador D1** de Cloudflare (usa el binding `env.DB`).
   - El **provider de Google** con el scope `youtube.readonly` para autorizar el canal en el mismo paso del login.
5. Better Auth crea automáticamente las tablas `users`, `sessions` y `accounts` en D1.
6. Los tokens de YouTube (`access_token` y `refresh_token`) se guardan en la tabla `accounts` vinculados al usuario.

**Resultado**: El usuario hace click en "Continuar con Google", autoriza su canal, y queda logueado con acceso a sus datos de YouTube.

---

## Paso 3 — Diseñar la base de datos

Better Auth gestiona las tablas de usuarios, sesiones y cuentas. Solo hay que crear las tablas propias del negocio.

Las migraciones se ejecutan con Wrangler:
```
wrangler d1 execute youtube-watch-db --file=schema.sql
```

> **D1 es SQLite**: usar `TEXT` en lugar de `VARCHAR`, y generar UUIDs en código (ej. `crypto.randomUUID()`) ya que SQLite no tiene `uuid_generate_v4()`.

**`channels`**
- `id` (TEXT, UUID), `user_id` (TEXT, FK a users), `channel_id` (ID de YouTube)
- `channel_name`, `thumbnail_url`
- `subscribers`, `total_views`, `video_count` (INTEGER)
- `last_synced_at` (TEXT, formato ISO 8601)

**`tasks`** (el calendario/to-do)
- `id` (TEXT, UUID), `user_id` (TEXT, FK a users)
- `title`, `description`
- `due_date` (TEXT, formato ISO 8601)
- `status` — `pending` / `in_progress` / `done`
- `type` — `video`, `short`, `live`, `community_post`, `otro`
- `created_at`

---

## Paso 4 — Sincronización con YouTube

1. Crear un endpoint en el backend (`/api/youtube/sync`) que:
   - Use el token del usuario guardado en la tabla `accounts` de Better Auth.
   - Llame a la YouTube Data API para traer: suscriptores, vistas totales, cantidad de videos.
   - Actualice la tabla `channels` usando el binding `env.DB` de D1.
2. Este endpoint se llama cuando el usuario entra al dashboard.
3. Si el `access_token` expiró, Better Auth gestiona automáticamente el refresco con el `refresh_token`.

**Datos que trae la API (gratis)**:
- Suscriptores
- Vistas totales del canal
- Cantidad de videos publicados
- Nombre y foto del canal

---

## Paso 5 — Dashboard de métricas

Página principal después del login. Muestra:

- Tarjeta con foto, nombre del canal y fecha de última sincronización.
- 3 métricas grandes: **Suscriptores**, **Vistas totales**, **Videos publicados**.
- Botón "Actualizar datos" para forzar una nueva sincronización con YouTube.
- (Opcional futuro) Gráfica de evolución si se guardan snapshots históricos.

---

## Paso 6 — Calendario / To-Do List

La sección más importante del producto. Dos vistas:

### Vista Lista (To-Do)
- Tareas agrupadas por estado: Pendiente / En progreso / Hecho.
- Cada tarea muestra: título, tipo (video, short, live…), fecha límite.
- Acciones: crear, editar, marcar como hecha, eliminar.

### Vista Calendario
- Calendario mensual donde cada día muestra las tareas con `due_date` en esa fecha.
- Click en un día abre un modal para crear tarea nueva en esa fecha.
- Click en una tarea existente la abre para editar.

### Formulario de tarea
- Título (obligatorio)
- Tipo: Video / Short / Live / Community Post / Otro
- Fecha límite (selector de fecha, vincula con el calendario)
- Descripción opcional
- Estado inicial: Pendiente

---

## Paso 7 — Navegación y estructura de la app

```
/                  → Landing page con botón "Entrar con Google"
/dashboard         → Métricas del canal (requiere login)
/calendar          → Vista calendario (requiere login)
/tasks             → Vista lista to-do (requiere login)
```

Sidebar o navbar con las 3 secciones principales.

---

## Paso 8 — Deploy con Cloudflare Pages

1. Subir el proyecto a GitHub.
2. En **Cloudflare Dashboard → Pages** → conectar el repositorio de GitHub.
3. Configurar el build:
   - Build command: `npx @cloudflare/next-on-pages`
   - Output directory: `.vercel/output/static`
4. Agregar las variables de entorno en Cloudflare Pages (Google Client ID, Google Client Secret, secreto de sesión de Better Auth, etc.).
5. Vincular el binding de D1 en la configuración de Pages → Workers & Bindings.
6. En Google Cloud Console, agregar el dominio de Cloudflare Pages como URI autorizado de OAuth.
7. Probar el flujo completo: login → sincronización → crear tarea → calendario.

---

## Consideraciones importantes

### Límites de la YouTube Data API (gratis)
- 10.000 unidades por día por proyecto.
- Traer datos básicos del canal cuesta ~3 unidades por llamada.
- Con este límite se pueden sincronizar ~3.000 usuarios por día.
- Solución: no sincronizar en cada visita, solo cuando el usuario lo pida o cada X horas.

### Seguridad de datos (sin RLS nativo)
- D1 no tiene Row Level Security como Supabase. La seguridad se implementa en código.
- Todas las queries deben incluir `WHERE user_id = ?` usando el ID de la sesión activa, obtenido desde Better Auth.
- Nunca exponer el binding `env.DB` ni los tokens al frontend.

### Múltiples canales (futuro)
- El diseño de la tabla `channels` ya soporta varios canales por usuario.
- En v1 se puede limitar a 1 canal por usuario para simplificar.

---

## Orden de desarrollo sugerido

1. [x] Setup proyecto (Next.js + Wrangler + Cloudflare D1 + `@opennextjs/cloudflare`)
2. [x] Login con Google OAuth via Better Auth + guardar token de YouTube *(falta crear credenciales en Google Cloud Console)*
3. [x] Endpoint de sincronización de métricas (YouTube API → D1)
4. [x] Dashboard con métricas
5. [x] CRUD de tareas (lista)
6. [x] Vista calendario
7. [x] Pulir UI / responsive
8. [ ] Deploy a Cloudflare Workers (`wrangler login` + `wrangler d1 create` + `npm run deploy`)
