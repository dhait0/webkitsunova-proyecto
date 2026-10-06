---

name: Kitsunova — design system

description: Project-wide UI governance for Kitsunova. The public landing keeps its near-black indigo identity; application surfaces use a restrained mobile-first Soft UI system with consistent motion, accessibility, and responsive behavior.

colors:

  violet: "#7c6cff"

  violet-soft: "#a99aff"

  blue-deep: "#3048d8"

  cyan: "#5ddcff"

  indigo-ground: "#07186b"

  indigo-mid: "#020535"

  indigo-abyss: "#010114"

  card: "#0d1430"

  card-deep: "#0b1128"

  panel: "#1a2455"

  paper: "#f4f1ea"

  ink: "#2a2418"

  ink-soft: "#565040"

  ink-rule: "rgba(42, 36, 24, 0.16)"

  hairline: "rgba(124, 108, 255, 0.2)"

  hairline-hot: "rgba(124, 108, 255, 0.5)"

  text: "#ffffff"

  text-body: "#c7d2fe"

  text-muted: "#a9b4e0"

  text-dim: "#8f93b8"

  error: "#ff9d8a"

  ok: "#8ff0c4"

typography:

  display:

    fontFamily: "'Archivo', system-ui, sans-serif"

    fontVariation: "'wdth' 84, 'wght' 800"

    fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)"

    fontWeight: 800

    lineHeight: 1.02

    letterSpacing: "-0.025em"

  headline:

    fontFamily: "'Archivo', system-ui, sans-serif"

    fontVariation: "'wdth' 88, 'wght' 700"

    fontSize: "clamp(1.625rem, 2.9vw, 2.375rem)"

    fontWeight: 700

    lineHeight: 1.08

    letterSpacing: "-0.02em"

  title:

    fontFamily: "'Archivo', system-ui, sans-serif"

    fontVariation: "'wdth' 92, 'wght' 600"

    fontSize: "clamp(1.0625rem, 1.5vw, 1.1875rem)"

    fontWeight: 600

    lineHeight: 1.24

    letterSpacing: "-0.01em"

  body:

    fontFamily: "'Source Sans 3', system-ui, -apple-system, sans-serif"

    fontSize: "1rem"

    fontWeight: 400

    lineHeight: 1.6

  label:

    fontFamily: "'Archivo', system-ui, sans-serif"

    fontVariation: "'wdth' 96, 'wght' 600"

    fontSize: "0.6875rem"

    fontWeight: 600

    letterSpacing: "0.14em"

  numeral:

    fontFamily: "'Archivo', system-ui, sans-serif"

    fontVariation: "'wdth' 78, 'wght' 700"

    letterSpacing: "-0.02em"

    fontFeature: "'tnum' 1"

rounded:

  cell: "4px"

  control: "12px"

  card: "20px"

components:

  button-primary:

    backgroundColor: "{colors.violet}"

    textColor: "{colors.indigo-abyss}"

    rounded: "{rounded.control}"

    padding: "0 22px"

    height: "48px"

    typography:

      fontFamily: "{typography.display.fontFamily}"

      fontVariation: "'wdth' 90, 'wght' 700"

      fontSize: "0.9375rem"

      letterSpacing: "0.005em"

  button-primary-hover:

    backgroundColor: "{colors.violet-soft}"

  button-quiet:

    backgroundColor: "transparent"

    textColor: "{colors.text-muted}"

    rounded: "{rounded.cell}"

    padding: "0 22px"

    height: "48px"

    typography:

      fontFamily: "{typography.display.fontFamily}"

      fontVariation: "'wdth' 90, 'wght' 700"

      fontSize: "0.9375rem"

  input-field:

    backgroundColor: "{colors.panel}"

    textColor: "{colors.text}"

    rounded: "{rounded.cell}"

    padding: "0 13px"

    height: "46px"

    typography:

      fontFamily: "{typography.body.fontFamily}"

      fontSize: "0.9375rem"

  tab-item:

    rounded: "{rounded.cell}"

    padding: "0 14px"

    height: "68px"

    textColor: "{colors.text-muted}"

    typography:

      fontFamily: "{typography.display.fontFamily}"

      fontVariation: "'wdth' 96, 'wght' 600"

      fontSize: "0.8125rem"

  card:

    backgroundColor: "{colors.card}"

    rounded: "{rounded.card}"

    padding: "clamp(26px, 3.6vw, 46px)"

