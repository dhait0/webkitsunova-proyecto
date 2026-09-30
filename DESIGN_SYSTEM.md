# Design System - Kitsunova Web

## Principios de Diseño

### 1. Neumorfismo (Soft UI)
- **Fondo base**: `--neumorphic-bg: #0a1a63` (azul oscuro profundo)
- **Luz**: `--neumorphic-light: #1a2a7a` (borde superior/izquierdo)
- **Sombra**: `--neumorphic-dark: #06124a` (borde inferior/derecho)
- **Glow acento**: `--neumorphic-accent-glow: rgba(124, 108, 255, 0.25)`

### 2. Sombras Estándar
```css
/* Elevado (cards, botones, paneles) */
--shadow-neu-outset: 8px 8px 16px var(--neumorphic-shadow-dark), -8px -8px 16px var(--neumorphic-shadow-light);

/* Hundido (inputs, áreas de texto) */
--shadow-neu-inset: inset 8px 8px 16px var(--neumorphic-shadow-dark), inset -8px -8px 16px var(--neumorphic-shadow-light);

/* Presionado (active state botones) */
--shadow-neu-pressed: inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light);

/* Sutil (navbar, elementos menores) */
--shadow-neu-subtle: 4px 4px 8px var(--neumorphic-shadow-dark), -4px -4px 8px var(--neumorphic-shadow-light);
```

### 3. Paleta de Colores (Mantener)
- `--accent: #7c6cff` (púrpura principal)
- `--accent-2: #5ddcff` (cian acento)
- `--text: #ffffff`
- `--muted: #c7d2fe`
- `--muted-2: #a0a7c0`
- `--bg-start: #07186b` → `--bg-end: #010114` (gradiente radial fondo)

### 4. Tipografía
- **Principal**: Poppins (300-800)
- **Mono**: JetBrains Mono (400, 600)
- **Escalas**: `clamp(min, vw, max)` para responsive

### 5. Border Radius
- **Inputs/Botones**: 14px
- **Cards/Paneles**: 24px
- **Contenedores grandes**: 28px
- **Círculos (avatar, toggle)**: 50% / 999px

### 6. Espaciado (Sistema 4px)
- Base: 4px
- Scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64

### 7. Touch Targets
- **Mínimo**: 44x44px (WCAG AA)
- **Botones**: min-height 50px
- **Icon buttons**: 44x44px con padding interno

### 8. Breakpoints
```css
--bp-xs: 320px;   /* Móvil pequeño */
--bp-sm: 480px;   /* Móvil grande */
--bp-md: 768px;   /* Tablet */
--bp-lg: 900px;   /* Desktop pequeño */
--bp-xl: 1180px;  /* Desktop grande */
--bp-2xl: 1400px; /* Desktop extra grande */
```

### 9. Animaciones (Framer Motion)
- **Duración base**: 0.2s - 0.3s
- **Easing**: `ease-out` / `[0.25, 0.46, 0.45, 0.94]`
- **Reduced motion**: Respetar `prefers-reduced-motion`

| Tipo | Duración | Uso |
|------|----------|-----|
| Micro (hover, focus) | 0.15-0.2s | Botones, inputs, toggles |
| Macro (page entry, modals) | 0.3-0.5s | Secciones, menús, modales |
| Scroll reveal | 0.6-0.8s | Cards, stats, journey steps |
| Stagger | +0.1s/item | Grids de cards |

### 10. Componentes - Reglas Neumórficas

#### Cards (Feature, Benefit, Journey, Metric, Stat)
```css
background: var(--neumorphic-bg);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 24px;
box-shadow: var(--shadow-neu-outset);
transition: transform 0.25s ease, box-shadow 0.25s ease;

&:hover {
  transform: translateY(-6px);
  box-shadow: 12px 12px 24px var(--neumorphic-shadow-dark), -12px -12px 24px var(--neumorphic-shadow-light);
}
```

#### Botones Primarios
```css
background: linear-gradient(135deg, var(--neumorphic-light), var(--neumorphic-bg));
border: none;
border-radius: 14px;
color: white;
font-weight: 700;
min-height: 50px;
box-shadow: var(--shadow-neu-outset);

&:hover { transform: translateY(-2px); box-shadow: outset profundizado; }
&:active { transform: translateY(0); box-shadow: var(--shadow-neu-pressed); }
&:disabled { opacity: 0.65; box-shadow: none; transform: none; }
```

#### Botones Secundarios/Social
```css
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 14px;
color: white;
min-height: 48px;
box-shadow: var(--shadow-neu-subtle);

&:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-1px); }
```

#### Inputs
```css
background: var(--neumorphic-bg);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 14px;
color: white;
min-height: 50px;
padding: 0 16px;
box-shadow: var(--shadow-neu-inset);

&:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-neu-inset), 0 0 0 3px var(--accent-glow);
  background: var(--neumorphic-light);
}
```

#### Navbar/Header
```css
background: rgba(10, 26, 99, 0.95);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255, 255, 255, 0.06);
box-shadow: var(--shadow-neu-subtle);
```

#### Paneles Flotantes / Support Cards
```css
background: rgba(4, 8, 26, 0.64);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 18px;
backdrop-filter: blur(10px);
box-shadow: var(--shadow-neu-outset);
```

### 11. Imágenes
- **Aspect ratio** en lugar de altura fija
- `max-width: 100%; height: auto;`
- `object-fit: contain` para logos/ilustraciones
- `object-fit: cover` para fotos

### 12. Accesibilidad
- Contraste mínimo WCAG AA (4.5:1 texto, 3:1 UI)
- Focus visible en todos los interactivos
- `prefers-reduced-motion` desactiva animaciones
- ARIA labels en iconos botones

### 13. Estados de Carga
- Skeleton loaders con `--neumorphic-bg` + shimmer
- Spinner con `--accent` color
- Transiciones suaves entre estados

---

## Checklist por Componente Nuevo

- [ ] Usa variables CSS neumórficas (no valores hardcoded)
- [ ] Touch targets ≥ 44px
- [ ] Responsive en todos los breakpoints
- [ ] Estados: default, hover, focus, active, disabled
- [ ] Animaciones con Framer Motion (si interactivo)
- [ ] Reduced motion respetado
- [ ] Contraste verificado
- [ ] Sin overflow horizontal en 320px