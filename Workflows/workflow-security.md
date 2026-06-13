# Workflow — Seguridad

**Propósito**: analizar los cambios recientes desde seguridad y registrar hallazgos en `Docs/security.md` — **el doc no existe todavía; el Paso 3 lo crea la primera vez**.

## Paso 1 — Ver qué cambió

```bash
git diff HEAD~1
git status   # cambios sin commitear
```

Atención especial a estos puntos de entrada:
- API routes en `app/api/` (`tasks`, `tasks/[id]`, `channel`, `youtube/sync`, `auth/[...all]`)
- Queries D1 (`db.prepare(...).bind(...)`)
- Sesión/auth: `lib/session.ts`, `lib/auth.ts`, `lib/auth-client.ts`
- Datos devueltos al cliente desde server components (`app/(app)/*/page.tsx`) y endpoints
- `schema.sql`, `wrangler.jsonc`, env vars

## Paso 2 — Checklist por tipo de cambio

**Nuevos endpoints / API routes**
- ¿Llama a `getSession()` de `lib/session.ts` y devuelve 401 si no hay sesión? (patrón de `app/api/tasks/route.ts`)
- ¿Las mutaciones van por POST/PATCH/DELETE, nunca por GET?
- ¿Valida el body contra listas blancas como `TYPES`/`STATUSES` cuando aplica?

**Queries a D1**
- ¿Parametrizadas con `.prepare().bind()` — nunca interpolación de strings en el SQL?
- ¿Toda query incluye `WHERE user_id = ?` con `session.user.id`? (D1 no tiene RLS; este filtro ES el aislamiento de datos)
- En endpoints con `[id]`: ¿el WHERE combina `id = ? AND user_id = ?` para que un usuario no toque registros ajenos?

**Datos devueltos al cliente**
- ¿Se filtra info sensible? Nunca exponer `accessToken`/`refreshToken` de la tabla `account`, ni `env.DB`, ni respuestas crudas de la YouTube API con datos de otros usuarios.
- ¿Los server components solo pasan al cliente los campos que la UI necesita?

**Auth / sesiones / tokens OAuth**
- ¿Cambió la lógica de `lib/auth.ts` (Better Auth, scopes de Google)? ¿Se agregaron scopes innecesarios?
- ¿El refresh de tokens sigue pasando por `auth.api.getAccessToken()` (nunca manejar el refresh token a mano)?
- ¿`BETTER_AUTH_SECRET` y `GOOGLE_CLIENT_SECRET` siguen solo en `.env.local`/`.dev.vars`/`wrangler secret` y fuera de git?

**Inputs del usuario**
- ¿Validación de longitud/tipo en `title`, `description`, `due_date` de tasks?
- ¿Lo que se renderiza viene de JSX (escapado automático)? Prohibido `dangerouslySetInnerHTML` con datos del usuario.

**YouTube API / cuota**
- ¿Un endpoint nuevo permite a un usuario disparar syncs sin control? (la cuota de 10.000 unidades/día es compartida — un abuso la agota para todos). ¿Se respeta `last_synced_at`?

> No hay uploads de archivos en este proyecto; si un cambio los introduce, agregar aquí la categoría (magic bytes, límite de tamaño, URLs privadas).

## Paso 3 — Registrar en `Docs/security.md`

Si no existe, crearlo con estas secciones: **Mecanismos de seguridad** (auth, aislamiento por user_id, manejo de tokens), **Superficies de ataque**, **Vectores posibles** (aunque no sean vulnerabilidades confirmadas), **Checklist pre-producción**.

Registrar del cambio analizado: mecanismos nuevos, superficies que introduce, vectores posibles, y cambios al checklist pre-producción si aplica.

## Paso 4 — Reportar

Resumir en el chat solo qué se registró y el hallazgo principal (si lo hubo).
