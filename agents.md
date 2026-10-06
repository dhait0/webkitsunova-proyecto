# AGENTS.md — WebKitsunova

## Propósito de este archivo

Este archivo define cómo los agentes de IA deben trabajar dentro de WebKitsunova.

Debe utilizarse como contexto arquitectónico y conjunto de reglas permanentes del proyecto.

No utilizar este archivo como backlog, historial de cambios ni documentación exhaustiva.

El objetivo es que cualquier agente pueda comprender rápidamente:

- qué es Kitsunova
- qué arquitectura se busca
- qué restricciones existen
- cómo investigar el proyecto
- cómo realizar cambios pequeños sin analizar innecesariamente todo el repositorio
- qué estándares técnicos debe preservar
- cómo trabajar con Git y GitHub sin alterar ramas remotas innecesariamente

---

# 1. Objetivo del proyecto

WebKitsunova es la reconstrucción y modernización de una aplicación web existente.

Existe una implementación anterior dentro de:

```text
/proyecto viejo
```

La aplicación antigua fue desarrollada con tecnologías legacy como PHP, HTML, JavaScript y otras herramientas anteriores.

El proyecto nuevo NO debe copiar su arquitectura técnica.

El proyecto antiguo debe utilizarse principalmente como:

- referencia funcional
- referencia de flujos
- referencia de pantallas
- referencia de reglas de negocio
- referencia para descubrir funcionalidades todavía no documentadas

La nueva aplicación debe reinterpretar y mejorar esos comportamientos utilizando una arquitectura moderna.

---

# 2. Contexto funcional

Kitsunova es una plataforma orientada al bienestar y hábitos de vida.

La funcionalidad exacta debe verificarse contra `/proyecto viejo` cuando sea necesario porque el responsable técnico actual no diseñó originalmente el producto.

A nivel general se conocen los siguientes dominios.

## Sitio público

Página pública de Kitsunova con información sobre:

- plataforma
- bienestar
- hábitos
- servicios
- profesionales
- contenido relacionado

## Aplicación de usuarios

Los usuarios pueden tener funcionalidades relacionadas con:

- seguimiento de hábitos
- bienestar personal
- progreso
- recursos y ayudas
- interacción con psicólogos
- talleres
- mensajes
- contenido de apoyo
- otras funcionalidades existentes en el proyecto legacy

## Aplicación de psicólogos

Debe existir una experiencia específica para profesionales o psicólogos.

Sus capacidades deben descubrirse y documentarse progresivamente a partir del proyecto legacy y de los requisitos del proyecto.

## Administración

Debe existir un área administrativa para gestionar elementos globales de la plataforma.

---

# 3. Fuente funcional de verdad

Cuando una funcionalidad no esté suficientemente documentada:

1. Revisar primero la implementación moderna existente.
2. Revisar documentación disponible.
3. Consultar `/proyecto viejo` únicamente para comprender el comportamiento funcional.
4. No copiar automáticamente código ni arquitectura legacy.
5. Implementar el comportamiento mediante patrones modernos.

El proyecto viejo responde principalmente:

> ¿Qué hacía Kitsunova?

El proyecto moderno debe responder:

> ¿Cuál es la mejor forma actual de implementar ese comportamiento?

---

# 4. Objetivo técnico

Este proyecto también tiene como objetivo servir como un proyecto full-stack sólido de portafolio y experiencia profesional.

Priorizar:

- arquitectura mantenible
- TypeScript
- seguridad
- accesibilidad
- testing
- CI/CD
- diseño consistente
- observabilidad
- buenas prácticas de Git
- automatización
- documentación útil
- uso responsable de IA
- experiencia real de despliegue

Evitar complejidad empresarial innecesaria.

No agregar tecnologías únicamente para hacer parecer el proyecto más avanzado.

Cada herramienta nueva debe resolver un problema concreto.

---

# 5. Arquitectura objetivo

