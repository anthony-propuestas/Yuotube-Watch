# Workflow — Tests después de cambios

**Propósito**: mantener los tests sincronizados con el código tras cada sesión de cambios.

> ⚠️ **Este proyecto NO tiene tests ni runner configurado** (no hay script `test` en `package.json` ni archivos `*.test.ts`). La primera vez que se ejecute este workflow, hacer el Paso 0.

## Paso 0 — Configuración mínima (solo la primera vez)

1. Instalar Vitest (el runner que mejor encaja con Next.js + TypeScript en este stack):
   ```bash
   npm install -D vitest @vitejs/plugin-react
   ```
2. Agregar a `package.json`:
   ```json
   "test": "vitest",
   "test:run": "vitest run"
   ```
3. Crear `vitest.config.ts` con alias `@/` apuntando a la raíz (igual que `tsconfig.json`).
4. Convención a adoptar: tests junto al archivo en `__tests__/`, p. ej. `lib/labels.ts` → `lib/__tests__/labels.test.ts`.
5. Empezar por lo testeable sin mocks pesados: `lib/labels.ts`, `lib/types.ts`, y la lógica de validación de los endpoints (`TYPES`/`STATUSES` en `app/api/tasks/route.ts`).

> Nota: los API routes dependen de `getCloudflareContext` (binding D1) y de la sesión de Better Auth — para testearlos hay que mockear `@/lib/db` y `@/lib/session`. Priorizar tests de lógica pura; los routes se testean mockeando esos dos módulos.

## Paso 1 — Identificar archivos cambiados

```bash
git diff --name-only HEAD~1
git status   # cambios sin commitear
```

Filtrar solo código fuente: `app/`, `components/`, `lib/`. Ignorar assets (`public/`), configs (`*.config.*`, `wrangler.jsonc`, `tsconfig.json`), `schema.sql` y docs.

## Paso 2 — Mapear cada archivo a su test

Convención: `lib/X.ts` → `lib/__tests__/X.test.ts`, `app/api/tasks/route.ts` → `app/api/tasks/__tests__/route.test.ts`, etc.

| Situación | Acción |
|-----------|--------|
| Archivo nuevo sin test | Crear test según la convención |
| Archivo modificado con test | Editar el test si cambió la interfaz pública |
| Archivo eliminado | Eliminar su test |
| Archivo modificado sin test | Evaluar si amerita test; documentar la decisión |

Los componentes React (`components/`) y páginas (`app/(app)/`) solo ameritan test si tienen lógica no trivial (cálculos de calendario, filtrado); el JSX puro no.

## Paso 3 — Ejecutar los tests (una sola vez, sin watch)

```bash
npm run test:run
```

## Paso 4 — Actualizar el doc de tests

Actualizar `Docs/test.md` — **si no existe, crearlo** con una tabla de suites:

| Suite | Archivo | Qué cubre | # tests |
|-------|---------|-----------|---------|

Agregar/editar/eliminar filas y actualizar el total.

## Paso 5 — Comunicar resultado

- **Si falla algo**: reportar qué test falló, el error exacto, la causa raíz probable y la acción recomendada. No marcar el workflow como completo hasta que pasen o el usuario decida posponer.
- **Si todo pasa**: resumir archivos cambiados, tests creados/editados/eliminados, total de tests y confirmar que `Docs/test.md` fue actualizado.
