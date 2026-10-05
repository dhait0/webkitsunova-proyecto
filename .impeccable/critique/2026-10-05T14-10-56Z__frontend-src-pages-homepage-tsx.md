---
target: la pagina principal (landing)
total_score: 20
max_score: 32
na_heuristics: 10
p0_count: 2
p1_count: 3
target_identity: "file:/Users/keys/Documents/proyectos/webkitsunova_proyecto/frontend/src/pages/HomePage.tsx"
target_fingerprint: "sha256:392607b52c35dbed83142b6e29022957f5c465f7d05eeb3ee09a066e4719352c"
target_path: /Users/keys/Documents/proyectos/webkitsunova_proyecto/frontend/src/pages/HomePage.tsx
timestamp: 2026-10-05T14-10-56Z
slug: frontend-src-pages-homepage-tsx
---
# Crítica de diseño — landing pública de Kitsunova (`/`)

**Objetivo:** `frontend/src/pages/HomePage.tsx`
**Queja del usuario:** la organización de los objetos y su información no le gusta.

---

## Design Health Score

| # | Heurística | Puntuación | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | 2 | `useActiveSection` rastrea 4 ids, pero 2 de las 6 secciones no tienen id: nunca se activan. |
| 2 | Coincidencia sistema / mundo real | 2 | El copy está bien escrito, pero la pestaña "El registro" apunta a un formulario y `siteNavigation` apunta a 5 ids que no existen. |
| 3 | Control y libertad del usuario | 2 | El formulario tiene modo login/registro y no destructivo; no hay salida de la página, ni cierre con Esc del panel `#proceso-bajo`. |
| 4 | Consistencia y estándares | 2 | El sistema `.kb-*` es internamente coherente, pero conviven 6 secciones, 4 pestañas, dos listas de navegación en el mismo archivo de contenido y 5 cabeceras idénticas. |
| 5 | Prevención de errores | 3 | Labels envolviendo input, `autocomplete` correcto, `required`, `role=alert` en notas. Falta validación en línea y la regla de contraseña solo vive en el placeholder. |
| 6 | Reconocimiento sobre recuerdo | 2 | Todo es visible, pero el visitante tiene que deducir que "El recorrido" y "Aplicación móvil" existen. |
| 7 | Flexibilidad y eficiencia | 2 | Navegación por teclado íntegra y sin tabindex positivo. No hay "volver arriba" y el formulario empieza 451px por debajo del nav. |
| 8 | Estética y diseño minimalista | 2 | El hero mide 1504px con 570px de columna vacía y un h1 de 9 líneas. El valor de la derecha es la mitad del que existe. |
| 9 | Errores: reconocer, diagnosticar, recuperar | 3 | Errores en español llano con icono y `role=alert`, no borran el formulario. Sin asociación al campo ni guía de reintento. |
| 10 | Ayuda y documentación | n/a | Superficie Persuade: la explicación vive en el propio copy de la página, no hay espacio para docs. |
| **Total** | | **20/32** | **Aceptable (62%)** — el sistema es competente, la composición está rota. |

Máximo aplicable 32 porque la heurística 10 se puntuó n/a.

---

## Design Specificity Verdict

Especifica como sistema, vaga como producto. Los tokens `.kb-*`, la elevación de una sola sombra, el zorro con glow y la bitácora en hueso son decisiones propias de Kitsunova, no de una plantilla. Pero el andamiaje está poblado de contenido que se contradice: el hero promete "hábitos que se registran" y luego la página habla de "colas", "bitácora", "recorrido" y "acompañante" — cuatro metáforas para el mismo producto. `siteContent.ts` sigue exportando `aboutSection`, `landingFeatureCards`, `landingBenefitCards`, `landingStats`, `landingJourneySteps` y `landingSupportCards`, que no importa nadie. La página conserva la estructura de un diseño anterior rechazado.

**Escaneo determinista:** `impeccable detect` devuelve `[]` con exit 0 sobre la landing — limpio. El escaneo de `frontend/src` completo devuelve 6 hallazgos, todos en `global.css` (estilos de otras superficies), ninguno en `landing.css`.

**Superposición en navegador:** la inyección del overlay funcionó. El DOM reporta 10 anti-patrones: 3 `glowing shadow accents` sobre las colas cortadas (que es exactamente la regla "un solo glow" de DESIGN.md violada por el propio componente que la declara) y 5 `kicker / eyebrow label above heading` — una por cabecera de sección, el patrón repetido cinco veces. La advertencia de contraste `violet #7c6cff sobre hueso #f4f1ea = 3.42:1` la confirma la medición independiente.

---

## Overall Impression

Lo que funciona es el sistema: tokens consistentes, un solo acento, jerarquía tipográfica clara, formulario con estados honestos. Lo que falla es una sola decisión de CSS con consecuencias en cascada: `.kb-cover__type` tiene `max-width: 24ch` (`landing.css:383`), y `24ch` de Source Sans 3 a 16px mide **190.86px**. La columna de la derecha mide **762px**. El h1 a 56px se ve obligado a partirse en 9 líneas dentro de 191px, ocupa 544px de alto, y empuja el lede (10 líneas), el botón secundario y el zorro 1062px hacia abajo — fuera del pliegue en cualquier pantalla de 900px. Todo lo que el usuarioinputs "no está bien organizado" nace de ahí.

