# Test coverage

Three methods are used. Each scenario below names the strongest method that has covered it.

| Method    | What it is                                                                                                                                                                                                                                                                             | Does not exercise                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Auto**  | `node tests/run-all.mjs`. The multi-client flow test runs the unmodified `assets/js/app.js`, including `boot()`, once per player in separate `node:vm` contexts sharing an in-memory stand-in for Firebase. Actions are dispatched only through controls present in the rendered HTML. | Live Firebase, security rules, real network timing, layout. |
| **Live**  | Isolated Chrome contexts against live Firebase, one 1280 × 900 host and 390 × 844 mobile clients, mixed English and Chinese.                                                                                                                                                           | —                                                           |
| **Rules** | `node tests/run-all.mjs --live` runs the security-rules smoke test against the configured Firebase project. Results are not recorded here.                                                                                                                                             | Game flow.                                                  |

## Coverage

| Scenario                                                                                   | Method     | Result       |
| ------------------------------------------------------------------------------------------ | ---------- | ------------ |
| Three successful quests, Assassin picks Merlin → Evil wins                                 | Live       | Passed       |
| Three successful quests, Assassin misses → Good wins                                       | Auto       | Passed       |
| Five consecutive rejections → Evil wins                                                    | Live       | Passed       |
| Three failed quests → Evil wins                                                            | Live       | Passed       |
| Rematch in the same room                                                                   | Live       | Passed twice |
| Every client decrypts exactly its own role; none can decrypt another's or the host's table | Live, Auto | Passed       |
| Quest 4 with one Fail at seven players → quest succeeds                                    | Auto       | Passed       |
| Quest 4 with two Fails at seven players → quest fails                                      | Auto       | Passed       |
| Host loses connection during a vote, then reconnects                                       | Auto       | Passed       |
| Host closes the page during a quest and reopens the link                                   | Auto       | Passed       |
| Seven-player expanded-role game reaching the Untrustworthy Servant sequence                | Live       | Passed       |
| Revealer exposed on the second failed quest                                                | Live       | Passed       |
| Trickster chooses displayed loyalty; Troublemaker forced to Evil                           | Live       | Passed       |
| Assassin identifies the Servant; recruited Servant assassinates Merlin                     | Live       | Passed       |
| Excalibur switches a card; Excalibur declined                                              | Live       | Passed       |
| No horizontal overflow at 390 px, game and expansion settings                              | Live       | Passed       |
| No console errors or warnings                                                              | Live, Auto | Passed       |
| Big Box character and module invariants (16 assertions)                                    | Auto       | Passed       |

## No recorded pass

This file has no record of the following. They may have been tried informally, but treat them as untested.

- Quest 4's two-Fail rule and host reconnect played by hand against live Firebase; they are covered by Auto only.
- Lancelot Allegiance switching through the complete live UI.
- Eight- to ten-player games against live Firebase.
- Intentional host handoff against live Firebase.
- The five languages added after these passes (繁體中文, Русский, Español, Português, Tiếng Việt) in a live game.
- Visual regression: there is no automated layout or screenshot check.

## Run log

| Date        | Pass                                                            | Notes                                                                                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13 Nov 2026 | Classic, five clients, production GitHub Pages                  | 3 complete games, 42 synchronized state checks, 0 console errors, 0 overflow failures. Three mobile layout issues found and fixed: the action dock's bottom reservation leaking into home and lobby, the end-of-game card covering history, and low contrast on the end-state overlay. |
| 13 Nov 2026 | Big Box, seven clients, local build against production Firebase | All expansion scenarios above passed; classic regression repeated.                                                                                                                                                                                                                     |
