# Plan: Responsive Landing Page Fixes + Neumorphism Design

## Objetivo
Hacer que la página principal (HomePage) sea 100% responsive y se vea bien en móvil (320px-768px) y escritorio (768px+), sin afectar la funcionalidad de login/registro. **Aplicar diseño neumórfico (neumorphism) manteniendo la identidad visual actual (colores púrpura/azul, tipografía Poppins).**

## Nuevas Dependencias a Instalar
```bash
cd frontend && npm install framer-motion @types/react-dom
```
- **framer-motion**: Librería estándar para animaciones en React (page transitions, hover effects, scroll animations)
- Ya tenemos `@types/react-dom` en devDependencies

## Enfoque Neumórfico (CSS Variables)
Añadir al `:root` en `global.css`:
```css
/* Neumorphism - sombras suaves para profundidad */
--neumorphic-bg: #0a1a63;
--neumorphic-light: #1a2a7a;
--neumorphic-dark: #06124a;
--neumorphic-shadow-light: rgba(124, 108, 255, 0.15);
--neumorphic-shadow-dark: rgba(0, 0, 0, 0.4);
--neumorphic-accent-glow: rgba(124, 108, 255, 0.25);

/* Sombras neumórficas estándar */
--shadow-neu-outset: 8px 8px 16px var(--neumorphic-shadow-dark), -8px -8px 16px var(--neumorphic-shadow-light);
--shadow-neu-inset: inset 8px 8px 16px var(--neumorphic-shadow-dark), inset -8px -8px 16px var(--neumorphic-shadow-light);
--shadow-neu-pressed: inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light);
--shadow-neu-subtle: 4px 4px 8px var(--neumorphic-shadow-dark), -4px -4px 8px var(--neumorphic-shadow-light);
```

## Aplicación Neumórfica por Componente
| Componente | Tratamiento |
|------------|-------------|
| Cards (feature, benefit, journey, metric) | `background: var(--neumorphic-bg); box-shadow: var(--shadow-neu-outset);` |
| Botones primarios | `background: linear-gradient(135deg, var(--neumorphic-light), var(--neumorphic-bg)); box-shadow: var(--shadow-neu-outset);` |
| Botones pressed | `box-shadow: var(--shadow-neu-pressed);` |
| Inputs | `background: var(--neumorphic-bg); box-shadow: var(--shadow-neu-inset);` |
| Nav/Header | `background: var(--neumorphic-bg); box-shadow: var(--shadow-neu-subtle);` |
| Panels flotantes | `background: var(--neumorphic-bg); box-shadow: var(--shadow-neu-outset);` |