La aplicación debe evolucionar hacia una arquitectura full-stack unificada.

Evitar mantener frontend y backend como aplicaciones completamente independientes si no existe una razón técnica real.

La arquitectura preferida es:

```text
WebKitsunova
│
├── aplicación web full-stack
├── API / lógica de servidor
├── autenticación
├── acceso a datos
└── frontend
        ↓
   un único proyecto
        ↓
      Vercel
```

El objetivo es disponer de:

```text
1 repositorio
1 aplicación
1 pipeline
1 despliegue de Vercel
```

---

# 6. Stack objetivo

Preferir tecnologías modernas compatibles entre sí.

Stack principal esperado:

- TypeScript
- React
- Next.js
- Supabase Auth
- PostgreSQL mediante Supabase
- Prisma ORM cuando aporte valor para acceso a datos y migraciones
- Zod para validación
- GitHub Actions para CI/CD
- Vercel para aplicación y funciones de servidor
- Supabase para base de datos y autenticación

No introducir un backend Express independiente si la funcionalidad puede implementarse adecuadamente mediante la arquitectura full-stack de Next.js.

Si todavía existen partes de Express durante la migración, evitar expandir esa arquitectura innecesariamente.

---

# 7. Estructura deseada

Preferir una estructura aproximadamente similar a:

```text
/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── admin/
│   ├── user/
│   ├── psychologist/
│   └── api/
├── components/
├── features/
│   ├── auth/
│   ├── habits/
│   ├── psychologists/
│   ├── messaging/
│   ├── workshops/
│   └── ...
├── lib/
│   ├── auth/
│   ├── db/
│   ├── supabase/
│   └── validation/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
├── public/
├── proyecto viejo/
├── .github/
│   └── workflows/
├── .kilo/
│   └── skills/
│       └── soft-ui-guardian/
├── AGENTS.md
├── DESIGN.md
└── package.json
```

Esta estructura es orientativa.

No reorganizar todo el repositorio únicamente para coincidir exactamente con este ejemplo.

Migrar progresivamente cuando exista una razón técnica.

---

# 8. Organización por dominio

Preferir organización por funcionalidad o dominio cuando ayude a mantener relacionado el código que cambia junto.

Ejemplo:

```text
features/
  habits/
    components/
    queries/
    actions/
    schemas/
    types/
```

Evitar carpetas globales gigantescas donde todos los componentes, hooks o servicios de toda la aplicación queden mezclados.

---

# 9. Separación de responsabilidades

Mantener separación clara entre:

```text
UI
↓
lógica de aplicación
↓
validación
↓
acceso a datos
↓
base de datos
```

Los componentes visuales no deben contener lógica de negocio compleja.

Las consultas de base de datos no deben distribuirse arbitrariamente por componentes.

La validación importante debe existir también en servidor.

Nunca confiar únicamente en validaciones del frontend.

---

# 10. Base de datos

La base de datos de producción debe utilizar PostgreSQL mediante Supabase.

Prisma puede utilizarse como:

- ORM
- definición del modelo
- generación de tipos
- sistema de migraciones

Si Prisma es utilizado, su esquema será una fuente principal de verdad:

```text
prisma/schema.prisma
```

Los cambios estructurales deben generarse mediante migraciones.

Evitar utilizar:

```text
prisma db push
```

como mecanismo normal para modificar producción.

Para producción utilizar migraciones versionadas.

---

# 11. Migraciones

Toda modificación estructural de base de datos debe:

1. tener una migración versionada
2. quedar registrada en Git
3. pasar las validaciones automatizadas
4. ejecutarse mediante CI/CD
5. evitar cambios destructivos sin estrategia de transición

Preferir migraciones compatibles hacia atrás.

Cuando una migración pueda romper compatibilidad, utilizar una estrategia gradual:

```text
añadir nueva estructura
↓
desplegar código compatible
↓
migrar datos
↓
verificar
↓
eliminar estructura antigua posteriormente
```

