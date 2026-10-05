---
version: 1
slug: "landing"
primary_target: "landing"
related_targets: []
---

# Landing pública

## Scope and visitor mode

Route: `/` (`frontend/src/pages/HomePage.tsx`) plus `frontend/src/components/landing/`, `frontend/src/components/PublicHeader.tsx`, `frontend/src/components/PublicFooter.tsx` and `frontend/src/styles/landing.css`.
Mode: **Persuade**. The visitor decides whether to register.

## Chosen direction: superseded, and why

The first round of this surface shipped a "papel picado + bitácora" world: bone paper sheets, a ruled ground, cut-paper edges, a paper registration panel. Seed key `1b7b7c59`.

**The user rejected it on sight.** Their words: the cards look antiquated, nothing modern, and the fox disappeared behind the registration form so the identity was lost. They pointed at `Mockups/Mockups Public/*.png` as the record of how the page was meant to look.

That is evidence against the shipped world, and it outranks anything produced in the previous round. The material was wrong: the product's identity is a **deep near-black indigo ground with violet and blue accents**, and a paper-craft material inverts that relationship into something dated. The bitácora survives as the *product concept* (dated records, the escalation moment). The material does not survive.

## Evidence the corrected world is built from

Extracted programmatically from the eleven public mockups, because the build runs blind:

- Ground: `#000020`, `#000030`, `#000040`, `#000010` account for roughly 55% of every screen. Light surfaces are a minority accent, not the base.
- Bright accents are entirely in the blue band: 240deg (violet) holds about 79% of saturated-bright pixels, 220deg (blue) about 20%. Cyan at 180deg is effectively absent at 0.2%.
- Dominant bright accent values cluster on `#7860f0`, `#6060f0`, `#7878f0`, which is the `#7c6cff` brand violet family, with `#3030a8`, `#3048d8` as the deeper blue.
- Hero composition, from a luminance grid over the top 900px of `Public 0.png`: a mid-luminance panel occupying the **left** columns across the middle rows, and a separate block on the **right** carrying the accent and the only near-white pixels. The hero is a **split**: form left, illustration right, and the two never overlap.
- Section rhythm: `Public 0.png` is 5317px tall and resolves into about ten luminance bands, of which four are light. The light blocks are punctuation roughly every 1300px.

## Brand commitments

Purple and cyan survive as brand. Cyan is demoted to a tertiary role (focus rings only) because the mockups do not carry it. The fox and the logo rasters in `frontend/public/brand/` are brand and survive. Spanish throughout. WCAG AA. Body background, page height and existing routes stay intact.

## Raises held from declined systems

- **barrido, no lectura** (VU meter bridge): progress is read at a glance from a row, never as a percentage that must be interpreted.
- **el estado cambia el carácter** (mecha crisis wall): escalation changes the character of the page; no counter appears.
- **señal redundante** (chromatophore skin): no state depends on colour alone.

## Direction contract

**THESIS.** The landing is the product's original identity executed with today's craft: a near-black indigo ground, violet and blue light on it, the fox large and unobstructed beside the registration form, and one light surface per page run carrying the bitácora. The record is the concept that survives: a dated entry where the process changes state and a person appears. No paper craft, no cut edges, no dated material.

**OWN-WORLD.** Ground `radial-gradient(circle at 14% -6%, #07186b, #020535 42%, #010114)`, inherited from the legacy and confirmed by the mockups. Cards `linear-gradient(145deg, #0d1430, #0b1128)` with `1px solid rgba(124,108,255,0.2)` hairlines. Accent violet `#7c6cff` dominant, deeper blue `#3048d8` for secondary layers and scrollbar only, since it measures 3.00:1 on the ground and cannot carry text. Cyan `#5ddcff` reserved for focus rings. Body text `#c7d2fe` at 13.86:1, muted `#a9b4e0` at 8.87:1, primary action `#7c6cff` carrying ground-ink text at 5.36:1. On bone the accent darkens to `#5741d6` at 5.94:1, because `#7c6cff` measures 3.42:1 there. Exactly one light block per run, bone `#f4f1ea` with iron-gall ink, reserved for the record. Radii: 4px controls, 12px controls, 20px cards. One soft shadow with offset and blur per surface; the fox carries the legacy violet-blue glow and is the only glow in the system. Archivo variable for display and numerals, Source Sans 3 for running text.

