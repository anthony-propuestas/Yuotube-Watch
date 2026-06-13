# Workflow — Comparación código ↔ documentación

**Propósito**: detectar desfases entre el código real y la documentación, y reportarlos al usuario para que decida. **Es de análisis y reporte: nunca edita código ni docs.**

## Documentos del proyecto

- `README.md` — descripción, stack, rutas, setup, comandos, estructura
- `CLAUDE.md` — instrucciones para agentes: stack, comandos, restricciones Workers/D1, schema, YouTube API, env vars
- `PLAN.md` — roadmap de mejoras
- `Docs/test.md` — suites de tests (lo crea el workflow de tests; si no existe aún, omitir)
- `Docs/security.md` — análisis de seguridad (lo crea el workflow de seguridad; si no existe aún, omitir)

> `AGENTS.md` es generado por Next.js — excluido de la comparación.

## Paso 1 — Leer todos los documentos listados

Leer cada uno completo antes de verificar nada.

## Paso 2 — Verificar cada documento contra el código real

**README.md**
- ¿Las 4 rutas documentadas (`/`, `/dashboard`, `/calendar`, `/tasks`) existen en `app/` y no hay rutas nuevas sin listar?
- ¿El stack y versiones coinciden con `package.json`?
- ¿Los comandos documentados coinciden con los `scripts` actuales de `package.json`?
- ¿La estructura de archivos descrita (si la hay) coincide con `app/`, `components/`, `lib/`?

**CLAUDE.md**
- ¿El schema documentado (`channels`, `tasks`) coincide con `schema.sql` columna por columna?
- ¿Los archivos referenciados (`lib/db.ts`, `lib/auth.ts`, `app/api/youtube/sync/route.ts`) existen y funcionan como se describe?
- ¿La config de `wrangler.jsonc` (binding `DB`, `nodejs_compat`, `database_id`) coincide con lo documentado?
- ¿Las env vars listadas coinciden con las usadas en el código y con `.dev.vars`/`.env.local`?

**PLAN.md**
- ¿Hay items marcados como pendientes que ya están implementados en el código?
- ¿Hay features implementadas que nunca estuvieron en el plan?

**Docs/test.md** (si existe)
- ¿Cada suite listada tiene su archivo de test? ¿Hay tests no registrados? ¿El total coincide con `npm run test:run`?

**Docs/security.md** (si existe)
- ¿Los mecanismos documentados (getSession, filtro user_id, manejo de tokens) siguen en el código?
- ¿Hay endpoints en `app/api/` nuevos sin analizar en el doc?

## Paso 3 — Reportar cada diferencia en el chat

```
[ARCHIVO_DOC] Sección: X
- Doc dice: "..."
- Código dice: "..."
- Acción sugerida: actualizar doc / actualizar código / investigar más
```

## Paso 4 — Esperar la decisión del usuario

No editar nada hasta que el usuario indique cómo resolver cada diferencia.