Las migraciones de producción deben ejecutarse únicamente después de superar las validaciones del pipeline.

Debido a que el proyecto usa Supabase PostgreSQL, las migraciones se ejecutan mediante Supabase CLI antes de cada deploy:

```text
npm run release
```

Este script ejecuta en orden:
1. `supabase db push` — aplica migraciones contra la base de producción
2. `typecheck` — valida TypeScript
3. `test` — ejecuta tests
4. `vercel --prod` — despliega a producción

Antes de ejecutar `npm run release`, asegurarse de que el `.env` local tenga:
- `DATABASE_URL` apuntando al pooler de Supabase (puerto 6543)

Las migraciones residen en `supabase/migrations/` y se versionan con Supabase CLI.

Para aplicar migraciones manualmente sin deploy:
```text
npm run supabase:deploy
```

---

# 12. CI/CD

GitHub Actions es la plataforma principal de integración continua.

No utilizar Jenkins como pipeline principal para este proyecto salvo necesidad futura explícita.

Los workflows deben vivir en:

```text
.github/workflows/
```

---

# 13. Pipeline obligatorio

Los cambios dirigidos a producción deben atravesar un pipeline automatizado.

Como mínimo:

```text
checkout
↓
install
↓
lint
↓
typecheck
↓
unit tests
↓
integration tests
↓
build
↓
database migration validation
↓
deployment
```

Ningún despliegue de producción debe realizarse si alguno de estos pasos falla.

---

# 14. Estrategia de Git y ramas

La prioridad es trabajar localmente y evitar operaciones remotas innecesarias.

Usar en la mayor medida posible las ramas locales para desarrollar, integrar y validar cambios.

## Flujo preferido

```text
rama de trabajo local
↓
desarrollo
↓
validaciones locales
↓
merge local a staging cuando el usuario lo solicite
↓
validaciones completas en staging local
↓
el usuario realiza push a origin/staging
↓
Pull Request desde GitHub
↓
GitHub Actions
↓
revisión
↓
merge según corresponda
```

## Reglas obligatorias

- No hacer `push` automáticamente a ninguna rama remota.
- No hacer `git push origin staging` salvo solicitud explícita del usuario.
- No hacer merge a `main` automáticamente.
- No crear Pull Requests automáticamente salvo solicitud explícita del usuario.
- No modificar ramas remotas como primera estrategia.
- Preferir ramas locales para probar integraciones.
- Cuando el usuario solicite integrar cambios, hacer primero el merge a la rama local `staging`.
- Después del merge local a `staging`, ejecutar las validaciones necesarias antes de considerar el trabajo listo.
- El usuario será quien normalmente realice el push de `staging` al remoto.
- El usuario será quien normalmente cree el Pull Request desde GitHub.
- No asumir que porque una rama local está correcta debe publicarse automáticamente.

## Regla de conflictos en merge

Cuando un merge contra la rama objetivo (por ejemplo `staging`) produce conflictos:

- Conservar los cambios en lo más posible: ningún cambio válido se elimina por
  tener un conflicto.
- Resolver combinando: el resultado debe integrar ambas versiones, no elegir una
  y descartar la otra.
- Si dos implementaciones hacen lo mismo, quedarse con la más completa y mejorada,
  y preservar lo útil de la descartada (lógica, copys, tests, accesibilidad).
- Mejorar siempre, eliminar nunca: ante la duda, sumar en lugar de quitar.
- Registrar en el mensaje del commit qué conflictos hubo y cómo se resolvieron.

---

# 15. Rama staging

`staging` es la rama local de integración previa al Pull Request.

Antes de hacer merge a `staging`:

1. comprobar el estado del repositorio
2. verificar la rama actual
3. revisar cambios pendientes
4. evitar incluir archivos no relacionados
5. ejecutar las pruebas relevantes de la rama de trabajo

