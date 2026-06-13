# YouTube Data API v3

## Límites de cuota

| Métrica | Valor |
|---------|-------|
| Cuota diaria | 10.000 unidades por proyecto de Google Cloud |
| Costo de sync básico | ~3 unidades (`channels?part=snippet,statistics`) |
| Syncs posibles por día | ~3.333 |

> La cuota se reinicia a medianoche hora del Pacífico (PT).

---

## Estrategia de sincronización

**No sincronizar en cada visita.** El sync ocurre solo cuando el usuario lo pide explícitamente (botón en `/dashboard`). La columna `last_synced_at` en la tabla `channels` registra cuándo fue el último sync — puede usarse para mostrar "Última actualización: hace X minutos" y decidir si habilitar o deshabilitar el botón de sync.

Por qué no sincronizar automáticamente:
- 3k syncs/día con un solo proyecto es poco margen si hay usuarios reales
- El dashboard se carga frecuentemente — cada visita consumiría cuota innecesariamente
- Las métricas de YouTube no cambian en segundos; un sync por sesión es suficiente

---

## Flujo de sync

```
POST /api/youtube/sync
  │
  ├── 1. Verificar sesión (getAuth + auth.api.getSession)
  ├── 2. Obtener accessToken de Google:
  │       auth.api.getAccessToken({ body: { providerId: "google", userId } })
  │       → Better Auth refresca el token si expiró (usa refreshToken de tabla "account")
  │
  ├── 3. Llamar YouTube API:
  │       GET https://www.googleapis.com/youtube/v3/channels
  │           ?part=snippet,statistics&mine=true
  │       Authorization: Bearer <accessToken>
  │
  ├── 4. Parsear respuesta:
  │       items[0].id                          → channel_id
  │       items[0].snippet.title               → channel_name
  │       items[0].snippet.thumbnails.default  → thumbnail_url
  │       items[0].statistics.subscriberCount  → subscribers
  │       items[0].statistics.viewCount        → total_views
  │       items[0].statistics.videoCount       → video_count
  │
  └── 5. Upsert en D1:
          Si existe la fila en channels (mismo user_id + channel_id) → UPDATE
          Si no existe → INSERT con crypto.randomUUID()
          Siempre actualizar last_synced_at = new Date().toISOString()
```

---

## Campos actualizados en cada sync

| Campo D1 | Fuente YouTube API |
|----------|--------------------|
| `channel_name` | `snippet.title` |
| `thumbnail_url` | `snippet.thumbnails.default.url` |
| `subscribers` | `statistics.subscriberCount` (string → Number) |
| `total_views` | `statistics.viewCount` (string → Number) |
| `video_count` | `statistics.videoCount` (string → Number) |
| `last_synced_at` | `new Date().toISOString()` (generado localmente) |

> `statistics.*Count` llega como string desde la API de YouTube. Se convierte con `Number()`.

---

## Manejo de errores

| Caso | Comportamiento |
|------|---------------|
| No hay cuenta de Google vinculada | 400 — el usuario debe volver a hacer login |
| Token expirado | Better Auth lo renueva automáticamente con el refreshToken |
| Refresh token inválido/revocado | `auth.api.getAccessToken` lanza excepción → 400 |
| YouTube API devuelve error | 502 con el texto crudo de la respuesta de YouTube en `detail` |
| La cuenta no tiene canal de YouTube | 404 — `items` vacío en la respuesta |

---

## Configuración en Google Cloud Console

Para que el scope de YouTube funcione:
1. Activar **YouTube Data API v3** en el proyecto de Google Cloud
2. En el OAuth consent screen, agregar el scope `youtube.readonly`
3. Si la app está en modo "Testing", agregar los emails de los usuarios como testers

En producción, la app debe pasar el proceso de verificación de Google si el scope de YouTube lo requiere (para apps públicas).
