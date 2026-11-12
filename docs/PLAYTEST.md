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

## Not Covered in the Original Classic Pass

- Quest 4's two-Fail rule through the complete UI
- Host reconnect after a deliberate network interruption

The later Big Box pass added seven-player and Lady of the Lake coverage.

## Big Box Regression Pass

The expansion implementation was tested from the current local build against the production Firebase project. The repository was private during this pass, so GitHub Pages itself returned 404 and was not used as the page host.

| Scenario | Expected result | Actual result |
| --- | --- | --- |
| Seven-player expanded-role game | Two failed quests followed by three successes reaches the Untrustworthy Servant sequence | Passed |
| Revealer on the second failed quest | Identity becomes public immediately | Passed |
| Trickster loyalty inspection | Trickster chooses the displayed loyalty | Passed |
| Troublemaker loyalty inspection | Displayed loyalty is forced to Evil | Passed |
| Assassin identifies the Untrustworthy Servant | Servant changes to Evil and takes over the assassination | Passed |
| Recruited Servant selects Merlin | Evil wins by assassination | Passed |
| Excalibur switches another player's Success card | Card becomes Fail and the quest fails | Passed |
| Excalibur holder declines to use the sword | Cards remain unchanged and the quest succeeds | Passed |
| Expansion settings on a 390 px viewport | No horizontal overflow; all role art loads | Passed |

Additional automated coverage:

- 16 Big Box rules-engine assertions
- 17 role-art assets verified
- 16 expansion setting tiles verified
- Three classic five-player regression games and 42 synchronized state checks repeated successfully