Cuando el usuario solicite el merge a `staging`:

1. guardar o confirmar los cambios necesarios
2. cambiar a la rama local `staging`
3. actualizarla localmente solo si es necesario y seguro
4. hacer el merge de la rama de trabajo
5. resolver conflictos combinando ambas versiones (ver "Regla de conflictos en merge": conservar, mejorar, nunca eliminar)
6. ejecutar validaciones completas
7. informar el resultado al usuario
8. NO hacer push automáticamente

Validaciones recomendadas en `staging` local:

```text
lint
typecheck
tests
build
migration checks
```

Añadir pruebas específicas cuando el cambio lo requiera.

---

# 16. Uso de GitHub y gh CLI

El repositorio dispone de la herramienta `gh`.

No utilizar GitHub como mecanismo principal de investigación durante el desarrollo local.

Priorizar primero:

- repositorio local
- historial local de Git
- ramas locales
- tests locales
- logs locales
- configuración local
- documentación del repositorio

Utilizar `gh` cuando aporte valor real.

## Casos apropiados

- el usuario solicita explícitamente revisar GitHub
- falla un Pull Request
- falla GitHub Actions
- se necesita inspeccionar un workflow remoto
- se necesita revisar logs de una ejecución de Actions
- se necesita comprobar el estado de checks de un PR
- se necesita inspeccionar una diferencia que solo existe en remoto
- el usuario solicita crear, revisar o gestionar un Pull Request

## Casos que no justifican usar GitHub

No consultar GitHub para:

- localizar código que ya existe localmente
- revisar archivos que ya existen en el repositorio local
- sustituir pruebas que pueden ejecutarse localmente
- comprobar ramas locales
- realizar cambios pequeños
- investigar arquitectura que ya está disponible localmente

## Cuando falle un Pull Request o GitHub Actions

Usar `gh` para inspeccionar el fallo antes de modificar código.

Ejemplos de comandos permitidos cuando sean necesarios:

```sh
gh pr checks
gh pr view
gh run list
gh run view
gh run view --log-failed
```

Analizar primero el error reportado.

No cambiar código al azar para intentar hacer pasar CI.

---

# 17. Pull Requests

Preferir el flujo:

```text
feature branch local
↓
validaciones locales
↓
merge local a staging cuando se solicite
↓
validaciones locales de staging
↓
push manual de staging por el usuario
↓
Pull Request
↓
GitHub Actions
↓
checks
↓
merge
```

Evitar desarrollar directamente sobre `main`.

Las Pull Requests deben permitir detectar problemas antes de modificar producción.

---

# 18. Preview Deployments

Cuando sea posible utilizar Vercel Preview Deployments para Pull Requests.

Flujo deseado:

```text
Pull Request
↓
tests
↓
build
↓
preview deployment
↓
revisión
↓
merge
↓
production deployment
```

Las Preview Deployments no deben ejecutar migraciones destructivas contra la base de datos de producción.

---

# 19. Producción

La rama principal de producción debe ser:

```text
main
```

Un merge a `main` debe iniciar el pipeline de producción.

Antes de desplegar:

- lint debe pasar
- TypeScript debe pasar
- tests deben pasar
- build debe pasar
- migraciones deben poder aplicarse correctamente

Después de superar las validaciones, el workflow puede:

1. aplicar las migraciones correspondientes
2. desplegar la aplicación
3. ejecutar smoke tests básicos

Si una migración requiere coordinación especial con el código, utilizar una estrategia compatible hacia atrás en lugar de asumir que una operación destructiva es segura.

---

# 20. Vercel

La aplicación debe poder desplegarse como un único proyecto de Vercel.

Evitar mantener:

```text
frontend deployment
+
backend deployment
```

como proyectos independientes sin necesidad.

Las APIs y lógica del servidor deben formar parte del mismo proyecto full-stack cuando sea viable.

Utilizar variables de entorno para configuración específica de cada ambiente.

