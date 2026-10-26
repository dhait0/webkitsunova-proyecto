# Protocolo Kilo Auto Free (obligatorio para este sprint)

1. Recibir exactamente **un** ticket Sxx. No iniciar los siguientes por iniciativa propia.
2. Leer `AGENTS.md`, `contexto/planificacion/00_TABLERO.md` y **solo** los 1–3 archivos de entrada relevantes. Usar `MAPA_TECNICO.md` antes de buscar.
3. En <=120 palabras: estado actual, archivos a tocar, riesgo, aceptación. Luego ejecutar la tarea (salvo modo solo lectura).
4. Mantener cambio localizado; reutilizar `services/psy/`, Prisma, Supabase y patrones UI; respetar `DESIGN.md` y `soft-ui-guardian` para UI.
5. Validar justo lo que cambió. Seguridad, membresía y datos sensibles nunca se omiten por falta de tiempo.
6. Registrar ID, duración observada, archivos, pruebas, resultado y bloqueo en `02_REGISTRO.md` solo cuando esté autorizado a editar documentación.
7. Detenerse tras un ticket; responder <=250 palabras. Si el proveedor devuelve 503/499/ECONNRESET, reintentar máximo una vez, con alcance menor.
8. Ejecutar pruebas locales y **commit local automático** de cada ticket validado (con ID Sxx); trabajar siempre en rama de tarea basada en `staging` local. Incorporar `staging` local hacia rama de tarea cuando corresponda. No merge de regreso a `staging` local, push, PR, cambios en `main`, despliegue ni migración productiva sin autorización específica. Ver `06_GIT_LOCAL_Y_PR.md`.

**Plantilla de instrucción:**

> Ejecuta solamente el ticket Sxx del archivo `contexto/planificacion/01_BACKLOG_HORAS.md`. Aplica `05_PROTOCOLO_AUTO_FREE.md`. Usa los archivos de entrada indicados; no inspecciones otros salvo dependencia estricta. Reutiliza lógica existente, preserva seguridad, haz pruebas proporcionales, actualiza registro y detente. No avances al siguiente ticket, haz commit local tras pasar pruebas; no hagas push, PR, merge hacia staging/main, deploy ni migraciones de producción.
