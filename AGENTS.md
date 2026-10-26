# WebKitsunova — instrucciones globales para agentes

> Alcance: instrucciones del proyecto, no un mandato de ejecutar tareas no solicitadas. La tarea explícita del usuario define el objetivo; estas reglas establecen límites y estándares.

## 1. Identidad y arquitectura

- WebKitsunova es una aplicación Next.js App Router unificada, con React, TypeScript, Prisma, PostgreSQL de Supabase y Supabase Auth.
- No existe una separación funcional `frontend/` / `backend/` ni un backend Express independiente. La lógica se organiza mediante Server Components, Server Actions y servicios.
- Grupos de rutas: `app/(public)/`, `app/(auth)/`, `app/(user)/`, `app/(psychologist)/` y `app/(admin)/`.
- Responsabilidades: `app/` organiza rutas y puntos de entrada; `features/` y `components/` contienen UI; `services/` concentra reglas de negocio; `lib/` ofrece utilidades e infraestructura; `prisma/` y `supabase/` contienen esquemas y migraciones; `content/` conserva contenido estático.
- Antes de introducir un patrón nuevo, localizar y reutilizar el equivalente existente. No crear endpoints ni capas adicionales por preferencia del agente.
- Consultar el código actual como evidencia de implementación. Las descripciones documentales no prueban que una función esté operativa.

## 2. Estado funcional conocido y preservación

- Superficie pública: identidad visual propia (`.kb-*`); no imponer el sistema Soft UI de la aplicación sobre la landing.
- Autenticación: Supabase Auth y flujos de registro/login/MFA existentes. No inferir que MFA esté probado extremo a extremo.
- Usuario: Dashboard, Citas, Hábitos, Chats y Psicólogos contienen vistas mayormente ilustrativas basadas en `content/siteContent`. No presentar sus botones como funcionalidades conectadas ni completarlos sin encargo.
- Psicólogo: existen operaciones reales en citas, pacientes, mensajería, derivaciones, recursos, talleres y perfil. Preservar vínculos de paciente, pertenencia a conversaciones, estados, notificaciones, moderación y disponibilidad.
- Administración: existen operaciones reales y privilegiadas sobre usuarios, credenciales y perfiles de psicólogos. Tratar el área como sensible, aun cuando el cambio solicitado parezca superficial.
- No alterar comportamientos de negocio, datos ni permisos como efecto colateral de una tarea visual o documental.

## 3. Seguridad, identidad y privacidad

- Los roles `USER`, `PSYCHOLOGIST` y `ADMIN` se obtienen del contexto autorizado de Supabase; verificar la implementación vigente en `lib/auth/guard.ts` y `lib/auth/roles.ts`.
- Proteger operaciones en el límite del servidor: un layout protegido no sustituye comprobaciones de sesión, rol, titularidad o relación en Server Actions y servicios.
- Toda entrada externa debe validarse en tiempo de ejecución; TypeScript no es validación de runtime. Reutilizar las validaciones existentes o introducir un esquema apropiado cuando la tarea lo requiera.
- Para citas, reportes, pacientes, derivaciones y conversaciones, conservar el alcance por identidad y relación autorizada.
- Nunca exponer secretos, service-role keys, tokens, datos personales o de pacientes en logs, respuestas, fixtures o archivos versionados.
- Riesgos conocidos que requieren tarea separada: acciones administrativas sin autorización independiente identificable y estado `ACTIVE` fijo en `getSessionUser()`. No declarar vulnerabilidad explotable sin prueba; tampoco ignorar estos riesgos al modificar las rutas afectadas.
- Cambios de MFA, roles, credenciales, autorización, eliminación de datos y flujos de cuenta requieren análisis reforzado y pruebas pertinentes. No introducir relajaciones de seguridad para hacer pasar una interfaz o prueba.

## 4. Base de datos, migraciones y producción

