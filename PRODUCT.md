# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tres roles funcionales, definidos en Kitsunova y **distintos** de los roles internos de Supabase Auth (`anon`, `authenticated`). El rol de la aplicación se lee exclusivamente de `user.app_metadata.role`.

- **USER** — persona que quiere construir hábitos sostenibles con acompañamiento. Usa la plataforma para registrar hábitos, consultar recursos, agendar citas y comunicarse con psicólogos. Cliente principal, en paridad con el psicólogo.
- **PSYCHOLOGIST** — profesional que gestiona su perfil, pacientes, sesiones, mensajes, talleres y recursos. Cliente principal, en paridad con el usuario final.
- **ADMIN** — operador interno. Supervisa usuarios, itinerarios de aprobación de psicólogos, estadísticas de plataforma y moderación de contenido. No es cliente comercial.

Ambas superficies de cliente están en paridad y se priorizan por fases; ninguna es subordinada a la otra.

## Product Purpose

Kitsunova acompaña el cambio de hábitos combinando seguimiento automatizado y apoyo psicológico profesional en un mismo proceso, de modo que la persona no tenga que decidir sola cuándo necesita ayuda.

La tensión que el producto existe para resolver: la duda de saber cuándo insistir con el hábito y cuándo pedir ayuda profesional, y el vacío entre una app y una consulta. El producto expone una ruta por etapas — seguimiento diario, asistencia automatizada y escalamiento a chat o cita con psicólogos.

El éxito significa que el usuario progresa sin quedar atrapado en la automatización, y que el psicólogo tiene la información y el canal para intervenir cuando corresponde.

Kitsunova es además un proyecto full-stack de portafolio profesional: la calidad de arquitectura, tipado, seguridad, testing, CI/CD y documentación es en sí misma un objetivo del producto.

## Positioning

El mecanismo diferenciador es la **salida real hacia atención profesional**: primero se automatiza lo automatizable, y cuando el caso lo requiere existe una vía clara hacia chat y cita con psicólogos. La promesa es "hábitos con apoyo real, no solo automatización".

La categoría de referencia son las apps de hábitos; el contraste es explícito contra quedar atrapadas en la automatización, nunca contra un competidor nombrado. **Kitsunova no afirma superioridad frente a productos competidores específicos** y no debe empezar a hacerlo.

## Operating Context

- **Idioma**: toda la interfaz, los mensajes de error de API y el contenido están en español. Formato de fechas y moneda: `es-CO`. Moneda por defecto: COP.
- **Desarrollo local**: `docker compose up --build` levanta PostgreSQL, backend y frontend. Backend en `:3002`, frontend en `:5174`. Vite y tsx en modo watch.
- **Despliegue**: un único proyecto de Vercel. Frontend como build estático, backend como función serverless, todo en el mismo origen (routing `/api/*` al Express). Sin `VITE_API_URL` en producción.
- **Datos y auth**: Supabase Auth para identidad; PostgreSQL de Supabase para datos, accesibles por Prisma. Dos entornos distintos: la identidad vive en Supabase Auth (nube) y los datos en el Postgres del proyecto.
- **CI/CD**: GitHub Actions es el pipeline principal. `staging` es la rama local de integración; el push al remoto y la creación de Pull Requests los hace una persona, no el agente.
- **Referencia legacy**: `proyecto viejo/` es la implementación anterior (PHP + JavaScript vanilla + MySQL, con su propio repositorio git). Es **referencia funcional**, no arquitectónica, y es READ-ONLY salvo solicitud explícita. Tiene su propio `.git`, por lo que no se versiona con este proyecto.

## Capabilities and Constraints

### Implementado y real

- **Autenticación**: registro, login, logout, sesión actual, verificación de rol, estado de MFA, baja de factor MFA, login con Google. Roles asignados en `app_metadata` al registrarse.
- **Área del psicólogo**: completa y con API propia — dashboard, pacientes y detalle, reportes de seguimiento, perfil profesional y disponibilidad semanal, agenda de citas con control de conflictos, talleres con inscripciones, recursos, mensajería directa y grupal con bloqueo y confirmaciones de lectura, notificaciones, preferencias, derivaciones entre colegas con consentimiento, reseñas. Validación Zod en servidor en todos los payloads.
- **Administración**: usuarios (listado, cambio de estado y de rol, borrado), psicólogos (listado, aprobación, verificación), estadísticas de plataforma y moderación de contenido del psicólogo (talleres y recursos).
- **Tests**: backend y frontend con suites reales en ejecución.

### No implementado — no inventar que existe