**Principio**: No cambiar la paleta actual (--accent #7c6cff, --accent-2 #5ddcff, --text #ffffff). Solo añadir profundidad con sombras neumórficas sutiles.

## Estado Actual - Problemas Identificados

### 1. Hero Section (Main Container)
- **Problema**: `.main-container` usa flex con anchos fijos (530px left, 720px right)
- **Móvil**: Los elementos no se apilan correctamente, la imagen del zorro (480px) desborda
- **Escritorio**: Gap de 40px muy grande en pantallas medianas

### 2. Formulario de Registro
- **Problema**: Grid de 2 columnas que colapsa a 1 en móvil (640px), pero los campos password-field siguen usando `grid-column: span 1`
- **Móvil**: Botones de toggle password muy pequeños (touch target < 44px)
- **Espaciado**: Padding del login-box (35px) excesivo en móvil

### 3. Navegación (PublicHeader)
- **Problema**: Mobile menu funcional pero:
  - Logo muy grande (170px) en móvil
  - Altura fija del navbar (85px) no adaptable
  - Animación del menú lateral podría ser más suave

### 4. Stats Strip
- **Problema**: Grid de 3 columnas fijo que pasa a 1 columna en 1180px y 900px, pero en móvil los items se ven apretados
- **Móvil**: Texto muy pequeño, padding insuficiente

### 5. Journey Section (Cómo funciona)
- **Problema**: Grid de 3 columnas que colapsa bien, pero:
  - `min-height: 220px` en journey-card fuerza altura innecesaria en móvil
  - Número del paso (52px) muy grande en móvil

### 6. Feature/Benefit Cards
- **Problema**: Ancho fijo 340px con `max-width: 100%`
- **Móvil**: En 480px pasa a 100% pero gap de 48px se mantiene
- **Imágenes**: Altura fija 220px en card-image

### 7. Support CTA
- **Problema**: Grid 1.1fr / 0.9fr que pasa a 1fr en 768px - bien, pero padding fijo 28px

### 8. Mobile App Section
- **Problema**: Imagen de celulares 700px fija, texto en contenedor con border 2px blanco
- **Móvil**: Imagen se escala pero el contenedor de texto tiene padding fijo

### 9. Footer
- **Problema**: Grid 3 columnas que pasa a 1fr en 900px - funcional pero espaciado mejorable

### 10. Touch Targets & Accesibilidad
- Botones toggle password: ~30px altura (mínimo 44px)
- Enlaces nav móvil: padding 16px 24px - OK
- Botones store: 54px - OK

## Plan de Implementación

### Fase 0: Setup & Dependencias
- [x] Instalar `framer-motion` en frontend
- [x] Añadir variables CSS neumórficas en `:root` (global.css)
- [x] Verificar que no rompe build actual (`npm run typecheck && npm run build`)

### Fase 1: Hero Section & Main Container
- [x] Cambiar `.main-container` a mobile-first: column en móvil, row en desktop (>900px)
- [x] Ajustar `.left-section` y `.right-section` a width: 100% en móvil
- [x] Hero image: max-width 100%, height auto, centrada en móvil
- [x] Hero text: text-align center en móvil, right en desktop
- [x] Reducir gap en breakpoints intermedios
- [x] **Neumorfismo**: Aplicar sombras neumórficas a login-box y hero-image container

### Fase 2: Formulario de Registro
- [x] Hacer form-grid mobile-first (1 columna siempre, 2 columnas solo >640px)
- [x] Aumentar touch targets: toggle-password-btn min-height 44px
- [x] Reducir padding login-box en móvil (24px)
- [ ] Ajustar font-size de inputs en móvil (16px para evitar zoom iOS)
- [ ] Mejorar feedback visual en validación
- [x] **Neumorfismo**: Inputs con inset shadow, botones con outset/pressed shadows
- [ ] **Animación**: Framer Motion en focus inputs, submit button press

### Fase 3: Navegación (PublicHeader)
- [x] Reducir logo en móvil (120px max → 110px/100px en breakpoints)
- [x] Hacer navbar altura auto con padding responsive (72px→64px)
- [x] Mejorar animación menú (Framer Motion AnimatePresence + spring)
- [x] Asegurar foco visible en elementos del menú (focus-visible outlines)
- [x] **Animación**: Framer Motion AnimatePresence para menú móvil
- [x] **Neumorfismo**: Navbar con shadow sutil, botones con depth, menú móvil con outset shadow

### Fase 4: Stats Strip
- [ ] Grid responsive: 1 col <480px, 2 col 480-768px, 3 col >768px
- [ ] Aumentar padding en strip-item móvil
- [ ] Ajustar font-sizes con clamp()
- [ ] **Neumorfismo**: Cards con outset shadow suave
- [ ] **Animación**: Stagger reveal on scroll

### Fase 5: Journey Section
- [ ] Quitar min-height fijo, usar min-height auto
- [ ] Número de paso responsive (clamp 40-52px)
- [ ] Gap responsive (12px móvil, 18px desktop)
- [ ] **Neumorfismo**: Journey cards con outset shadow
- [ ] **Animación**: Stagger reveal + hover scale

### Fase 6: Feature/Benefit Cards
- [ ] Quitar ancho fijo 340px, usar flex: 1 1 280px
- [ ] Gap responsive (16px móvil, 24px tablet, 48px desktop)
- [ ] Imágenes: aspect-ratio en lugar de altura fija
- [ ] Padding responsive en cards
- [ ] **Neumorfismo**: Cards con outset shadow, hover pressed effect
- [ ] **Animación**: Hover scale 1.02 + shadow depth increase

### Fase 7: Support CTA
- [ ] Padding responsive (20px móvil, 28px desktop)
- [ ] Gap responsive
- [ ] **Neumorfismo**: Panel con outset shadow
- [ ] **Animación**: Scroll reveal

### Fase 8: Mobile App Section
- [ ] Imagen: max-width 100%, height auto
- [ ] Texto: padding responsive, border width responsive
- [ ] Store buttons: flex-wrap, gap responsive
- [ ] **Neumorfismo**: Texto container con inset shadow
- [ ] **Animación**: Phones float animation, buttons hover

### Fase 9: Footer
- [ ] Gap responsive
- [ ] Padding responsive
- [ ] Logo size responsive
- [ ] **Neumorfismo**: Sutil shadow en logo container

### Fase 10: Variables CSS & Utilidades + Polish
- [ ] Definir breakpoints consistentes como variables CSS
- [ ] Crear utilidades de spacing responsive
- [ ] Verificar prefers-reduced-motion
- [ ] **Testing cross-device**: 320px, 375px, 428px, 768px, 1024px, 1440px
- [ ] **Testing touch targets**: Mínimo 44x44px en todos los interactivos
- [ ] **Testing no horizontal overflow**
- [ ] **Testing animaciones suaves** (60fps)
- [ ] **Testing accesibilidad** (foco visible, contraste)

## Breakpoints Estándar a Usar
```css
--bp-xs: 320px;   /* Móvil pequeño */
--bp-sm: 480px;   /* Móvil grande */
--bp-md: 768px;   /* Tablet */
--bp-lg: 900px;   /* Desktop pequeño */
--bp-xl: 1180px;  /* Desktop grande */
--bp-2xl: 1400px; /* Desktop extra grande */
```

## Animaciones con Framer Motion
| Tipo | Uso | Componente |
|------|-----|------------|
| Page entry | Fade + slide up | Secciones principales |
| Hover cards | Scale + shadow depth | Feature/Benefit/Journey cards |
| Scroll reveal | IntersectionObserver + motion | Stats, Journey, Support cards |
| Button press | Scale 0.98 + inset shadow | Todos los botones |
| Mobile menu | Slide + fade | PublicHeader |
| Form focus | Border glow + subtle scale | Inputs |
| Stagger children | delay escalonado | Grids de cards |

**Implementación**: Wrap secciones con `<motion.section>` y usar `initial`, `animate`, `transition`, `whileHover`, `whileTap`. Para scroll reveal: `viewport={{ once: true, margin: "-100px" }}`.

## Archivos a Modificar
1. `frontend/src/styles/global.css` - Estilos principales + variables neumórficas
2. `frontend/src/components/PublicHeader.tsx` - Animaciones menú móvil
3. `frontend/src/components/PublicFooter.tsx` - Si hay cambios en JSX
4. `frontend/src/pages/HomePage.tsx` - Wrappers motion, imports framer-motion
5. `frontend/package.json` - Nueva dependencia framer-motion

## Verificación
- [ ] Test en Chrome DevTools: 320px, 375px, 428px, 768px, 1024px, 1440px
- [ ] Test touch targets en móvil real (mínimo 44x44px)
- [ ] Verificar no hay overflow horizontal
- [ ] Verificar animaciones suaves (60fps, prefers-reduced-motion respetado)
- [ ] Verificar accesibilidad (foco visible, contraste WCAG AA)
- [ ] **Neumorfismo**: Verificar profundidad visual consistente, sombras no duras
- [ ] **Build**: `npm run typecheck && npm run build` sin errores