---

**# Project UI Governance

## Source of truth

This `design.md` lives at the repository root and is the canonical, living design reference for Kitsunova. UI work must read this file before introducing new visual conventions. It governs reusable design decisions; one-off implementation fixes belong in code unless they establish a pattern that future work must preserve.

When a deliberate visual decision changes, update the existing relevant section in this file rather than creating a second design document or duplicating rules inside an agent/skill. The code and this document must converge.

## Technology baseline

The current UI stack is:

- Next.js 16.3.8
- React 19.3
- TypeScript 5.6
- Tailwind CSS 3.4.17
- Framer Motion 13.4.6
- shadcn/ui pattern base with `class-variance-authority`, `clsx`, and `tailwind-merge`
- custom application/admin primitives such as `AdminModal` and `AdminSelect`
- Zod for validation

Do not introduce Material UI, a second component framework, or direct Radix UI usage merely to solve styling problems. Prefer the existing primitives and patterns.

## Surface routing

Kitsunova intentionally has more than one visual world. Do not flatten them into one generic style.

### Public landing / `.kb-*`

The public landing is governed by the detailed specification later in this document. Its identity is near-black indigo with violet and blue light, one bone surface as punctuation, and the kitsune companion. It is explicitly **not neumorphic**. Its tokens, typography, shadow vocabulary, One Glow Rule, and landing breakpoints belong to that scoped world.

### Admin / user / psychologist application

Internal application surfaces use a restrained **Soft UI** language optimized for clarity and task completion rather than decorative depth. Preserve the application's existing component patterns and favor reusable variants over one-off CSS.

Application surfaces should use:

- layered but restrained surfaces;
- moderate radii;
- subtle borders and soft elevation where hierarchy needs it;
- compact controls on dense admin screens;
- visible cyan focus treatment;
- clear `hover`, `focus`, `active`, `disabled`, `loading`, `empty`, `error`, and `success` states;
- tactile press feedback;
- no dependency on hover for mobile usability.

Avoid exaggerated neumorphism, excessive blur/glassmorphism, giant pills everywhere, arbitrary gradients, duplicated components, low-contrast text, and heavy shadows inside dense tables.

### Authentication surfaces

If authentication UI is rendered inside the `.kb-*` public landing world, follow the landing rules. If it belongs to the application shell, follow the application Soft UI rules. Preserve the existing AuthUnified interaction language, including approximately 200ms state/tab transitions with a clear ease-out feel.

## Responsive system

Mobile is the primary application target. Every new or edited application view must be usable first at approximately 360px and 390px widths, then scale deliberately to tablet, laptop, and desktop.

For admin/application surfaces, preserve the established **600px** and **900px** breakpoints where existing CSS relies on them. Validate behavior around 1024–1366px laptop widths and 1440px+ desktop widths as well.

The public landing is different: its stylesheet owns **1080px, 860px, and 560px** and must not receive an extra breakpoint without a deliberate design-system change documented here.

Across all surfaces:

- accidental horizontal page scrolling is a defect;
- toolbars and action groups wrap rather than overflow;
- core layouts must not depend on fixed desktop widths;
- modal content must fit the viewport and scroll internally when needed;
- long labels, emails, status text, and translated content must not break layout;
- touch targets must remain usable on phone;
- fixed/sticky UI must not hide focused content or primary actions.

Current admin-specific behaviors to preserve include `.admin-toolbar-wrap`, compact wrapping table actions, and sidebar collapse based on `margin-left` layout transition rather than transform-based page shifting.

## Motion system

Motion communicates state, hierarchy, feedback, and spatial continuity. It is not decoration. Framer Motion is the preferred tool when CSS transitions are insufficient.

Default timing bands for application surfaces:

| Interaction | Duration |
| --- | --- |
| Press / micro-feedback | 120–180ms |
| Standard UI transition | 180–250ms |
| Modal / drawer | 220–320ms |
| Major content/page transition | 250–400ms, only when orientation benefits |

