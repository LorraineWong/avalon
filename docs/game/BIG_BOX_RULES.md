# Avalon Big Box Rules Coverage

This implementation follows the printed **Avalon Big Box Edition Rulebook**. The publisher's sell sheet is used only to confirm the product contents; when marketing copy and the printed rules differ, the printed rulebook wins.

Primary references:

- [Avalon Big Box Edition Rulebook (scanned printed rulebook)](https://tesera.ru/images/items/2179119/Avalon%20Big%20Box%20Edition%20Rules.pdf)
- [Indie Boards & Cards sell sheet](https://acd-distribution-llc-1-b2b.mybigcommerce.com/content/sell_sheets/IBCAVABB1_Sell_Sheet.pdf)

## Implemented characters

| Character             | Loyalty  | Implemented rule                                                                                                                                                                                                   |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Good / Evil Lancelot  | One each | Base mode: they know each other. Allegiance variant: they do not know each other; one public Allegiance card is drawn before every Quest and a Switch swaps their current loyalties.                               |
| Lunatic               | Evil     | Must play Fail on every Quest they join.                                                                                                                                                                           |
| Brute                 | Evil     | May play Fail only on Quests 1–3.                                                                                                                                                                                  |
| Revealer              | Evil     | Is publicly exposed after the second failed Quest.                                                                                                                                                                 |
| Cleric                | Good     | Privately learns the initial Leader's displayed loyalty during setup.                                                                                                                                              |
| Trickster             | Evil     | Chooses whether to display Good or Evil when checked.                                                                                                                                                              |
| Troublemaker          | Good     | Must display Evil when checked.                                                                                                                                                                                    |
| Untrustworthy Servant | Good     | Knows the Assassin; appears Evil to Merlin; cannot play Fail. After three successful Quests, the Assassin first tries to identify them. A correct guess recruits the Servant, who then performs the assassination. |

The existing Merlin, Percival, Morgana, Mordred, Oberon, Assassin, Loyal Servant, and Minion rules remain available.

## Implemented modules

### Lady of the Lake

Available in this website with 7–10 seated players. The system assigns the
initial holder. After Quests 2, 3 and 4, if play continues, the holder privately
checks an eligible player's displayed loyalty and passes the token to them.
Current and former holders cannot be checked. A check reveals loyalty, not a
specific character, and preserves the Trickster/Troublemaker exceptions.

### Excalibur

During Team Building, the Leader assigns Excalibur to a Team member other than themself. After all Quest cards are played, the holder may switch one other Team member's played card with their unplayed card, or decline to use Excalibur. The switched card is then used to resolve the Quest.

## Rulebook details preserved in the UI

- Role knowledge and loyalty checks remain private and encrypted to the correct player.
- Lancelot Allegiance draws and Revealer exposure are public events.
- The Trickster actively chooses what a loyalty check reports; this is not randomized.
- The Cleric checks only the initial Leader during setup, not a new Leader every round.
- The Brute's restriction is based on the Quest number, not the number of failed Quests.

## Not implemented yet

- Rogues
- Sorcerers
- Messengers
- Plot cards
- Lady of the Sea
- Trapper

The publisher sell sheet mentions a **Deceiver**, but the printed rulebook's component list and character rules do not define a Deceiver card. It is therefore not implemented until an official rule or erratum establishes its behavior.


## Player-count and guide reference

The website starts with 5–10 seated players, including the host. Quest team
sizes and faction totals come from `SIZES` and `EVIL_N` in `site/assets/js/app.js`.
Only Quest 4 at 7–10 players needs two Fail cards. Excalibur and the Lancelot
pair can be selected at 5–10 players when the role selection fits both faction
budgets; selecting the Lancelot pair does not increase the player count.

The seven static guides distinguish supported options from unavailable
extensions and provide separate module references and player-count guidance.
Original Lady/Excalibur guide illustrations live in `site/assets/modules/` and
are covered by the image exclusion in `site/assets/LICENSE.md`, not MIT.
