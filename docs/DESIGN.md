# Avalon UI / UX System

## Direction

The interface is a playable Arthurian social-deduction table, not a generic dark dashboard. The visual story is built around three materials: carved oak for the public table, parchment for readable information, and antique gold for decisive actions. Good and Evil are supporting semantic colors rather than the entire palette.

Source audited: <https://lorrainewong.github.io/avalon/> (desktop capture, 1440 px wide, 2026-11-12). The original interface used a cool blue glass system, Cinzel/Inter typography, emoji role markers, a two-column home form, a circular game table, and modal card flips. The game structure and interaction model are retained; the presentation layer is replaced.

## Tokens

| Role | Value | Usage |
| --- | --- | --- |
| Night | `#0b0907` | page background |
| Walnut | `#251a11` | panels and carved table |
| Parchment | `#f1e7cf` | primary copy |
| Antique gold | `#d6b566` | primary action, focus, leader state |
| Moonsteel | `#a7c2ce` | Good alignment |
| Oxblood | `#d58b75` | Evil alignment |
| Moss | `#7fa681` | online / connected |

Borders use translucent antique gold. Surfaces use a small 4–10 px radius to feel constructed rather than glassy. Shadows are deep and soft, with a restrained inner highlight.

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

Seventeen original, project-specific 3:4 portraits live in `assets/roles/`. They share painterly medieval realism, candlelight and moonlight, antique-gold detailing, and consistent Camelot architecture. Good roles lean toward ivory, blue steel, and forest green; Evil roles lean toward oxblood, blackened metal, and violet shadow.

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