Use explicit property transitions instead of broad `transition-all` when practical. Prefer `transform` and `opacity` for frequent animation. Use ease-out for entrances, ease-in for exits, and ease-in-out for continuous transformations. Springs are acceptable only when they improve tactility and remain appropriate for a serious application workflow.

All interactive controls require press feedback (`:active` or equivalent). Modal and drawer animations must be interruptible. Animation must never delay data entry, approval, destructive confirmation, or another core task.

`prefers-reduced-motion` is mandatory. Framer Motion components should use `useReducedMotion()` where appropriate and neutralize non-essential motion without removing state feedback.

## Interaction and accessibility baseline

- Maintain strong keyboard-visible focus. Cyan is the established focus cue where the current surface uses it.
- Modal dialogs trap focus, support safe Escape dismissal, and restore focus to the invoking control.
- Do not communicate status by color alone; combine color with label, icon, glyph, or position.
- Do not shrink typography to solve responsive problems. Reflow the layout instead.
- Preserve semantic HTML and accessible names for icon-only controls.
- Loading and disabled states must make repeated submissions/actions difficult to trigger accidentally.
- Error messages must remain associated with the field or action that caused them.

## Component governance

Before creating a new component, search for an existing primitive or component with the same interaction role. Extend existing components via variants before cloning markup.

For admin UI specifically:

- use existing `AdminModal`, `AdminSelect`, buttons, field patterns, and icon primitives where applicable;
- default compact admin action icons to 14px unless the context requires otherwise;
- keep table actions compact and wrappable;
- favor scanability over decorative depth;
- preserve readable row density;
- on narrow screens, prioritize/reflow columns or use a deliberate stacked representation rather than making text illegibly small.

## Design documentation update protocol

Update this root file when a change introduces or revises a reusable design decision, including:

- colors or semantic color roles;
- typography hierarchy;
- spacing/radius/shadow/elevation tokens;
- breakpoints or responsive policies;
- standard component variants;
- focus, keyboard, touch-target, or accessibility conventions;
- animation durations, easing, reduced-motion behavior, or shared Framer Motion patterns;
- a new scoped visual world;
- a deliberate exception that future contributors must preserve.

Do **not** update this file for a local bug fix that does not establish a reusable design rule. Do not append a conflicting rule to the bottom: amend the canonical rule and note the scope of any exception.

---

# Design System: Kitsunova — public landing**

**## Overview**

****Creative North Star: "The Near-Black Indigo Identity"****

The landing is a deep, near-black indigo identity executed with current craft: a radial gradient ground in violet-tinged indigo, violet and blue light on it, and exactly one bone light surface as punctuation. The density is clean and modern. There is no paper craft, no cut edges, no neumorphism. The hero is a deliberate two-column split — registration form on the left, headline and fox on the right — never overlapping. The fox carries the legacy violet-blue glow as the single deliberate glow in the system. Depth is conveyed through tonal layering and real offset shadows on the register panel and the liftable sheet, not through glow cards.

****Key Characteristics:****

- Radial near-black indigo ground (`radial-gradient(circle at 14% -6%, #07186b, #020535 42%, #010114)`), fixed attachment.

- Dark cards with a 1px violet hairline (`rgba(124,108,255,0.2)`) and `linear-gradient(145deg, #0d1430, #0b1128)`.

- One bone light surface (`#f4f1ea`) reserved for the record section; it is punctuation, not the base.

- Accent hierarchy: violet `#7c6cff` dominant, blue `#3048d8` deeper for secondary layers and scrollbar only, cyan `#5ddcff` reserved for focus rings. On the bone surface the accent darkens to `#5741d6` (`--kb-ink-accent`) because `#7c6cff` measures 3.42:1 on `#f4f1ea` and an 11px label has to clear AA; `#5741d6` measures 5.94:1. The escalation row fills with `rgba(124,108,255,0.14)`, which composites to `#e3deed` and leaves the ink at 6.09:1.

- Fox image with legacy `drop-shadow(0 0 34px rgba(78,122,255,0.5))`.

- Hero composition: `grid-template-columns: minmax(0,400px) minmax(0,1fr)`; form left, stage right, tops aligned.

- Breakpoints at ****1080px****, ****860px****, ****560px****.

