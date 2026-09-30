# Propuesta de Rediseño - Soft UI / Neumorfismo

## Principio: Unificación Login/Registro

### Estado Actual
- `HomePage.tsx`: Formulario de registro (email, username, password, confirm, Google, Apple)
- `LoginPage.tsx`: Formulario de login (email, password, forgot, Google, Apple)

### Propuesta: AuthUnified.tsx
Un solo componente con **transición animada** entre modos:

```
┌─────────────────────────────────────┐
│  Kitsunova                    [X]   │  ← Modal overlay o página dedicada
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐           │
│  │ Iniciar │  │ Registrar│  ← Tabs animados (slide indicator)
│  │ Sesión  │  │          │
│  └────┬────┘  └────┬────┘
│       │            │
│  ┌────▼────────────▼────┐
│  │   Formulario         │  ← AnimatePresence + layout transition
│  │  (campos dinámicos)  │     - Login: email + password
│  │                      │     - Registro: + username + confirm
│  └──────────────────────┘
│  ┌──────────────────────┐
│  │   Social Buttons     │  ← Google / Apple (próximamente)
│  └──────────────────────┘
└─────────────────────────────────────┘
```

### Animaciones Framer Motion:
- **Tab switch**: `AnimatePresence` + `layout` en indicator + `key` en form
- **Campos extra**: `motion.div` con `initial={opacity:0, height:0} animate={opacity:1, height:'auto'} exit={opacity:0, height:0}`
- **Submit**: `whileTap` scale 0.98 + shadow pressed
- **Error shake**: `animate={{ x: [0, -8, 8, -8, 8, 0] }}` on error state
- **Success**: Checkmark animation + fade out → redirect

---

## Arquitectura de Componentes Soft-UI

### 1. Base UI Components (`src/components/ui/`)

| Componente | Props clave | Animaciones |
|------------|-------------|-------------|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'social'`, `size`, `loading`, `icon` | `whileTap` scale, `whileHover` lift, loading spinner |
| `Input` | `type`, `label`, `error`, `icon`, `showPassword`, `iconRight` | `whileFocus` border glow + scale 1.01, error shake |
| `Card` | `variant: 'default'\|'feature'\|'benefit'\|'journey'`, `hover`, `padding` | `whileHover` lift + shadow depth, entrance stagger |
| `CardImage` | `src`, `alt`, `ratio: '4/3'\|'16/9'\|'1/1'`, `placeholder` | `whileHover` scale 1.02, entrance fade+slide |
| `Badge` | `variant: 'step'\|'label'\|'status'`, `number?` | `whileHover` scale, entrance pop |
| `Container` | `size: 'sm'\|'md'\|'lg'\|'xl'\|'full'` | - |
| `Grid` | `cols: 1\|2\|3\|4\|5`, `gap`, `responsive` | stagger children |
| `Section` | `padding: 'sm'\|'md'\|'lg'`, `background`, `divider` | scroll reveal |
| `Tabs` | `items`, `activeIndex`, `onChange`, `animated` | sliding indicator, content cross-fade |

### 2. Landing Sections (`src/components/landing/`)

| Sección | Descripción | Reutiliza |
|---------|-------------|-----------|
| `HeroSection` | Headline + AuthUnified (login/registro) | `Container`, `Grid`, `Card`, `Input`, `Button` |
| `StatsStrip` | 3 métricas con gradient text | `Grid`, `Card` (variant metric) |
| `JourneySection` | 3 pasos numerados | `Grid`, `Card` (variant journey), `Badge` |
| `FeatureCards` | 3 características (icono + título + texto) | `Grid`, `Card` (variant feature), `CardImage` |
| `BenefitsSection` | 3 beneficios (similar a features) | `Grid`, `Card` (variant benefit), `CardImage` |
| `SupportCTA` | Panel dividido copy + lista | `Section`, `Card`, `Grid` |
| `MobileAppSection` | Phones mockup + store buttons | `Section`, `CardImage`, `Button` (social) |

### 3. Layout Components (`src/components/layout/`)

| Componente | Uso |
|------------|-----|
| `PageLayout` | Wrapper página: Header + Main + Footer |
| `SectionStack` | Stack vertical de secciones con spacing consistente |

---

## Tokens de Diseño (CSS Variables ya definidas)

```css
/* Colores base */
--neumorphic-bg: #0a1a63;
--neumorphic-light: #1a2a7a;
--neumorphic-dark: #06124a;

/* Sombras */
--shadow-neu-outset: 8px 8px 16px var(--neumorphic-shadow-dark), -8px -8px 16px var(--neumorphic-shadow-light);
--shadow-neu-inset: inset 8px 8px 16px var(--neumorphic-shadow-dark), inset -8px -8px 16px var(--neumorphic-shadow-light);
--shadow-neu-pressed: inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light);
--shadow-neu-subtle: 4px 4px 8px var(--neumorphic-shadow-dark), -4px -4px 8px var(--neumorphic-shadow-light);

/* Transiciones */
--transition-fast: 150ms ease-out;
--transition-base: 250ms ease-out;
--transition-slow: 350ms ease-out;
--spring-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Border radius */
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-xl: 24px;
--radius-full: 999px;

/* Touch targets */
--touch-min: 44px;
```

---

## Plan de Implementación

### Fase A: Componentes UI Base (Prioridad 1)
1. `Button` - variants, sizes, loading, icons
2. `Input` - label, error, password toggle, icons
3. `Card` - variants, hover, image slot
4. `CardImage` - aspect ratios, placeholder
5. `Badge` - step, label, status
6. `Container` - responsive widths
7. `Grid` - responsive columns + stagger
8. `Section` - scroll reveal + padding
9. `Tabs` - animated indicator + content

### Fase B: AuthUnified (Prioridad 2)
- Componente único login/registro
- Animated tabs + dynamic fields
- Framer Motion transitions
- Integración Supabase existente

### Fase C: Landing Sections (Prioridad 3)
- Extraer cada sección de HomePage.tsx
- Usar componentes UI base
- Mantener contenido de siteContent.ts

### Fase D: Page Composition
- `HomePage.tsx` → solo compone secciones
- `LoginPage.tsx` → usa `AuthUnified` en modal/página
- `AuthUnified` → reutilizable en Hero + Login dedicado

---

## Próximo Paso

¿Empezamos con **Fase A: Componentes UI Base**? Crearé la estructura de carpetas y los componentes `Button`, `Input`, `Card` primero para tener el foundation.