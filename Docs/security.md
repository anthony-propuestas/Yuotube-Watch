# Seguridad

## Mecanismos de seguridad

### Autenticación
Better Auth gestiona el flujo OAuth 2.0 con Google. Cada request a una ruta protegida llama a `getSession()` en `lib/session.ts`, que delega a `auth.api.getSession({ headers })`. Si no hay sesión válida, el endpoint devuelve 401 antes de tocar la base de datos.

### Aislamiento de datos por user_id
D1 no tiene Row Level Security nativo. El aislamiento se implementa manualmente: **toda query incluye `WHERE user_id = ?`** con `session.user.id`. Los endpoints con `[id]` combinan `WHERE id = ? AND user_id = ?` para impedir que un usuario acceda o modifique registros de otro.

### Manejo de tokens OAuth
Los tokens de Google (`accessToken`, `refreshToken`) se guardan en la tabla `account` de Better Auth. El refresh es automático via `auth.api.getAccessToken()` — el código de aplicación nunca maneja el `refreshToken` directamente. Los tokens nunca se incluyen en las respuestas de la API al cliente.

### Validación de inputs
Los campos `type` y `status` de tasks se validan contra listas blancas (`TYPES`, `STATUSES`) definidas en `lib/labels.ts`. El campo `title` se sanitiza con `.trim()` y se rechaza si queda vacío.

### Queries parametrizadas
Todas las queries a D1 usan `.prepare().bind()`. No hay interpolación de strings en SQL.

---

## Superficies de ataque

| Endpoint | Método(s) | Auth requerida | Notas |
|----------|-----------|----------------|-------|
| `POST /api/auth/[...all]` | GET/POST | No (es el flujo de login) | Gestionado íntegramente por Better Auth |
| `GET /api/tasks` | GET | Sí | Devuelve solo tareas del usuario |
| `POST /api/tasks` | POST | Sí | Valida body contra whitelist |
| `PATCH /api/tasks/[id]` | PATCH | Sí | Verifica `id AND user_id` |
| `DELETE /api/tasks/[id]` | DELETE | Sí | Verifica `id AND user_id` |
| `GET /api/channel` | GET | Sí | Devuelve métricas del canal del usuario |
| `POST /api/youtube/sync` | POST | Sí | Llama a YouTube API; consume cuota |

---

## Vectores posibles

### ⚠️ Agotamiento de cuota YouTube (pendiente de mitigar)
`POST /api/youtube/sync` no consulta `last_synced_at` antes de llamar a la YouTube API. Un usuario puede hacer POST repetidos y agotar las 10.000 unidades/día de cuota del proyecto (compartidas entre todos los usuarios). El campo `last_synced_at` existe en la tabla `channels` — la mitigación es agregar un chequeo antes de la llamada a la API (ej: denegar sync si han pasado menos de 60 segundos desde el último).

### IDOR (mitigado)
Un usuario que conoce el `id` de una tarea ajena no puede accederla ni modificarla: los endpoints `[id]` filtran por `id AND user_id`. Verificado con los tests de `app/api/tasks/__tests__/route.test.ts`.

### SQL Injection (mitigado)
No hay concatenación de strings en SQL. Todas las queries usan parámetros vinculados con `.bind()`.

### Exposición de tokens (mitigado)
Los campos `accessToken` y `refreshToken` de la tabla `account` no se seleccionan en ninguna query del código de negocio. La YouTube API se llama server-side; el token nunca llega al cliente.

### XSS (sin riesgo actual)
No se usa `dangerouslySetInnerHTML`. Todo el contenido del usuario se renderiza via JSX (escapado automático). No hay uploads de archivos.

---

## Checklist pre-producción

- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` configurados con `wrangler secret put` (nunca en código ni en `wrangler.jsonc`)
- [ ] Redirect URI de producción (`https://<worker>.workers.dev/api/auth/callback/google`) agregada en Google Cloud Console
- [ ] Scopes OAuth limitados a lo necesario: `openid`, `email`, `profile`, `youtube.readonly`
- [ ] Throttling de `/api/youtube/sync` implementado antes de poner en producción con usuarios reales
- [ ] Confirmar que toda query nueva sigue el patrón `WHERE user_id = ?`
- [ ] Confirmar que ningún endpoint nuevo expone datos de la tabla `account`
