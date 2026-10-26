# Kitsunova — sprint de máximo 300 minutos

**Objetivo:** maximizar funcionalidades reales verificadas durante una sesión de 5 horas. No es promesa de completar las seis funcionalidades: seguridad y pruebas son puertas obligatorias; lo incompleto queda documentado, sin datos ficticios presentados como reales.

## Presupuesto fijo
| Ventana | Minutos | Resultado perseguido | Tickets |
|---|---:|---|---|
| 00:00–00:25 | 25 | Línea base + autorización mínima priorizada | S01–S02 |
| 00:25–01:15 | 50 | Acceso/roles/admin: fallo crítico corregido o bloqueado | S03–S04 |
| 01:15–02:25 | 70 | Catálogo real y perfil público de psicólogos | S05–S07 |
| 02:25–03:30 | 65 | Reserva y listado real con reglas de servidor | S08–S10 |
| 03:30–04:20 | 50 | Chat usuario conectado con membresía | S11–S12 |
| 04:20–04:50 | 30 | Hábitos: mejor vertical seguro alcanzable | S13 |
| 04:50–05:00 | 10 | Pruebas focalizadas y entrega | S14 |

**Regla de tiempo:** cada ticket tiene un máximo. Al alcanzarlo: registrar el estado real, detener cambios incompletos que expongan riesgo y pasar solo a una siguiente tarea independiente. No rellenar huecos con mocks, saltar controles o marcar tareas sin prueba como terminadas.

**Semáforo de tickets:** PENDIENTE / EN CURSO / VERIFICADA / PARCIAL / BLOQUEADA. Solo VERIFICADA cuando supera sus criterios de aceptación. Iniciar S01; no ejecutar el backlog completo en una sola petición.

**Riesgos y límites:** no tocar producción, Git remoto ni migraciones reales sin autorización explícita; si una nueva tabla es imprescindible, producir migración versionada local y detener aplicación remota. No improvisar información clínica ni compartir registros emocionales por defecto.
