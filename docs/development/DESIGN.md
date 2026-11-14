# Avalon UI / UX System

## Direction

The interface is a playable Arthurian social-deduction table, not a generic dark dashboard. The visual story is built around three materials: carved oak for the public table, parchment for readable information, and antique gold for decisive actions. Good and Evil are supporting semantic colors rather than the entire palette.

Source audited: <https://lorrainewong.github.io/avalon/> (desktop capture, 1440 px wide, 2026-11-12). The original interface used a cool blue glass system, Cinzel/Inter typography, emoji role markers, a two-column home form, a circular game table, and modal card flips. The game structure and interaction model are retained; the presentation layer is replaced.

## Themes and tokens

Every page supports a light and a dark theme. `site/assets/js/site-shell.js` sets `data-theme` on `<html>` before first paint: it follows the system preference until the player uses the theme toggle, then remembers the choice in `localStorage` (`lwav.theme`).

Colours are defined once as semantic tokens in `site/assets/css/theme.css`, which also maps the older variable names used in `site/assets/css/style.css` and `site/assets/css/landing.css` onto them. Components use tokens, not raw hex values. When adding a colour, define it for both themes and check text contrast in each.

| Token                        | Light                 | Dark                  | Usage                               |
| ---------------------------- | --------------------- | --------------------- | ----------------------------------- |
| `--page`                     | `#f6f3eb`             | `#18212b`             | page background                     |
| `--surface`                  | `#fffdf8`             | `#232f3c`             | cards and panels                    |
| `--surface-raised`           | `#eee9dd`             | `#2b3948`             | controls, raised elements           |
| `--ink`                      | `#293542`             | `#edf1f5`             | primary text                        |
| `--ink-muted`                | `#526170`             | `#bbc7d3`             | secondary text                      |
| `--accent`                   | `#78551d`             | `#e7c77f`             | primary action, focus, leader state |
| `--border`                   | `#d5cdbd`             | `#46576a`             | dividers and outlines               |
| `--good-ink` / `--good-wash` | `#235e78` / `#e4eff3` | `#9ed5ed` / `#203e4b` | Good alignment, success, approval   |
| `--evil-ink` / `--evil-wash` | `#963e36` / `#f7e7e1` | `#f3ae9d` / `#492f34` | Evil alignment, failure, rejection  |
| `--success`                  | `#35623e`             | `#b4d9b2`             | online / connected                  |

Surfaces use a small 4–10 px radius.

## Icons

Controls use one inline SVG line-icon set, defined as `ICONS` in `site/assets/js/app.js` and drawn with `currentColor`, so icons follow the theme and do not depend on how a platform renders emoji. Add new icons to that set.

## Typography

- Display: Cinzel, for the wordmark, phase titles, role names, and major labels.
- Story: Cormorant Garamond / Noto Serif SC, for lore and rules.
- UI: Inter / Noto Serif SC, for controls, status, codes, and compact data.

## Layout

- Home: a cinematic conflict panel with Merlin and Morgana framing a central oath and product promise; room actions follow immediately below.
- Lobby: room invitation first, players and role configuration second, rules last.
- Game: the shared round table remains the primary visual object; the current action and private role stay in the right rail on desktop and in a bottom action dock on mobile.
- Mobile: essential actions remain thumb-reachable. Decorative art is cropped rather than removed, so the world remains present without reducing legibility.

## Components

- Crest: gold shield with a `V` monogram, used for brand and concealed-card states.
- Primary button: gold metal, dark label, used only for the next decisive action.
- Alignment actions: moonsteel for success/approval and oxblood for failure/rejection.
- Role tile: portrait-led toggle with alignment rail and clear selected state.
- Role reveal: full-bleed portrait, bottom gradient, alignment and localized role name.
- Quest token: wax/metal medallion states for pending, current, success, and failure.
- Player seat: heraldic medallion, carved nameplate, leader/action/online badges.

## Character Art

Seventeen original, project-specific 3:4 portraits live in `site/assets/roles/`. They share painterly medieval realism, candlelight and moonlight, antique-gold detailing, and consistent Camelot architecture. Good roles lean toward ivory, blue steel, and forest green; Evil roles lean toward oxblood, blackened metal, and violet shadow.

The art is intentionally text-free so localization remains native HTML and accessible. WebP derivatives are 768 px wide and used in the UI; source PNGs are not required at runtime.

## Accessibility and Interaction

- Text remains HTML rather than baked into art.
- Focus, selected, success, and failure states use shape/border changes in addition to color.
- Existing `prefers-reduced-motion` support remains.
- Role portraits include localized alt text.
- Private information appears only through the existing reveal flow; the visual redesign does not change encryption or game-state behavior.

## Implementation Notes

The redesign is CSS and rendering-markup only. Firebase, ECDH/AES role encryption, room state, game rules, reconnect behavior, and game-state identifiers remain intact. The maintainer confirms that site images were generated with GPT; development primarily uses Claude Code and OpenAI Codex. No official board-game card artwork is used.

## Compact header controls

Language, display theme, online status and in-game privacy controls share a 40px height and 8px corner radius. On mobile the status is a 40px square with a visible dot and an accessible status label. Language uses a representative flag and the selected language’s abbreviation; other options show flags and native language names.

Long translated headings wrap inside their component. Russian and Vietnamese headings use the interface font for consistent character coverage. Changes to language or theme preserve the current form values and selected team.

## Guide section navigation

The guide uses a sticky, compact section rail with `aria-current="location"` and a separate Play action. On narrow screens the section links scroll horizontally while Play stays visible. All targets are at least 40px high, use the shared theme tokens, and have inset keyboard focus. Sections reserve space below the sticky bar when reached by an anchor link.

## Mobile site menu

At widths up to 600px, a 40px menu button opens a native modal dialog at the right edge. Theme switching moves into this drawer; language and connection status remain in the header. The dialog supports Escape, a labelled close control, backdrop dismissal and native focus containment. It lives outside the game render tree so live room updates do not remove it. In-room links open new tabs, preserving the current room.
