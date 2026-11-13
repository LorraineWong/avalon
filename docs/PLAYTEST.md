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

Neither item has been played by hand in real browsers against live Firebase. Both are now covered by an automated multi-client test instead; see the next section.

## Automated Multi-Client Flow Test

`node tests/multiplayer-flow-test.mjs` runs the unmodified `app.js`, including `boot()`, once per player in separate `node:vm` contexts. The contexts share an in-memory stand-in for Firebase Realtime Database. Every action goes through the rendered UI: a click is dispatched only when the matching enabled control is present in the HTML that client rendered.

| Scenario | Expected result | Actual result |
| --- | --- | --- |
| Seven players, Quest 4 team plays exactly one Fail | Quest succeeds; every client shows the two-Fail note and the result reminder | Passed |
| Same game, third success | Assassination phase; Assassin misses Merlin and Good wins | Passed |
| Seven players, Quest 4 team plays two Fails | Quest fails; Evil wins on three failed quests | Passed |
| Five players, host loses its connection during a vote | Others see the host offline; the vote waits; the host's queued vote is counted after reconnecting | Passed |
| Five players, host closes the page during a quest and reopens the room link | Stored key pair is reused, the role table decrypts, no second night overlay, the quest resolves and the next quest plays normally | Passed |

The run also checks that a player cannot decrypt any other role or the host's role table, and that no client logs a console error or warning.

Limits of this test:

- It does not use live Firebase, so database security rules and real network timing are not exercised.
- Writes made while offline are queued and applied on reconnect, without the optimistic local events the real SDK fires.
- There is no layout or visual check; it reads the generated HTML only.

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
