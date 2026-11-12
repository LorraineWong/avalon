# Multiplayer Playtest — 13 November 2026

## Environment

- Production GitHub Pages build
- Five isolated Chrome browser contexts
- One 1280 × 900 host viewport
- Four 390 × 844 mobile viewports
- Mixed English and Simplified Chinese clients
- Live Firebase Authentication and Realtime Database

## Completed Scenarios

| Scenario | Expected result | Actual result |
| --- | --- | --- |
| Three successful quests, Assassin selects Merlin | Evil wins by assassination | Passed |
| Five consecutive team rejections | Evil wins immediately | Passed |
| Evil submits one Fail on three quests | Evil wins after three failed quests | Passed |
| Host selects “Play again” after a completed game | Same room returns to the lobby | Passed twice |
| Private role delivery | Every client decrypts exactly one role | Passed |
| Responsive game layout | No horizontal overflow at 390 px | Passed on four clients |

## Result

- 3 complete games
- 42 synchronized state checks
- 0 page exceptions
- 0 browser console errors or warnings
- 0 horizontal-overflow failures

## UI Issues Found and Fixed

1. Mobile home and lobby views inherited the gameplay action dock's 260 px bottom reservation.
2. The completed-game action card remained fixed at the bottom on mobile and could cover long game-history content.
3. The end-state overlay allowed too much background detail through, reducing result-card contrast.

## Not Covered in This Pass

- Seven-to-ten-player sessions
- Lady of the Lake inspection flow
- Quest 4's two-Fail rule through the complete UI
- Host reconnect after a deliberate network interruption

Those paths are supported by the game engine but should receive a dedicated multi-client regression pass before larger public playtests.