- `prefers-reduced-motion` neutralised in CSS and the framer-motion mobile nav reads `useReducedMotion()` and sets duration to 0.

- Contrast verified numerically and re-verified in a headless Chromium at 1440, 1280, 900 and 390px.

**Verification note: the surface was measured in a real headless Chromium render — computed styles, box geometry, contrast, tab order, console output — at four widths. Screenshot review by eye is still outstanding, because the reviewing model cannot read images.**

**## Colors**

The palette is a single near-black indigo ground with three chromatic accents, plus a bone light surface used once per page run.

**### Primary**

- ****Violet**** (`#7c6cff`): the dominant accent. It fills primary actions, active tab indicators, cut tails, focus-ring companion rings, and the register panel's selected mode cell. It is the only chromatic colour used as a filled surface at scale.

**### Secondary**

- ****Deep Blue**** (`#3048d8`): secondary layers and the scrollbar thumb only. It measures 3.00:1 on the ground and must not carry text.

**### Tertiary**

- ****Cyan**** (`#5ddcff`): focus rings and selection highlight only. It never fills a large surface alone and never carries body text.

**### Neutral**

- ****Indigo Ground**** (`#07186b`): the top of the radial falloff.

- ****Indigo Mid**** (`#020535`): the middle stop.

- ****Indigo Abyss**** (`#010114`): the bottom stop; also the sticky nav fill at 82% opacity, the mobile nav panel, and the scrollbar track.

- ****Card**** (`#0d1430`) / ****Card Deep**** (`#0b1128`): the gradient surface of every dark card.

- ****Panel / Input**** (`#1a2455`): the fill of the register panel and every input.

- ****Text**** (`#ffffff`): display text.

- ****Text Body**** (`#c7d2fe`): running text.

- ****Text Muted**** (`#a9b4e0`): secondary text.

- ****Text Dim**** (`#8f93b8`): tertiary text.

- ****Paper**** (`#f4f1ea`): the single light surface, used only by the record section.

- ****Ink**** (`#2a2418`) / ****Ink Soft**** (`#565040`): type and rules on paper.

- ****Hairline**** (`rgba(124,108,255,0.2)`) / ****Hairline Hot**** (`rgba(124,108,255,0.5)`): borders.

- ****Error**** (`#ff9d8a`) / ****OK**** (`#8ff0c4`): status text.

**### Measured contrast**

\| Pair | Ratio |

\| --- | --- |

\| `#c7d2fe` on `#010114` | 13.86:1 |

\| `#a9b4e0` on `#0d1430` | 8.87:1 |

\| `#010114` on `#7c6cff` | 5.36:1 |

\| `#a7abd0` on `#1a2455` | 6.57:1 |

\| `#ffffff` on `#010114` | 20.67:1 |

****The Accent Hierarchy Rule.**** Violet carries filled actions and selected states. Blue is structural and scroll-only. Cyan is attention-only (focus). No other accent hues exist.

**## Typography**

****Display Font:**** Archivo — variable, `wdth` 62–125 and `wght` 400–800, loaded with `wdth` and `wght` axes (fallback `system-ui, sans-serif`)

****Body Font:**** Source Sans 3 (fallback `system-ui, -apple-system, sans-serif`)

****Label/Mono Font:**** none in this world.

****Character:**** Archivo is condensed and heavy for shapes, labels, numerals and headlines; Source Sans 3 does all reading with real Spanish diacritics. The pairing says **labelled** against **written**. Both families arrive in a single `@import` at the top of `landing.css`.

**### Hierarchy**

- ****Display**** (Archivo `wdth 84` / `wght 800`, `clamp(2.25rem, 4.6vw, 3.75rem)`, line-height 1.02, tracking -0.025em): the cover headline only. Balanced wrapping.

- ****Headline**** (Archivo `wdth 88` / `wght 700`, `clamp(1.625rem, 2.9vw, 2.375rem)`, line-height 1.08, tracking -0.02em): every page title and the register panel title.

- ****Title**** (Archivo `wdth 92` / `wght 600`, `clamp(1.0625rem, 1.5vw, 1.1875rem)`, line-height 1.24, tracking -0.01em): stage names, index row titles, mode-switch tabs, footer column headings.

