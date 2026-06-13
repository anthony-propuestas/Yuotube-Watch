# Tests

Runner: Vitest (`npm run test:run` para una sola pasada, `npm run test` en modo watch). Config en `vitest.config.ts` (alias `@/` → raíz, entorno node).

## Suites

| Suite | Archivo | Qué cubre | # tests |
|-------|---------|-----------|---------|
| labels | `lib/__tests__/labels.test.ts` | `TYPE_LABELS`, `STATUS_LABELS` y `TYPE_COLORS` cubren todos los `TaskType`/`TaskStatus` con valores válidos | 3 |
| tasks route | `app/api/tasks/__tests__/route.test.ts` | `GET`/`POST /api/tasks`: 401 sin sesión, validación de título/type/status (400), creación exitosa (201). Mockea `@/lib/db` y `@/lib/session` | 8 |

**Total: 11 tests** (última ejecución: 2026-06-12, todos en verde).

## Decisiones / pendientes

- `lib/types.ts`: solo exporta tipos TypeScript — no hay lógica de runtime que testear.
- Componentes (`components/`) y páginas: JSX sin lógica no trivial por ahora; no ameritan test según el workflow.
- Sin test todavía: `app/api/tasks/[id]/route.ts`, `app/api/channel/route.ts`, `app/api/youtube/sync/route.ts` — testeables con el mismo patrón de mocks que la suite de tasks.