---

# 21. Supabase

Supabase será utilizado principalmente para:

- PostgreSQL
- autenticación
- capacidades adicionales cuando aporten valor real

El frontend nunca debe recibir credenciales privilegiadas.

Claves administrativas o service role deben permanecer exclusivamente en entornos de servidor.

---

# 22. Autenticación

Supabase Auth es el proveedor principal de autenticación.

Los roles de aplicación deben obtenerse desde metadata o desde el modelo de autorización definido por el proyecto.

No confundir:

```text
rol de autenticación de Supabase
```

con:

```text
rol funcional dentro de Kitsunova
```

Ejemplos funcionales:

```text
USER
PSYCHOLOGIST
ADMIN
```

Cualquier cambio relacionado con:

- login
- sesiones
- JWT
- roles
- permisos
- MFA
- recuperación de contraseña

debe tratarse como cambio sensible.

---

# 23. Seguridad

Nunca versionar:

- contraseñas
- service role keys
- JWT secrets
- claves privadas
- tokens
- DATABASE_URL reales con credenciales
- secretos de Vercel
- secretos de Supabase

Utilizar:

```text
.env.local
```

para desarrollo y secretos administrados por las plataformas para CI/CD y producción.

GitHub Actions debe utilizar GitHub Secrets.

---

# 24. Validación

Utilizar Zod o mecanismos equivalentes para validar datos no confiables.

Validar especialmente:

- request bodies
- parámetros
- formularios
- variables de entorno
- respuestas externas cuando corresponda

No asumir que el frontend envía información válida.

---

# 25. Testing

Las funcionalidades importantes deben poder probarse.

Prioridad:

1. lógica de negocio
2. autenticación y autorización
3. operaciones críticas de base de datos
4. APIs
5. flujos principales del usuario

No perseguir cobertura del 100% únicamente como métrica.

Priorizar pruebas útiles.

---

# 26. Tipado

Evitar:

```ts
any
```

salvo que exista una razón concreta.

Preferir:

- tipos derivados
- schemas Zod
- tipos de Prisma
- tipos generados
- interfaces específicas

No duplicar manualmente tipos que puedan derivarse de una única fuente.

---

# 27. Diseño

El diseño visual debe seguir:

```text
DESIGN.md
```

Ese documento es la fuente de verdad visual.

`DESIGN.md` se escribe desde el mundo ya construido, no antes: si una regla del documento no
existe en el código, es una regla que nadie implementó. `DESIGN_SYSTEM.md` fue retirado por
documentar un mundo neumórfico que nunca existió en el producto original.

Mantener:

- consistencia
- accesibilidad
- responsive design
- jerarquía visual
- componentes reutilizables
- estados de carga
- estados vacíos
- estados de error
- feedback de interacción

No cambiar lógica de negocio cuando la solicitud sea exclusivamente visual.

---

## 27.1. Skill de gobierno visual: `soft-ui-guardian`

El proyecto dispone de una skill especializada para gobernar la calidad visual, responsive,
accesibilidad y motion de las interfaces:

```text
.kilo/skills/soft-ui-guardian/
```

Su función es actuar como guardián del sistema de diseño y no como una fuente visual paralela.

### Fuente de verdad

Antes de crear, modificar, refactorizar o auditar una vista, el agente debe:

1. Leer este `AGENTS.md` para comprender las reglas generales del proyecto.
2. Leer `DESIGN.md` en la raíz del repositorio.
3. Aplicar la skill `soft-ui-guardian` para ejecutar y validar esas reglas.
4. Revisar los componentes y patrones existentes antes de crear variantes nuevas.

La prioridad es:

```text
AGENTS.md
    ↓
DESIGN.md
    ↓
soft-ui-guardian
    ↓
implementación existente y componentes reutilizables
```

`soft-ui-guardian` no sustituye `DESIGN.md`.