- ****Body**** (Source Sans 3, 1rem, line-height 1.6): all running text. Cover copy runs at 1.0625rem, page-head ledes and stage text at 0.9375rem.

- ****Label**** (Archivo `wdth 96` / `wght 600`, 0.6875rem, tracking 0.14em, uppercase, tabular): eyebrows, field labels, stamps.

- ****Numeral**** (Archivo `wdth 78` / `wght 700`, tabular figures, tracking -0.02em): dates in the record and any count.

Component-level faces: buttons at `wdth 90` / `wght 700` / 0.9375rem; the nav brand at `wdth 88` / `wght 700` / 1.0625rem; stage names and escalation tabs at `wdth 90–92` / `wght 600` / 0.75–0.875rem.

****The Condensed-Heavy Rule.**** Archivo is for shapes, labels, numerals and headlines; running text is always Source Sans 3, and no sentence is ever set in Archivo.

****The 0.75rem Floor Rule.**** Running text never drops below 0.75rem. Smaller sizes are uppercase Archivo labels or tabular numerals.

**## Layout**

A single centred column, `min(1240px, 100% - 48px)`, dropping to `min(1240px, 100% - 32px)` at 860px. Everything else is a grid inside that shell.

- ****The ground.**** One radial gradient on `.kb-root`, fixed attachment. Content sits above it at `z-index 1`.

- ****The hero.**** Two columns — a fixed `400px` form and a fluid `1fr` stage — with a 48px gap, 56px top and 80px bottom padding, a minimum height of one viewport minus the 68px nav, and both columns aligned to the same top edge. The stage is itself two columns: a fluid type column and a fixed `min(340px, 30vw)` fox, `align-items: end` so the fox sits on the baseline of the type block. The type column is never capped in `ch`: the `24ch` that once strangled the headline to 191px is a rule for ledes only. At 1080px the cover becomes one column; at 860px the stage dissolves (`display: contents`) so the reading order becomes headline, lede, action, ****form, then fox**** — the primary action never sits below a full screen of mascot.

- ****The page head.**** `1fr` against a fixed 320px lede column, gap 32px, bottom-aligned, closed by a hairline rule with 28px beneath. At 1080px the lede drops under the title.

- ****The record row.**** `96px` date, `150px` stage, `1fr` note, gap 20px, 20px vertical padding, separated by a hairline rule; the first row has no rule. The list is capped at `820px` so the note lands on a 68ch reading measure instead of a 534px cell inside a 1146px card. At 860px it becomes `84px` plus `1fr` and the note and escalation chip drop to the second column via `.kb-record__body`.

- ****The stage rail.**** The three stages of "El recorrido" are not a generic three-column grid: a 1px hairline rail runs across their tops with a 9px violet dot at each column's start, punched out of the rail by a 4px card-coloured ring. The three columns share the rail; the card beneath carries one line each. At 860px the rail disappears and each cell takes a top rule with its dot on it instead.

- ****The index.**** Two columns at 44px gutter, each row a 16px mark column and text; one column at 860px.

- ****The footer.**** `1.4fr` brand plus two equal link columns, 32px gap, one column at 860px, starting 64px below the last page. Where the section nav is absent the grid becomes `2.4fr` + `1fr`.

- ****The nav.**** Sticky, 68px tall, contents in the same shell. Five section tabs on the landing, and none on `/login`, where they would point at anchors that page does not have.

- ****The fox.**** `width: min(340px, 30vw)`, left-aligned in its stage column so it shares an axis with the headline, with a `drop-shadow(0 0 34px rgba(78,122,255,0.5))`. It is the largest single element after the headline, fully inside the first viewport, unobstructed, and not overlapped by the form.

****The 26px Rhythm Rule.**** Top-level sections inside `<main>` are separated by exactly 26px. Card padding scales with `clamp(26px, 3.6vw, 46px)`.

Breakpoints in this stylesheet are ****1080px****, ****860px**** and ****560px****. There are no others.

**## Elevation & Depth**

Depth is tonal and physical. Dark cards rest on the indigo ground with a 1px hairline border. The register panel and the liftable sheet carry the only resting and lifting shadows. The fox carries the single deliberate glow.

**### Shadow Vocabulary**

