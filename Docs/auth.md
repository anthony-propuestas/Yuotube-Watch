# Autenticación

Stack: **Better Auth** + **Google OAuth 2.0**. Las sesiones y tokens se persisten en Cloudflare D1.

---

## Flujo OAuth completo

```
1. Usuario hace click en "Entrar con Google" (components/sign-in-button.tsx)
2. Better Auth redirige a accounts.google.com con los scopes configurados
3. Usuario aprueba → Google redirige a /api/auth/callback/google
4. Better Auth procesa el callback:
   a. Crea/actualiza fila en tabla "user"
   b. Guarda accessToken + refreshToken en tabla "account"
   c. Crea sesión en tabla "session" (cookie HttpOnly)
5. Browser redirige a /dashboard
```

---

## Scopes de Google

Configurados en `lib/auth.ts`:

| Scope | Para qué |
|-------|---------|
| (implícito) `openid`, `email`, `profile` | Datos del usuario para Better Auth |
| `https://www.googleapis.com/auth/youtube.readonly` | Leer métricas del canal |

`accessType: "offline"` obtiene un `refreshToken` para renovar el `accessToken` sin re-login.  
`prompt: "select_account consent"` fuerza el consent screen para asegurar que se otorgue el scope de YouTube.

---

## Instancia de Better Auth

`lib/auth.ts` exporta `getAuth()` (función async, no singleton). Debe instanciarse por request porque `getCloudflareContext()` solo está disponible dentro del contexto de una request de Workers.

```ts
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return betterAuth({
    database: { dialect: new D1Dialect({ database: env.DB }), type: "sqlite" },
    socialProviders: { google: { ... } },
  });
}
```

---

## Verificar sesión en API routes

Usar `lib/session.ts`:

```ts
import { getSession } from "@/lib/session";

const session = await getSession();
if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

// session.user.id ← usar para filtrar queries en D1
```

`getSession()` internamente llama `auth.api.getSession({ headers })` que lee la cookie de sesión, la valida contra la tabla `session` en D1 y retorna el objeto de sesión con `user`.

---

## Refresh automático de tokens

Cuando se necesita el `accessToken` de Google (solo en `/api/youtube/sync`), usar:

```ts
const token = await auth.api.getAccessToken({
  body: { providerId: "google", userId },
});
```

Better Auth comprueba automáticamente si el `accessToken` expiró. Si expiró, usa el `refreshToken` almacenado en la tabla `account` para obtener uno nuevo antes de devolverlo.

---

## Protección de rutas de página

`app/(app)/layout.tsx` ejecuta `getSession()` en el servidor. Si no hay sesión activa, redirige al usuario a `/` (landing). Todas las rutas dentro de `app/(app)/` quedan protegidas sin necesidad de lógica en cada página.

---

## Tablas involucradas

| Tabla | Qué guarda |
|-------|-----------|
| `user` | Datos del usuario (nombre, email, avatar) |
| `session` | Sesiones activas con token de cookie y expiración |
| `account` | Tokens OAuth por proveedor (accessToken, refreshToken, scopes) |
| `verification` | Tokens de verificación de email (no usado con OAuth puro) |

Ver schema completo en [Docs/database.md](database.md).