La skill debe convertir las reglas documentadas en decisiones de implementación, revisión y QA.
No debe inventar un segundo sistema de diseño.

### Ámbito

Aplicar `soft-ui-guardian` cuando una tarea afecte uno o más de estos aspectos:

- layout
- responsive design
- mobile
- componentes visuales
- formularios
- tablas
- cards
- modales
- drawers
- navegación
- sidebars
- toolbars
- tabs
- estados visuales
- feedback de interacción
- focus
- accesibilidad visual
- animaciones
- microinteracciones
- Framer Motion
- loading states
- empty states
- error states
- consistencia visual entre pantallas

También debe utilizarse al auditar una pantalla existente aunque la solicitud sea únicamente
"mejorar la vista", "hacerla responsive", "pulir UI/UX" o equivalente.

### Mobile first

La aplicación debe diseñarse y revisarse con prioridad móvil.

La validación visual no debe limitarse a escritorio.

Como mínimo, cuando el cambio lo justifique, revisar:

```text
mobile estrecho
mobile estándar
tablet
portátil
desktop
```

La skill debe detectar y evitar especialmente:

- overflow horizontal
- textos cortados
- controles fuera del viewport
- tablas imposibles de operar en móvil
- acciones que no puedan envolver correctamente
- modales más altos o anchos que la pantalla
- targets táctiles demasiado pequeños
- layouts dependientes de anchos rígidos
- sidebars que desplacen o oculten contenido incorrectamente
- cambios de layout que produzcan saltos innecesarios

No crear breakpoints arbitrarios si ya existe una regla específica para esa superficie en `DESIGN.md`
o en los estilos existentes.

### Motion y Framer Motion

Framer Motion es la herramienta principal para animaciones complejas o con estado.

Las animaciones deben comunicar:

- entrada o salida
- cambio de estado
- jerarquía
- continuidad espacial
- feedback de interacción

No añadir movimiento únicamente como decoración.

Mantener como principios:

- transiciones explícitas
- feedback `:active` o press
- animaciones interrumpibles
- entrada y salida coherentes
- evitar animar propiedades costosas cuando `transform` y `opacity` resuelvan el efecto
- evitar layout shift innecesario
- respetar `prefers-reduced-motion`
- utilizar `useReducedMotion()` cuando corresponda en Framer Motion
- conservar navegación por teclado y focus durante animaciones

Como guía general, salvo regla más específica en `DESIGN.md`:

```text
microinteracción     120–180 ms
UI estándar          180–250 ms
modal / drawer       220–320 ms
transición amplia    250–400 ms
```

No crear un timing diferente en cada componente sin una razón funcional.

### Filosofía Emil design engineering

La skill debe convivir con las reglas o skills de Emil design engineering disponibles en el proyecto.

Cuando ambas apliquen:

```text
DESIGN.md
    ↓
soft-ui-guardian
    ↓
Emil design engineering para refinamiento de interacción y motion
```

Emil puede mejorar la calidad de interacción y microanimación, pero no debe:

- cambiar la identidad visual definida en `DESIGN.md`
- crear tokens paralelos
- introducir nuevos colores arbitrariamente
- romper breakpoints existentes
- sustituir componentes reutilizables sin necesidad
- sacrificar accesibilidad por animación

### Reutilización de componentes

Antes de crear un componente visual nuevo:

1. Buscar una implementación existente.
2. Revisar variantes del mismo componente.
3. Preferir extender mediante props, variants o composición.
4. Crear un componente nuevo solo cuando represente una abstracción realmente distinta.

En superficies administrativas, revisar primero componentes propios como:

```text
AdminModal
AdminSelect
componentes admin existentes
```

Seguir el patrón del proyecto basado en:

```text
Tailwind CSS
class-variance-authority
clsx
tailwind-merge
```

No introducir Material UI, Radix UI directo u otra librería de componentes únicamente para resolver
una necesidad que el sistema existente pueda cubrir.

### Estados obligatorios