- ****Page**** (`0 18px 40px rgba(1, 1, 20, 0.55)`): the register panel and every `.kb-card` that participates in the lift interaction.

- ****Lift**** (`0 28px 60px rgba(1, 1, 20, 0.62)`): the top sheet only, while hovered or holding focus within.

- ****Stack**** (`0 18px 40px rgba(1, 1, 20, 0.55)`): the mobile nav dropdown, reused from the page shadow.

- ****Fox glow**** (`0 0 34px rgba(78, 122, 255, 0.5)`): the only glow in the system, applied as a `drop-shadow` filter on the fox image. It is inherited from the legacy treatment and is the only coloured glow permitted.

****The One Glow Rule.**** Shadows are offset and blur only. The fox is the only element that carries a glow, and it is a legacy filter, not a box-shadow.

****The One Shadow Per Surface Rule.**** A dark surface gets either the page shadow or the lift shadow. It never gets both, and it never gets a second decorative shadow.

**## Shapes**

Three radius tokens encode material, and there are exactly three values.

- ****4px**** (`--kb-r-cell`) — small controls: tabs, inputs, tails, index marks, stamps.

- ****12px**** (`--kb-r-control`) — primary controls: buttons, mode switch tray, stacked nav.

- ****20px**** (`--kb-r-card`) — sheets and panels: cards, register panel.

There are no cut edges in this world. The only border-radius outside the tokens is the 2px square on `.kb-index__mark`, which is a geometric motif, not a material radius.

**## Components**

**### Buttons**

Four variants, all Archivo `wdth 90` / `wght 700` at 0.9375rem, all 12px radius, all at least 48px tall with 0 22px horizontal padding, all transitioning colour and transform over 0.18s on the standard ease (`cubic-bezier(0.16, 1, 0.3, 1)`).

- ****Primary (Accent):**** Violet fill with abyss text. Hover lightens to violet-soft and lifts 1px with an 8px shadow. Used for the register submit and full-width Google sign-in.

- ****Quiet (Indigo):**** Transparent with a 16%-violet hairline border and muted text. Hover fills with 10% violet and hot-border. Used for the nav sign-in and the cover secondary action.

- ****Disabled:**** Opacity 0.5, no transform, no shadow, `cursor: not-allowed`. The Apple and store buttons are permanently disabled; the copy says so.

- ****Focus:**** A 2px cyan outline at 2px offset on every interactive element, including tabs, buttons, fields, the mode switch, the grip and the skip link.

**### Inputs / Fields**

A 1px hairline border, 4px radius, 46px minimum height, 0 13px padding, on the panel fill `#1a2455`, in Source Sans 3 at 0.9375rem. The label above is an uppercase Archivo label in muted text. Hover thickens the border to hairline-hot; focus drops the outline and replaces it with a violet border plus a 3px ring of violet at 22%. Placeholder is `#a7abd0`.

The password field is a row: the input flexes, and a 44×44 reveal button with a 1px hairline sits at its right edge.

**### Form Modes**

The register's register/login switch is a two-cell segmented control inside a 12px-radius tray: a 4px cell radius, 38px minimum height. The unselected cell is transparent with muted text; the selected cell is violet with abyss text. It is a real tablist with `aria-selected`, and switching clears fields and messages.

**### Status Notes**

Flat, 4px radius, `10px 12px` padding, 0.8125rem at line-height 1.45, glyph and text aligned top. Error is an `#ff9d8a` wash; success is an `#8ff0c4` wash. Both carry an icon so state survives without colour, sit below the field group, and are never attached to the input's border.

**### Cards / Pages**

Every content section is a dark card with `linear-gradient(145deg, #0d1430, #0b1128)`, a 1px violet hairline, 20px radius, and `clamp(26px, 3.6vw, 46px)` padding. Structure comes from hairlines, not nesting.

The record section is the ****only**** light surface: bone `#f4f1ea` with iron-gall ink, border transparent, radius 20px. It is punctuation, not the base.

**### The Liftable Sheet**

A 44×44 grip at the top-right of the record card: 4px radius, 1px hairline, panel fill at 92% opacity, muted chevron that rotates 180° when pressed. Hovering or focusing within lifts the sheet 10px and swaps to the lift shadow; reduced motion removes the transform and keeps the state. Beneath it sits a real second page pulled up 10px.

