# Contexto operativo de Kitsunova

**Leer solo lo necesario.** Fuente de restricciones globales: `../AGENTS.md`; diseño: `../DESIGN.md`; reglas operativas: `../.kilo/rules/`. Esta carpeta es **contexto de producto y planificación**, no gobernanza paralela.

- `PRODUCTO.md`: visión aprobada, audiencias, alcance y cuestiones por decidir.
- `ESTADO_CODIGO.md`: mapa de implementación verificada en auditoría y brechas.
- `MAPA_TECNICO.md`: pistas directas de archivos/servicios para evitar rastrear todo el repo.
- `INICIAR_KILO.md`: prompt de trabajo.
- `planificacion/00_TABLERO.md`: prioridades y ruta crítica.
- `planificacion/01_BACKLOG_HORAS.md`: microtareas, dependencias, condiciones de salida, **tiempo de trabajo orientativo en horas**.
- `planificacion/02_REGISTRO.md`: avance con evidencia; inicialmente todo pendiente.
- `planificacion/03_CONTRATOS_VERTICAL.md`: definición de terminado por flujo.
- `planificacion/04_DECISIONES.md`: decisiones por confirmar, sin inventar requisitos.
- `calidad/PRUEBAS_MINIMAS.md`: validación proporcional por riesgo.
- `arquitectura/SEGURIDAD_DATOS.md`: guardas y reglas de datos sensibles.

No analizar 10 documentos antes de editar 1 archivo: comenzar con esta navegación, la microtarea activa y los archivos relevantes.


## Sistema de diseño (incluido en el paquete)

El ZIP incluye `DESIGN.md` en la raíz y `contexto/diseno/README.md` como guía de consulta para Kilo. Si el repositorio ya contiene un `DESIGN.md` más reciente, **no lo sobrescribas**: compáralos y conserva la versión vigente. No instales una segunda copia dentro de `contexto/`.

## Git local y revisión

Consultar `planificacion/06_GIT_LOCAL_Y_PR.md`: ramas de tarea desde staging local, pruebas y commits locales automáticos, preparación de PR y aprobación del usuario.