- Prisma es el ORM de la aplicación; Supabase PostgreSQL aloja los datos. Existen históricos de migraciones tanto en `prisma/migrations/` como en `supabase/migrations/`.
- Comprobar cómo se aplica realmente una migración antes de proponerla. En el estado auditado, `supabase:deploy` usa `supabase db push`; `deploy-migrations.yml` lo ejecuta en producción al hacer push a `main` con cambios de migraciones.
- Emplear migraciones versionadas y revisables. No usar `prisma db push` para modificar producción como flujo normal.
- Nunca ejecutar una migración en producción, despliegue, `vercel --prod`, borrado irreversible ni modificación de recursos remotos sin autorización explícita para esa operación.
- El script `release` identificado ejecuta migraciones antes de `typecheck` y `test`: no asumir que dicho orden es seguro ni corregirlo incidentalmente.
- No asumir existencia de controles externos (protección de ramas, aprobación de entornos o despliegue automático de Vercel) sin verificarlos.

## 5. Git y autonomía

- `staging` **local** es la base de integración, pero toda implementación se realiza en una rama local de tarea creada desde `staging`. Prohibido trabajar directamente en `staging` o `main`.
- Antes de iniciar o continuar una rama de tarea, incorporar los cambios vigentes de **`staging` local a la rama de tarea**, resolviendo conflictos y protegiendo trabajo ajeno. Nunca descargar o mezclar automáticamente `origin/staging` ni `origin/main`.
- **Pruebas y commits locales son automáticos**: no pedir aprobación por cada commit. Tras cada ticket completado y validado, crear commit local con ID Sxx; usar staging selectivo para no incluir modificaciones ajenas.
- Antes de proponer integrar la rama de trabajo **hacia `staging` local**, sincronizar desde `staging` local, resolver conflictos y pasar las pruebas necesarias. Pedir aprobación para esa integración; no hacer merge de vuelta a `staging` por iniciativa propia.
- Preparar la rama y las evidencias para un Pull Request hacia `staging`; **el usuario aprueba el PR**. El push y la creación del PR requieren su autorización expresa. No hacerlos automáticamente.
- El usuario gestiona posteriormente el PR hacia `main`. Prohibido intervenir `main`, `origin/main` u `origin/staging` sin autorización específica; nunca forzar push o reset.
- Las auditorías de solo lectura no implican permiso de editar ni hacer commit. Las operaciones de producción, migraciones remotas o destructivas requieren autorización independiente.
- El protocolo detallado, incluido el manejo de bloqueos, se encuentra en `contexto/planificacion/06_GIT_LOCAL_Y_PR.md`.

## 6. Método de trabajo

1. Interpretar objetivo, límites y criterios de aceptación del usuario.
2. Clasificar dominio y riesgo: bajo (local), medio (UI/funcional acotado), alto (datos, auth, acciones, arquitectura), crítico (producción, migraciones, operaciones destructivas).
3. Identificar los archivos directamente responsables; iniciar búsqueda con 1–3 archivos cuando sea suficiente, ampliando si el riesgo o dependencias lo exige.
4. Consultar la documentación pertinente y seleccionar skills cuando realmente añadan procedimiento especializado.
5. Reutilizar componentes y servicios actuales; preferir cambios pequeños y reversibles.
6. Para trabajo complejo, explicar un plan breve antes de modificar. No investigar todo el repositorio sin motivo.
7. Ejecutar solo los cambios autorizados. Revisar diff y efectos en otras superficies.
8. Validar proporcionalmente; reportar pruebas omitidas, bloqueos y riesgos residuales.
9. Detenerse al satisfacer el objetivo; no añadir mejoras oportunistas.

## 7. Validación y calidad

- Ajuste textual/documental: comprobar referencias y diff. Cambio TS local: comprobar tipos y pruebas afectadas cuando sean viables.
- UI: comprobar responsividad, teclado, estados vacíos/error/carga, accesibilidad y consistencia visual. No modificar lógica de negocio inadvertidamente.
- Auth, permisos, servicios de pacientes y administración: probar casos permitidos/denegados, validación de entradas, errores y efectos de escritura; no considerar suficiente un layout con `requireRole()`.
- Migraciones y CI/CD: efectuar primero revisión estática de compatibilidad, impacto y rollback; ninguna ejecución de producción implícita.
- Los workflows existentes ejecutan typecheck, tests y build en PR; no asumir que ejecutan lint. Un script disponible tampoco prueba que sea ejecutable sin errores.
- Si una verificación falla o no puede ejecutarse, indicarlo claramente. No afirmar que pasó.