Cuando correspondan al componente, verificar:

```text
default
hover
focus-visible
active / pressed
disabled
loading
success
error
empty
selected
expanded / collapsed
```

Los estados importantes no deben depender exclusivamente del color.

### Focus y teclado

Mantener focus visible y consistente.

El cyan definido por el sistema visual debe utilizarse donde `DESIGN.md` lo establezca.

Los modales y overlays interactivos deben:

- mover el focus de forma predecible
- mantener focus trap cuando corresponda
- permitir cierre mediante teclado si el patrón lo requiere
- devolver el focus al trigger al cerrarse
- evitar pérdida de focus durante animaciones de salida

### QA visual obligatorio

Antes de dar por terminada una modificación visual relevante, la skill debe revisar:

```text
[ ] identidad visual correcta
[ ] superficie visual correcta
[ ] componente reutilizado cuando corresponde
[ ] mobile first
[ ] sin overflow horizontal
[ ] responsive en anchos relevantes
[ ] tipografía y spacing coherentes
[ ] estados interactivos completos
[ ] focus visible
[ ] navegación por teclado
[ ] reduced motion
[ ] animaciones consistentes
[ ] sin layout shift innecesario
[ ] loading / empty / error cuando corresponda
[ ] sin estilos duplicados innecesarios
[ ] sin modificar lógica de negocio accidentalmente
```

### Actualización de `DESIGN.md`

`DESIGN.md` es documentación viva del sistema ya implementado.

Actualizarlo solamente cuando el cambio establezca una decisión reutilizable y permanente, por ejemplo:

- nuevo token
- nuevo patrón de componente
- nuevo comportamiento responsive
- nueva regla de motion
- nuevo breakpoint deliberado
- nueva variante visual estable
- cambio de jerarquía tipográfica
- nueva convención de focus o accesibilidad

No actualizar `DESIGN.md` por:

- un fix CSS puntual
- una excepción de una sola pantalla
- un parche temporal
- una decisión todavía no implementada
- experimentos descartables

Primero implementar y validar.

Después documentar la regla estable en `DESIGN.md`.

### Regla de superficie

No trasladar automáticamente una identidad visual de una superficie a otra.

La landing pública, autenticación, aplicación de usuario, aplicación de psicólogos y administración
pueden tener reglas específicas.

Cuando `DESIGN.md` defina reglas particulares para una superficie, esas reglas tienen prioridad sobre
cualquier estilo genérico de Soft UI.

---

---

# 28. Accesibilidad

Las interfaces deben considerar:

- navegación por teclado
- focus visible
- labels apropiados
- HTML semántico
- contraste suficiente
- reduced motion cuando corresponda
- lectores de pantalla

No sacrificar accesibilidad por estética.

---

# 29. Uso del proyecto legacy

`/proyecto viejo` debe considerarse READ-ONLY salvo solicitud explícita.

No modificarlo como parte del desarrollo normal.

Cuando se investigue una funcionalidad allí:

1. identificar comportamiento
2. identificar reglas de negocio
3. identificar datos involucrados
4. documentar descubrimientos relevantes
5. implementar una solución moderna independientemente

No copiar vulnerabilidades, deuda técnica o patrones obsoletos.

---

# 30. Uso de IA en el proyecto

El uso de IA está permitido y se considera una herramienta de desarrollo.

La IA debe utilizarse para aumentar:

- productividad
- calidad
- análisis
- documentación
- testing
- revisión
- aprendizaje

No debe utilizarse como sustituto de validación técnica.

Código generado por IA debe tratarse igual que código escrito manualmente:

```text
entender
↓
revisar
↓
probar
↓
validar
↓
integrar
```

No agregar código que el responsable técnico no pueda explicar razonablemente.

---

# 31. Regla de cambio mínimo

Para solicitudes pequeñas:

