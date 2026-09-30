# Plan: Reorganización de la página principal

## Objetivo

Reordenar la landing de arriba hacia abajo para que la información se lea en un
orden lógico, y arreglar la navegación de escritorio, que hoy no existe.

## Diagnóstico previo

Dos defectos concretos, ambos verificados en el código:

1. **La navegación de escritorio no existe.** `PublicHeader.tsx:38` renderiza
   `.main-nav-links` únicamente dentro de `{menuOpen && ...}`. Como
   `.mobile-menu-toggle` se oculta por encima de 640px, en escritorio no hay
   ningún enlace de navegación.
2. **Los enlaces apuntan a anclas inexistentes.** `#como-funciona`,
   `#solucion`, `#beneficios`, `#app`, `#registro` no corresponden a ningún
   `id` del documento. El único `id` real es `inicio` (`HomePage.tsx:15`).

Además hay redundancia de contenido: dos rejillas `FeatureCards` seguidas y
`landingSupportCards` renderizado dentro del hero, que compiten por la atención.

## Orden de secciones aprobado

| # | Bloque | `id` ancla | Origen |
|---|--------|-----------|--------|
| 0 | Cortina de bienvenida | — | Nuevo |
| 1 | Hero (enfoque + registro) | `inicio` | `HomePage.tsx` |
| 2 | Sobre nosotros | `nosotros` | Nuevo |
| 3 | Cómo funciona (3 pasos) | `como-funciona` | `JourneySection` |
| 4 | Funcionalidades | `solucion` | `FeatureCards variant="feature"` |
| 5 | Beneficios | `beneficios` | `FeatureCards variant="benefit"` |
| 6 | App móvil | `app` | `MobileAppSection` |
| 7 | CTA final | `contacto` | `SupportCTA` |
| 8 | Footer | — | `PublicFooter` |

Las anclas del header se renombran para que coincidan con estos `id`.

---

## Fase 1 — Cortina de bienvenida

Componente nuevo `Preloader.tsx` en `components/landing/`.

- Overlay a pantalla completa sobre `position: fixed`, por encima del header.
- Secuencia: logo isotipo con pulso, barra de progreso, se desvanece.
- Se desmonta al terminar y **libera el scroll** (`document.body` sin `overflow: hidden`).
- Se respeta `prefers-reduced-motion`: si está activo, se salta directo al hero.
- Duración objetivo: 1.2 s como máximo. Nunca bloquea la lectura del contenido.

## Fase 2 — Navegación de escritorio

Reescritura de `PublicHeader.tsx`.

- Enlaces visibles siempre en escritorio; el bloque del menú hamburguesa solo
  se monta en móvil.
- Sticky: `position: sticky; top: 0` con fondo translúcido y `backdrop-filter`,
  siguiendo el patrón que ya define `.main-navbar`.
- Enlaces: Inicio · Sobre nosotros · Cómo funciona · Solución · App.
- Botón primary "Crear cuenta" a la derecha, siempre visible.
- Resaltado de la sección activa al hacer scroll, vía `IntersectionObserver`
  (hook nuevo `useActiveSection`). El `active` fijo actual pasa a ser dinámico.
- Móvil: se conserva el hamburguesa actual sin cambios de comportamiento.

## Fase 3 — Bloque Sobre nosotros

Componente nuevo `AboutSection.tsx`.

- Dos columnas: texto a la izquierda, imagen `isotipo` a la derecha.
- Responde tres preguntas que hoy no están en ningún lado: qué es Kitsunova,
  para quién es y qué problema resuelve.
- Contenido nuevo en `siteContent.ts` como `aboutSection`, siguiendo el patrón
  de las listas existentes.

## Fase 4 — Limpieza del hero y reordenación

- Se elimina `landingSupportCards` del hero (`HomePage.tsx:83-106`): satura la
  columna derecha y compite con el registro. El contenido de esas tarjetas
  se recupera en el bloque Sobre nosotros.
- El registro (`AuthUnified`) sube a una columna propia a ancho completo debajo
  del texto, en lugar de vivir encajado en la columna izquierda.
- Cada `Section` recibe su `id` de ancla.
- `StatsStrip` se integra como banda ancha entre Hero y Sobre nosotros,
  conservando su posición de apoyo sin competir como sección propia.

## Fase 5 — Rejillas de tarjetas

- `FeatureCards` recibe `id` para anclar.
- Las dos rejillas se diferencian de verdad: Funcionalidades usa las tarjetas de
  `landingFeatureCards`, Beneficios usa `landingBenefitCards`.
  (El bug de que `variant` se ignoraba ya está corregido.)

## Fase 6 — Verificación

- `npm run typecheck`, `npm run build`, `npm test`.
- Comprobación con navegador a 320 / 390 / 768 / 1440 px: sin overflow
  horizontal, sin secciones ocultas, imágenes sin layout shift.
- Comprobar que el preloader no deja el scroll bloqueado.
- Comprobar que cada enlace del header desplaza a su ancla real.

## Riesgos

- **El preloader puede impedir el primer render perceptible.** Mitigación:
  `prefers-reduced-motion` lo salta, y el contenido ya está montado detrás.
- **Sticky + curtain.** El overlay va en `fixed` para no quedar atrapado por
  el `sticky` del header.
- **Alto de la página.** La reorganización debería reducirla; hoy ronda los
  6300 px en escritorio.