---

## Priority Issues

### [P0] La columna de texto del hero mide 191px dentro de un hueco de 762px
`.kb-cover__type { max-width: 24ch }` (landing.css:383). En 1440px: la columna de la derecha es `762px`, el bloque de texto `191px`, y sobran 571px. El h1 (56px, `wdth 84 wght 800`) se parte en 9 líneas con anchos de línea de 58px a 191px — un titular esculpido, no un titular leído. El lede hereda el mismo tope y se parte en 10 líneas. Entre y=1036 y y=1062 hay 26px; entre el lede y el botón hay un hueco que empuja todo hacia abajo.
- **Por qué importa:** el h1 es lo primero que se ve y es ilegible por composición, no por texto. La página pierde el mensaje en el primer viewport.
- **Fix:** quitar el `max-width: 24ch` de `.kb-cover__type` en desktop y darle un `max-width` en `ch` de la familia display (o 620px), reserving `24ch` solo para el lede. En el bloque de 1080px mantener el tope, que ahí sí funciona.

### [P0] La navegación describe 4 secciones y la página tiene 6
`fieldNav` = `registro`, `proceso`, `acompañante`, `que-obtienes`. `FieldStages` y `FieldApp` no tienen `id`. Dos secciones son inalcanzables y nunca se marcan activas. Además `siteNavigation` (importada por la rama no-field de `PublicHeader`) declara `inicio`, `sobre-nosotros`, `como-funciona`, `solucion`, `app` — ninguno existe en el DOM de esta página, y `PublicFooter` repite la lista muerta en su rama por defecto.
- **Por qué importa:** el contrato navegación↔sección está roto. El visitante no puede llegar a dos bloques por clic y no puede saber que existen.
- **Fix:** dar `id` a las dos secciones y añadirlas a `fieldNav`; eliminar `siteNavigation` y las ramas no-field de header y footer, o conectarlas de verdad.

### [P1] El zorro —el activo de marca que PRODUCT.md declara central— está debajo del pliegue
Está en `x=744, y=1062`, 430×430, en una columna stage de 1368px de alto. Con viewport de 900px, el mascot aparece a 1.18 pantallas de scroll, después de leer el titular entero y el lede. La composición además lo empuja a la derecha (744→1174) mientras el texto vive a 578→769: los dos bloques de la columna derecha no comparten eje.
- **Por qué importa:** la marca no llega. Y la ronda anterior de este diseño fue rechazada precisamente por perder al zorro detrás del formulario; hoy está debajo del formulario, que es otra forma de perderlo.
- **Fix:** con el `max-width` corregido, el texto ocupa 3 líneas y el zorro sube a la misma banda visual. Anclar el zorro al borde izquierdo de su columna (`margin-inline: 0`) para que comparte eje con el titular.

### [P1] La bitácora —el concepto central del producto— es el peor compuesto de la página
`.kb-record` es una grilla `96px 150px 860px` (1146px útiles), pero `.kb-record__note` tiene `max-width: 58ch` = 432px. Cada una de las 3 filas deja **428px de vacío a la derecha** dentro de una grilla que promete estructura. La línea que divide las filas es un hairline; el resultado es una tabla a la que le falta el tercio de sus columnas.
- **Por qué importa:** el momento clave del producto —"la anotación dice que esto ya no se resuelve solo"— se presenta en un formato que desaprovecha dos tercios de su ancho.
- **Fix:** o se reparte el ancho real (`minmax(0, 1fr)` con la nota sin tope artificial), o se reduce la grilla a `96px 150px 1fr` y se sube el tope de la nota a `68ch`, que es la medida declarada en DESIGN.md.

### [P1] La señal de escalamiento es invisible: 1.13:1
`.kb-record--escalated { border-left: 6px solid #e7e2ec }` sobre la tarjeta hueso `#f4f1ea`. Medido: **1.13:1**. El borde de 6px que marca el único momento en que aparece una persona es prácticamente indistinguible del fondo. DESIGN.md exige "marcar el estado de forma redundante: color más etiqueta más glifo más posición" — aquí la posición sí, el color no.
- **Por qué importa:** el diferenciador del producto es invisible en la única línea de la página donde ocurre.
- **Fix:** invertir el tratamiento: borde en `--kb-ink` a 2px más el glifo y la etiqueta ya presentes, o un relleno tenue (`rgba(124,108,255,0.12)`) en la fila.