- **No hay backend para el usuario final.** No existe router `/api/user`, ni API de hábitos, ni de ánimo, ni de comunidad. Los modelos `Habit` y `MoodEntry` no existen en Prisma.
- **El área de usuario (`/dashboard`) es mock data estática**: hábitos, chats, citas, psicólogos y el progreso de la mascota se leen de constantes en `frontend/src/content/siteContent.ts` con datos inventados —incluidos nombres ficticios de profesionales— y la barra de progreso de la mascota está fija en CSS, sin dato que la mueva.
- **Las pantallas de moderación en admin no existen** aunque la API sí. La navegación los muestra deshabilitados y marcados "Pronto".
- **Login con Apple** es un botón deshabilitado.
- **El modelo `Review` no tiene ruta de escritura.** Existe la agregación del promedio pero ningún endpoint crea reseñas, así que la valoración y el número de reseñas de un psicólogo solo pueden mostrar los valores por defecto del esquema.
- **Las moderaciones de Prisma y las políticas RLS no están aplicadas** a la base de datos de Supabase; requieren credenciales y ejecución manual.
- **No hay pruebas de accesibilidad automatizadas.** La verificación es manual.

### Restricciones

- El rol de aplicación nunca debe derivarse del campo `role` de Supabase Auth.
- La UI no puede recibir credenciales privilegiadas. Las claves de servicio solo viven en servidor.
- `proyecto viejo/` no se modifica.
- `DESIGN_SYSTEM.md` fue retirado. Documentaba un mundo neumórfico que nunca existió en el producto original y cuyos tokens no aparecían en ningún archivo. La autoridad visual vive ahora en `DESIGN.md`, escrito desde la landing construida, y sigue siendo vinculante: no reescribirla ni competir con ella sin decisión explícita.

## Brand Commitments

- **Nombre: Kitsunova.** El zorro es un **kitsune**: un zorro de nueve colas. Las colas aparecen a medida que se vuelve más sabio, hasta un máximo de nueve. Esa es la razón del nombre y del número.
- **El zorro es identidad de marca y mascota a la vez.** Funciona como imagotipo e isotipo, y además es un compañero de apoyo con comportamiento similar a un tamagotchi: acompaña al usuario y lo sostiene en el proceso.
- **La mascota tiene progresión.** Su crecimiento hacia la sabiduría —y con ella las colas hasta nueve— es un mecanismo de producto, no decoración.
- **"Acompañamiento" es el concepto de producto.** Aparece en mayúscula media como término de marca en el título, el eyebrow, las llamadas a la acción y los encabezados de las tres áreas.
- **No hay lema oficial obligatorio.** Cada superficie redacta su propia promesa. El lema del legacy, "Transforma tus hábitos, renueva tu vida", no se ha trasladado a la versión actual.

## Evidence on Hand

**No existe evidencia de validación externa, y no debe fabricarse.**

- Cero testimonios, cero recuentos de usuarios, cero notas de prensa, cero casos de éxito, cero premios. No hay testimonios inventados porque no hay ninguno.
- La franja de estadísticas de la landing muestra palabras de funcionalidad (`24/7`, `Chat`, `Citas`), no cifras. Esto es deliberado: la landing no afirma recuentos de usuarios, sesiones ni resultados.
- Los únicos números reales del producto son los recuentos de la plataforma en el panel de administración, y están detrás de autenticación.
- Todos los números visibles para un usuario son placeholder.
- **Activos reales disponibles**: tres versiones del logotipo (imagetipo con texto, isotipo solo, e ilustraciones del zorro), todas en PNG y WebP, en `frontend/public/brand/`. No hay fuentes vectoriales, favicon, manifest ni iconos de app.
- Mockups de escritorio de las cuatro áreas en `Mockups/` (Public, User, Psy, Admin). No hay mockups móviles.

## Product Principles

1. **Automatizar primero, escalar con criterio.** La persona no debe tener que decidir sola cuándo necesita ayuda. El producto pone la vía humana a la vista en el momento en que aporta, no antes.
2. **Ningún cliente es subordinado.** La superficie del usuario y la del psicólogo se construyen en paridad. La administración existe para operarlas, no para ser el producto.
3. **La mascota es mecanismo, no adorno.** El kitsune acompaña y hace progresar; su avance hacia las nueve colas es la forma en que el producto expresa el aprendizaje del usuario.
4. **No afirmar lo que no está.** Sin prueba social inventada, sin promesas sin respaldo y sin precios que se cobren mientras el modelo comercial no esté decidido. La honestidad del estado es parte del producto.
5. **El rol es explícito y funcional.** El rol de Kitsunova vive en los metadatos de la aplicación y es un concepto propio, nunca una lectura del campo de rol de Supabase.

## Accessibility & Inclusion

Objetivo declarado: **WCAG AA**.

- Contraste mínimo 4.5:1 para texto y 3:1 para interfaz.
- Áreas táctiles de al menos 44×44 px.
- Navegación por teclado con foco visible en todos los interactivos.
- HTML semántico, etiquetas adecuadas y soporte de lector de pantalla.
- `prefers-reduced-motion` desactiva animaciones.
- Requisito de producto adicional, más allá del estándar: la interfaz debe ser clara para personas no técnicas, los errores deben ser comprensibles y la navegación debe ser consistente entre las tres áreas.