1. empezar por el archivo mencionado
2. revisar únicamente contexto directamente relacionado
3. utilizar búsqueda exacta o indexación semántica
4. revisar dependencias directas cuando sea necesario
5. modificar el menor número posible de archivos
6. validar el cambio
7. detenerse

No convertir una modificación pequeña en un análisis completo del proyecto.

---

# 32. Presupuesto inicial de investigación

Para una tarea localizada:

Comenzar normalmente con aproximadamente:

```text
1-3 archivos relevantes
```

Ampliar el análisis solamente cuando exista evidencia de que el cambio afecta más componentes.

No recorrer recursivamente todo el repositorio como primera acción.

---

# 33. Estrategia de búsqueda

Utilizar este orden:

```text
1. archivo indicado por el usuario
2. símbolo exacto
3. búsqueda semántica del codebase
4. imports y consumidores directos
5. documentación
6. búsqueda más amplia
7. proyecto legacy, cuando sea necesaria referencia funcional
```

No comenzar inspeccionando todo el repositorio.

---

# 34. Cambios arquitectónicos

Si el cambio afecta:

- autenticación
- autorización
- esquema de base de datos
- múltiples dominios
- infraestructura
- CI/CD
- contratos de API
- arquitectura global

entonces sí debe ampliarse el análisis antes de modificar código.

---

# 35. No realizar trabajo no solicitado

No aprovechar una tarea para:

- refactorizar módulos no relacionados
- renombrar archivos arbitrariamente
- cambiar librerías
- modificar diseño completo
- reorganizar carpetas
- actualizar dependencias importantes

salvo que sea necesario para completar correctamente la tarea.

Puede sugerirse por separado.

---

# 36. Dependencias

Antes de instalar una librería nueva:

1. comprobar si el proyecto ya resuelve el problema
2. comprobar si existe una API nativa adecuada
3. evaluar mantenimiento
4. evaluar peso
5. evaluar seguridad
6. evaluar compatibilidad

No instalar paquetes para resolver problemas triviales.

---

# 37. Documentación

Documentar principalmente:

- decisiones arquitectónicas
- flujos complejos
- comportamiento no evidente
- configuración crítica
- procedimientos operativos
- decisiones que evitarán futuras investigaciones

Evitar comentarios que simplemente describan literalmente el código.

---

# 38. Memoria técnica

La información arquitectónica descubierta que probablemente vuelva a ser útil debe registrarse en:

```text
docs/PROJECT_MEMORY.md
```

Ejemplos:

```text
flujo de autenticación
flujo de creación de hábitos
relación psicólogo-paciente
servicio responsable de mensajería
decisiones de base de datos
causa de bugs importantes
```

No utilizar `AGENTS.md` como historial de descubrimientos.

---

# 39. Antes de modificar código

Preguntarse:

1. ¿Cuál es exactamente la solicitud?
2. ¿Qué archivo o dominio parece responsable?
3. ¿Existe ya una implementación reutilizable?
4. ¿Puedo resolverlo localmente?
5. ¿Estoy cambiando comportamiento público?
6. ¿Afecta datos o autenticación?
7. ¿Necesito consultar el proyecto legacy?
8. ¿Cómo validaré el cambio?

---

# 40. Antes de terminar una tarea

Verificar según corresponda:

- TypeScript
- lint
- tests relevantes
- validación de schema
- build localizado o completo cuando corresponda
- comportamiento esperado
- ausencia de cambios no relacionados

No ejecutar tareas costosas innecesariamente para modificaciones triviales.

---

# 41. Principio principal

La prioridad del proyecto es:

> construir una aplicación moderna, mantenible, segura y comprensible que preserve y mejore la funcionalidad útil de Kitsunova sin heredar innecesariamente la arquitectura legacy.

Cuando existan varias soluciones técnicamente correctas, preferir:

```text
simple
+
mantenible
+
tipada
+
probable
+
segura
+
comprensible
```

sobre una solución más compleja únicamente por parecer más avanzada.