## 8. Diseño y accesibilidad

- `DESIGN.md` (mayúsculas exactas) es la fuente canónica de gobernanza visual. Evitar referencias a `design.md` por portabilidad entre sistemas de archivos.
- Distinguir tres mundos: landing pública; experiencia de Usuario/Psicólogo; administración. Cada uno conserva identidad, tokens y patrones establecidos.
- Antes de cambios visuales relevantes, consultar `DESIGN.md` y, cuando corresponda, `.kilo/skills/soft-ui-guardian/SKILL.md` y sus referencias necesarias.
- Mantener mobile-first, contraste, foco, navegación por teclado, reducción de movimiento, modales accesibles y componentes reutilizables. No copiar todo el sistema de diseño aquí.

## 9. Reglas, skills y memoria

- `.kilo/rules/efficient-changes.md`: procedimiento de investigación, alcance y validación proporcional.
- `.kilo/rules/skill-routing.md`: guía para escoger skills según la tarea; es una política documental, no prueba de activación automática en Kilo 7.8.15.
- `.kilo/skills/quick-fix/`: procedimientos para ajustes locales de bajo riesgo.
- `.kilo/skills/soft-ui-guardian/`: protección visual especializada.
- `.kilo/skills/project-memory/`: lectura y actualización selectiva de `docs/PROJECT_MEMORY.md`.
- `.agents/skills/`: catálogo de habilidades adicionales; no invocar múltiples skills sin aporte claro a la tarea.
- `docs/PROJECT_MEMORY.md` contiene hechos técnicos verificables y duraderos, nunca políticas obligatorias, secretos, hipótesis sin marcar o listas de tareas transitorias.
- No depender de una precedencia o carga automática de instrucciones no verificada; declarar en el plan las referencias esenciales que se usarán.

## 10. Proyecto histórico y cierre

- `/proyecto viejo` es referencia histórica de solo lectura; utilizarlo únicamente para resolver una necesidad concreta. Nunca copiarlo sin validar arquitectura y seguridad actuales.
- No instalar dependencias, crear servicios ni alterar CI/CD fuera del objetivo solicitado.
- Al concluir, comunicar: archivos editados; comportamiento cambiado y preservado; validaciones realmente realizadas; riesgos y tareas pendientes. No afirmar despliegues ni modificaciones remotas inexistentes.

## 11. Ejecución enfocada por horas

- Consultar `contexto/README.md` y `contexto/planificacion/01_BACKLOG_HORAS.md` solo cuando la tarea corresponda al plan Kitsunova; no cargar toda la carpeta de contexto por defecto.
- `contexto/` describe producto, prioridades y evidencias: NO reemplaza políticas de este archivo, `.kilo/rules/` ni `DESIGN.md`.
- Trabajar en una microtarea ID por vez; objetivo operativo 30–90 minutos, sin convertir estimaciones en garantías de entrega. Si excede alcance, registrar bloqueo y descomponer, sin ampliar silenciosamente.
- Para ejecución, registrar evidencia real y el estado en `contexto/planificacion/02_REGISTRO.md`; no marcar como hecho lo solo inspeccionado.
- Prioridad: controles de autorización pertinentes antes de exponer catálogos, citas, chat y datos emocionales. Reutilizar los servicios existentes de Psicólogo y Admin.
- El plan autoriza ramas, pruebas y commits **locales** por ticket implementado; NO autoriza push, PR, merge hacia `staging` local sin aprobación, operaciones sobre `main`, migraciones aplicadas a producción ni despliegues. Ver `06_GIT_LOCAL_Y_PR.md`.

## Sprint intensivo Auto Free (plan de 5 horas)
Cuando el usuario solicite el sprint, seguir `contexto/planificacion/00_TABLERO.md`, `01_BACKLOG_HORAS.md` y `05_PROTOCOLO_AUTO_FREE.md`. Un solo ticket por ejecución; no sacrificar autorización, privacidad ni pruebas para cumplir minutos. El presupuesto de 300 minutos no implica promesa de alcance completo.
