# Design

Visual system for Vocabularify. Theme name: **Obsidian** (dark, default) / **Alabaster** (light).
Color strategy: *Restrained* — deep neutrals carry the surface, one warm brass accent does all
the work (selection, progress, focus, current state). All colors authored in OKLCH.

## Theme

Dark, cinematic, default. A near-black field with a faint top vignette and a soft brass glow
behind the word; luminous warm-ivory type. Light theme is a true off-white (cool, not cream)
counterpart. The theme is shared by all four windows via the same token names; the main card
and Settings honor the user's Light/Dark choice, About/Import ship Obsidian.

## Color tokens

### Obsidian (dark — `body.dark`, the default)
| Token | OKLCH | Role |
| --- | --- | --- |
| `--bg` | `oklch(0.18 0.012 264)` | base field |
| `--bg-elev` | `oklch(0.225 0.014 264)` | top of vignette / raised |
| `--surface` | `oklch(0.235 0.013 264)` | cards, panels |
| `--surface-2` | `oklch(0.205 0.012 264)` | sidebar, inputs, chips |
| `--ink` | `oklch(0.965 0.014 90)` | the target word (warm ivory) |
| `--text` | `oklch(0.92 0.008 264)` | general text |
| `--muted` | `oklch(0.70 0.012 264)` | source word, labels |
| `--accent` | `oklch(0.80 0.085 82)` | brass — selection, progress, focus, state |
| `--accent-ink` | `oklch(0.20 0.02 80)` | text on a brass fill |
| `--hairline` | `oklch(1 0 0 / 0.09)` | 1px separators / borders |
| `--glow` | `oklch(0.80 0.085 82 / 0.16)` | radial accent glow behind the word |

### Alabaster (light — `:root`)
| Token | OKLCH | Role |
| --- | --- | --- |
| `--bg` | `oklch(0.975 0.003 264)` | off-white field (cool, not cream) |
| `--bg-elev` | `oklch(0.99 0.002 264)` | raised |
| `--surface` | `oklch(1 0 0)` | cards, panels |
| `--surface-2` | `oklch(0.955 0.004 264)` | sidebar, inputs, chips |
| `--ink` | `oklch(0.20 0.014 264)` | the target word |
| `--text` | `oklch(0.28 0.012 264)` | general text |
| `--muted` | `oklch(0.50 0.012 264)` | source word, labels (AA on bg) |
| `--accent` | `oklch(0.55 0.10 70)` | bronze — selection, progress, focus, state |
| `--accent-ink` | `oklch(0.99 0 0)` | text on an accent fill |
| `--hairline` | `oklch(0 0 0 / 0.10)` | 1px separators / borders |
| `--glow` | `oklch(0.55 0.10 70 / 0.10)` | radial accent glow |

## Typography
- One family: SF Pro via the `-apple-system` stack (offline-safe, native macOS). No web fonts.
- **Target word** (`#target`): weight 600, `letter-spacing: -0.02em`, `text-wrap: balance`, fluid
  `clamp()` (this is the one brand moment that earns fluid sizing); on dark a subtle luminous
  `text-shadow` glow.
- **Source word** (`#source`): weight 500, `--muted`, `letter-spacing: 0.01em`.
- **Settings**: fixed rem-ish scale (14px base), product-register density. Tabular numerals on counters.

## Motion
Easing tokens: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` (expo-out, no bounce),
`--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`.

- **Focus-pull** (the signature): on each new word, `#phrase-container` resolves from
  `opacity:0; translateY(8px); blur(6px)` → crisp, ~380ms `--ease-out`. The Checkup reveal of
  `#target` uses the same blur→crisp settle. This is the *only* choreographed motion.
- **State feedback** (Settings): 150–200ms `--ease-out`. Hover lifts a card 1px; `:active`
  presses to `scale(0.97)`; selection = accent border + inset ring + accent-tinted fill; inputs
  get a 3px accent focus ring. Panels crossfade in on tab change (~180ms).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` drops all transform/blur; the
  focus-pull becomes a plain opacity crossfade.

## Components
Buttons, chips, language cards, toggle, number input, nav items each define default / hover /
focus-visible / active / selected / disabled. Brass is reserved for active/selected/primary —
never decoration. No glassmorphism, no gradient text, no side-stripe accents.
