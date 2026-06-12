# PLAN.md — Mejoras y nuevas implementaciones

Lista de posibles mejoras para hacer la herramienta más útil para creadores de contenido. Organizada por categoría.

---

## 📊 Métricas y analítica

1. **Histórico de métricas** — Nueva tabla `channel_snapshots` que guarda subs/vistas/videos en cada sync. Habilita gráficas de evolución en el dashboard. Hoy solo se ve el valor actual; esta es la base más valiosa para todo lo demás.
2. **Métricas por video** — Mostrar los últimos N videos con vistas, likes y comentarios. Usa `playlistItems` + `videos` de la API (~3 unidades extra por sync).
3. **Crecimiento semanal/mensual** — Deltas y porcentajes calculados a partir de los snapshots: "+340 subs esta semana", "+2.1% vistas este mes". Depende de (1).
4. **YouTube Analytics API** — Watch time, CTR, retención y demografía. Requiere agregar el scope OAuth `yt-analytics.readonly` y re-consentimiento del usuario.
5. **Hitos y celebraciones** — Detectar cruces de umbral (10k subs, 1M vistas) y mostrarlos en el dashboard.

## 📅 Calendario y planificación

6. **Pipeline de producción** — Estados granulares en vez de pending/in_progress/done: Idea → Guion → Grabación → Edición → Publicado. Refleja el flujo real de un creador.
7. **Banco de ideas** — Backlog de ideas sin fecha, separado del calendario, con botón "programar" que la convierte en tarea con `due_date`.
8. **Tareas recurrentes** — "Video cada lunes": regla de recurrencia que genera instancias automáticamente.
9. **Drag & drop en el calendario** — Arrastrar una tarea a otro día para cambiar su `due_date`.
10. **Checklists/subtareas** — Pasos dentro de una tarea (miniatura, título, tags, descripción…), con plantilla predefinida según el tipo de contenido (video, short, live).
11. **Series/etiquetas** — Agrupar tareas por serie o playlist planificada para ver el progreso de cada serie.

## 🔗 Cierre del loop plan → publicación

12. **Vincular tarea con video publicado** — Al detectar un video nuevo en el sync, sugerir marcar la tarea correspondiente como "done" y mostrar las métricas del video dentro de la tarea.
13. **Planificado vs. real** — Vista de consistencia: ¿publicaste lo que planeaste y en la fecha prevista? Métrica clave para creadores que buscan constancia.

## 🤖 Automatización (Cloudflare)

14. **Sync automático** — Cron Trigger del Worker que sincroniza los canales cada X horas, respetando `last_synced_at` y la cuota de 10.000 unidades/día.
15. **Resumen semanal por email** — Con Cloudflare Email Service: métricas de la semana + tareas próximas, enviado cada lunes.
16. **Recordatorios** — Email/notificación cuando una tarea vence mañana y sigue pendiente.

## ✨ IA (Workers AI)

17. **Generador de ideas/títulos** — Sugerencias basadas en los títulos existentes del canal y su categoría.
18. **Asistente de descripción y tags** — Borrador de descripción SEO y tags a partir del título de la tarea.

## 🧱 Plataforma

19. **Multi-canal** — La tabla `channels` ya soporta varios canales por usuario; falta UI de selector de canal y ajustar el sync.
20. **Modo público/compartir** — Página read-only de métricas para compartir con sponsors o colaboradores.
21. **Export** — Exportar el calendario a iCal y las tareas a CSV.

---

## Sugerencia de priorización

Empezar por **histórico de métricas (1)**, **pipeline de producción (6)** y **banco de ideas (7)**: son las de mayor valor para creadores con menor esfuerzo, y (1) desbloquea (3), (5) y (13).
