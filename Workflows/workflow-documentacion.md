# Workflow — Documentación

**Propósito**: mantener la documentación sincronizada con el código tras cada sesión de cambios.

## Docs que este workflow mantiene

| Doc | Qué cubre |
|-----|-----------|
| `README.md` | Descripción, stack, rutas, setup (Google Cloud + Cloudflare), comandos, estructura de archivos |
| `CLAUDE.md` | Instrucciones para agentes: stack, comandos, restricciones de Workers/D1, schema de negocio, estrategia de YouTube API, env vars |
| `PLAN.md` | Roadmap de mejoras pendientes (marcar como hechas las que se implementen) |
| `Docs/api.md` | Endpoints REST: métodos, auth requerida, request body, response shape, errores |
| `Docs/architecture.md` | Capas del sistema, flujos de request, patrones de seguridad, cómo OpenNext adapta Next.js |
| `Docs/database.md` | Schema completo (Better Auth + negocio), relaciones, índices, reglas de D1, migraciones |
| `Docs/deploy.md` | Dev local, preview y producción; variables de entorno; wrangler secrets; Google Cloud OAuth |
| `Docs/auth.md` | Flujo OAuth completo, scopes, sesiones, refresh de tokens, protección de rutas |
| `Docs/youtube-api.md` | Cuotas, estrategia de sync, flujo de sincronización, campos actualizados, manejo de errores |

> `AGENTS.md` es generado por Next.js (bloque `nextjs-agent-rules`) — no editarlo manualmente.
> `Docs/test.md` y `Docs/security.md` tienen workflow propio (tests y seguridad); no se tocan aquí.

## Paso 1 — Ver qué cambió

```bash
git diff HEAD~1
git status   # por si hay cambios sin commitear
```

Leer el diff completo antes de decidir nada.

## Paso 2 — Decidir qué amerita documentar

| Cambio | Doc a actualizar |
|--------|------------------|
| Cambió `schema.sql` (tablas `channels`, `tasks` o las de Better Auth) | `Docs/database.md` y `CLAUDE.md` (sección "Base de datos") |
| Se agregó/eliminó una ruta de página (`app/(app)/...`) | `README.md` y `CLAUDE.md` (sección "Rutas") y `Docs/architecture.md` |
| Se agregó/modificó un endpoint (`app/api/...`) | `Docs/api.md` y `CLAUDE.md` (sección "Rutas") |
| Cambió el stack o una dependencia importante (`package.json`) | `README.md` y `CLAUDE.md` (tabla "Stack") y `Docs/architecture.md` |
| Cambió un script de `package.json` o la config de `wrangler.jsonc` | `Docs/deploy.md`, `CLAUDE.md` (sección "Comandos") y `README.md` |
| Nueva env var o secret | `Docs/deploy.md`, `CLAUDE.md` (sección "Variables de entorno") y `README.md` |
| Cambió `lib/auth.ts`, `lib/session.ts` o los scopes OAuth | `Docs/auth.md` |
| Cambió `app/api/youtube/sync/route.ts` o la estrategia de cuota | `Docs/youtube-api.md` y `CLAUDE.md` (sección "YouTube Data API") |
| Nuevo componente en `components/` o módulo en `lib/` | `Docs/architecture.md` (tabla de capas) |
| Se implementó algo listado en `PLAN.md` | Marcarlo/moverlo en `PLAN.md` |
| Cambio de arquitectura: nueva capa, patrón de seguridad, adaptador | `Docs/architecture.md` |
| Algo nuevo sin doc existente | Crear sección en el doc más cercano |

**Excluir**: fixes de bugs sin cambio de interfaz, refactors internos, ajustes de estilos/Tailwind.

## Paso 3 — Documentar

El foco es explicar **cómo funciona el código**, no qué líneas se tocaron:
- Describir el flujo, no el diff.
- Actualizar tablas y listas desactualizadas (rutas, comandos, env vars, schema).
- Eliminar secciones obsoletas.

## Paso 4 — Reportar

Resumir en el chat qué docs se actualizaron/crearon, qué secciones cambiaron y por qué.