**### Navigation**

A 68px sticky bar in abyss at 82% opacity with a 14px backdrop blur and a 16%-violet bottom hairline. Five tabs on the landing — El proceso, El recorrido, El acompañante, Qué obtienes, La app — hairline-separated, 14px horizontal padding, 13px Archivo `wdth 96` / `wght 600` in muted text, and the current tab inverting to a violet fill with abyss text and a 2px violet underline. Every tab id is a real section id: the list is the only source, and `/login` renders no tabs at all rather than pointing at anchors that page does not have.

At 860px the tab row is replaced by a 44×44 toggle whose three bars are 18×1.5px strokes, and the navigation drops below the bar as a stacked panel on solid abyss with the page shadow, rows at least 48px tall, entering with a 0.18s fade and an 8px rise on the standard ease.

**### The Tail Row**

Nine 4px-radius cells in flex, with an accessible name stating how many are cut. A tail is cut when a review closes — never on a timer, never for a streak. There is no animation on the row, no counter, and no congratulation; the component is a record, not a reward. Uncut cells are a 6% violet wash inside a hairline; cut cells are a solid `linear-gradient(160deg, #a99aff, #7c6cff)` with a transparent border. The cut cells carry ****no glow****: the fox holds the One Glow Rule, and a zero-offset halo on nine small cells is decoration, not state. State is read from the fill and the `3 / 9` stamp, not from luminance.

**### The Fox Figure**

The fox image is `width: min(340px, 30vw)`, left-aligned on the stage's baseline, with `filter: drop-shadow(0 0 34px rgba(78,122,255,0.5))`. It is the largest single element after the headline, it sits entirely inside the first viewport at 1440×900, and it is never overlapped by the form.

**### Index Rows and Footer**

Index rows pair a 12px mark (two 2px squares offset 4px on the diagonal, cyan in front, blue behind) with a title and a 46ch note, two to a column. The footer is a hairline, then the isotipo at 40px with the product promise, then two columns of links under uppercase Archivo headings; links are muted, and on hover they go white and underline with a 4px offset. A second hairline closes it above the copyright line and the honest statement that this is a project in active development.

**## Do's and Don'ts**

**### Do:**

- ****Do**** scope every new landing rule to a `.kb-*` class inside the `.kb-root` token scope, and define new values as CSS custom properties there, so the psychologist, user and admin surfaces keep their own world.

- ****Do**** reserve deep blue for secondary layers and the scrollbar only, and cyan for focus rings only.

- ****Do**** give a dark surface exactly one hairline border and one shadow only when it is the register panel or the liftable sheet.

- ****Do**** set every date, count and numeral in tabular figures so the columns stay aligned.

- ****Do**** mark state redundantly — colour plus label plus glyph plus position — so nothing depends on colour alone.

- ****Do**** keep running text in Source Sans 3 at 0.75rem or larger, and cap every measure between 44ch and 68ch.

- ****Do**** disable, rather than hide, what does not exist yet, and say so in the copy next to it.

- ****Do**** label illustrative data as an example in the product itself, with a stamp and a footnote.

**### Don't:**

- ****Don't**** reintroduce neumorphism, paper craft, or cut edges. The ground is indigo, the cards are dark with hairline borders, and the only light surface is bone.

- ****Don't**** reach for the legacy `--neumorphic-*`, `--psy-*` or `--admin-*` token scopes from inside this world; they belong to surfaces this landing does not govern.

- ****Don't**** put a glow on the fox, a gradient on the bone, or a rim light on a cut edge. The fox glow is the only glow, and it is a filter.

- ****Don't**** express progress as a percentage, a bar, a streak, an achievement counter or a locked tier. A tail is cut by a closed review, and a state change changes the page.

- ****Don't**** encode state in colour alone, and don't let a colour be the only difference between two rows.

- ****Don't**** invent metrics, testimonials, user counts, professional names or outcomes. The landing states what exists and says what does not.

- ****Don't**** add a fourth breakpoint, a second font request, or a second `@import`.

- ****Don't**** lift this world onto the user, psychologist or admin surfaces without a deliberate decision — they have their own, and this file does not describe them.