**STORY.** The visitor learns that Kitsunova records what they do and that there is a person when recording stops being enough. They see one dated entry whose note says the situation moved past self-management and a psychologist appears beside it. They register in the same first viewport, in a panel that never covers the fox.

**FIRST VIEWPORT.** Two columns of unequal weight, tops aligned. Left: a fixed 400px registration panel in a dark card with a violet hairline, four fields, mode switch, primary action, fully above the fold. Right: a 1fr stage split again into a fluid type column and a 340px fox. The headline sets in condensed Archivo at 420px and four lines; the lede runs 46ch under it; one quiet secondary action closes the block. The fox sits on the baseline of that block, fully inside the first viewport, unobstructed. At 860px the stage dissolves and the order becomes headline, lede, action, **form, then fox**, so the primary action never waits behind a screen of mascot.

**FORM.** Chosen by explicit user pin after the seeded round, corrected by user evidence from the mockups. Build path code-led: no image generation on this machine. Verification is structural only, because no headless browser is installed and the agent cannot see renders; contrast was computed numerically instead of sampled from a screenshot.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- The mobile store buttons stay disabled: there is no app, and the section says so in a line under the buttons.
- No favicon, no app icons, no vector sources exist; assets stay raster.
- Whether the same world reaches the psychologist, user and admin surfaces is a later round. Those three surfaces still carry the old neumorphic tokens in `frontend/src/styles/global.css`, which is pre-existing drift.
- Screenshot review by eye is still outstanding. The surface was measured in a real headless Chromium render at 1440, 1280, 900 and 390px — computed styles, box geometry, contrast, tab order, console output — but the reviewing model cannot read images, so nobody has *looked* at it.

## Revision: 2026-10-05, after a measured critique

The first shipped composition failed on one CSS line: `.kb-cover__type { max-width: 24ch }`. `24ch` of Source Sans 3 at 16px is 190.86px, so a 56px headline wrapped to nine lines inside a 191px column in a 762px column, pushed the lede to ten lines, and drove the fox to `y=1062` — below the fold. The `24ch` was always a lede rule and had leaked onto the display container.

Measured before → after, at 1440×900:

| | before | after |
|---|---|---|
| h1 box | 191×544, 9 lines | 420×242, 4 lines |
| lede | 191 wide, 10 lines | 389 wide, 5 lines, 46ch |
| fox | 430px at y=1062, under the fold | 340px at y=236, inside it |
| register panel | 430×715, floating on `align-items:center` | 400×710, top-aligned with the headline |
| hero section | 1504px | 846px |
| page | 4843px | 4211px |
| mobile page | 6569px, form at y=1056 | 5927px, form at y=514, email field at y=693 |
| nav | 4 tabs for 6 sections, 2 orphans | 5 tabs, 5 real ids, 0 dead anchors |
| escalation signal | 6px `#e7e2ec` border at 1.13:1 | `rgba(124,108,255,0.14)` fill, ink at 6.09:1 |
| label on bone | `#7c6cff` at 3.42:1 | `#5741d6` at 5.94:1 |
| record note | 432px inside an 860px cell, 428px of dead space | 534px filling its cell, list capped at 820px |
| console | React `fetchPriority` warning | clean |
| inline styles | 2 | 0 |

Also removed: `siteNavigation` and five unused content exports, both non-`field` branches of `PublicHeader` and `PublicFooter`, and the glow on the three cut tails — which contradicted this document's own One Glow Rule. A pre-existing mobile bug was found on the way: the record row's unclassed wrapper dropped into the 84px date column, so notes rendered in an 84px ribbon on phones. Now `.kb-record__body` holds the second column, and the note measures 216px.

`impeccable detect` is clean on the surface. Eight `LoginPage.test.tsx` tests fail, all pre-existing: the previous round renamed "Registrarse" to "Crear cuenta" and "…" to "..." without touching the test file.