### [P2] Contraste AA fallido en la etiqueta sobre la superficie hueso
`#7c6cff` sobre `#f4f1ea` = **3.42:1** en texto de 11px. Es la etiqueta "Ejemplo de una entrada", la primera palabra de la sección. El resto de la página pasa: `#565040` sobre hueso 7.11:1, `#a9b4e0` sobre panel 7.21:1, `#a99aff` sobre card 7.55:1, `#8f93b8` sobre card 6.06:1. La superficie hueso invierte la jerarquía de acento y nadie lo ajustó.
- **Fix:** en `.kb-card--light` usar `--kb-ink-soft` para `.kb-label`, o un violeta oscurecido (`#5741d6` da 5.9:1 sobre hueso).

### [P2] Cinco cabeceras de sección con el mismo patrón, ningún cambio de ritmo
Las 5 secciones repiten `794px | 320px` con `gap: 32px`, `padding-bottom: 22px` y un hairline de cierre. Alturas de sección: 623, 347, 479, 459, 798px. La sección de 347px es la más corta y es la única sin id. No hay contraste entre una sección densa y una ligera, ni una que rompa el patrón. La página se lee como cinco variaciones del mismo molde.
- **Fix:** dar a "El recorrido" la forma que le corresponde (tres etapas numeradas en fila, o integrada en la bitácora) y usar la varianza de altura para marcar el ritmo, no el corte uniforme.

### [P2] El panel `#proceso-bajo` está oculto, con un h3 del tamaño del h2 padre
`hidden` por defecto, con un `h3.kb-heading` de 38px idéntico al `h2` de sección (38px). Al abrirlo, la jerarquía no cambia: un h3 se ve como un h2. No hay cierre con Esc ni clic fuera. Además usa 2 estilos inline (`margin`, `color`) que el resto de la página no usa.
- **Fix:** `kb-subhead` (19px) para el h3, y un botón de cierre real o al menos `aria-expanded` sincronizado.

### [P3] Detalles
- `React does not recognize the fetchPriority prop` en consola en cada montaje, desde `FoxFigure.tsx:10`. React 18 no acepta `fetchPriority` en JSX.
- `celulares.webp` declara `width={3000} height={2800}`; el natural es 1600×1493 y se renderiza a 520×485. Atributos de relación de aspecto equivocados.
- 6 exports muertos en `siteContent.ts` (`aboutSection`, `landingFeatureCards`, `landingBenefitCards`, `landingStats`, `landingJourneySteps`, `landingSupportCards`).
- El detector marca `glowing shadow accents` en las 3 colas cortadas: contradice la regla "un solo glow" del propio DESIGN.md.

---

## Persona Red Flags

**Jordan (primera vez)** — las 4 pestañas prometen un recorrido de 4 pasos y la página tiene 6 secciones. Scrollea, ve "Tres etapas, y solo una es automática" sin ningún indicador de dónde está, no tiene forma de volver arriba y no sabe si se perdió una sección. El hero le pide 9 líneas de titular para entender la oferta. La primera decisión real —"¿esto es una app de hábitos o un consultorio?"— se responde recién en la sección 5.

**Casey (móvil, una mano)** — el documento mide 6569px: 7.8 pantallas. El hero solo son 1765px, y el formulario de registro está a y=1056, debajo de la imagen del zorro de 900px: tiene que pasar todo el hero para llegar al campo de correo. El formulario completo pide 4 campos más 2 OAuth antes de cualquier feedback de valor. El store section es la última, con dos botones `disabled` como recompensa final.

**Sam (teclado y lector de pantalla)** — el skip link existe (`a.kb-skip`, "Ir al registro") y es el primer elemento enfocable: funciona. Pero apunta al formulario, saltándose el titular. El orden de encabezados en el documento empieza en `h2#registro-titulo` y luego `h1#portada-titulo`; hay un salto h2→h3 dentro de `#proceso-bajo`. El glifo del `kb-record__tab` es un SVG con `aria-hidden` y el texto "Persona disponible el 09 abr" sí se anuncia, bien. El único fallo duro: la fila de escalamiento no es identificable por ningún lector de pantalla más allá de su posición, porque la señal visual es 1.13:1 y no hay texto que diga "esta fila cambió de estado" fuera del glifo.

---

## Minor Observations

- `align-items: center` en `.kb-cover` es lo que deja 383px de aire sobre el formulario y 320px debajo: el formulario flota en el centro vertical en vez de alinearse al titular.
- El `h2` del formulario de registro es 20px mientras todos los h2 de sección son 38px: el formulario compite con las secciones y pierde, pero la jerarquía visual no lo explica.
- Las 3 columnas de "El recorrido" tienen `gap: 0` con bordes hairline; la primera y la última llevan padding distinto para cuadrar los bordes. Funciona, pero es un detalle que se rompe con cualquier cambio de texto.
- Las 9 colas miden 55×52px y no tienen relación de aspecto 1:1; se leen como celdas, no como colas.
- `kb-alt` ("o") es un separador de 12px con `text-transform: uppercase`; un separador no debería ir en caja alta.
- El lede de cada sección es de 320px con altura variable (48px a 120px), lo que hace que la línea de cierre de cada cabecera caiga en un y distinto: el patrón se percibe pero no se alinea.
