# Optional gameplay events

There is no analytics SDK or tracking service in the site. `recordEvent` in
`site/assets/js/app.js` is disabled unless the owner supplies a first-party
`window.AvalonAnalytics.track(name, fields)` callback before the game boots.
It makes no network requests itself, does not queue events for later delivery,
and does not write analytics storage while disabled. Callback failures cannot
interrupt a game.

## Event definitions

| Event | Successful operation | Emitter |
| --- | --- | --- |
| `room_created` | Room reserved and creator's seat written | Creating browser |
| `room_joined` | A new seat written; reopening an existing seat is excluded | Joining browser |
| `game_started` | Roles, host recovery payload and public game atomically committed | Starting host |
| `game_completed` | Public end state acknowledged by the backend | Host that completes the game |
| `rematch` | Ended game reset to lobby, clearing secrets in the same update | Host |
| `invite_shared` | Clipboard or native share promise resolved | Browser handling the gesture |

All events contain only `language`. Games may add integer `player_count` (5–10),
invitations may add `method` (`copy`, `code`, `native`), and matched campaigns
may add the configured `campaign` label. Native share resolution reports the
browser API result; it cannot establish that a recipient opened the invitation.
Canceled/failed shares and manual fallback displays do not count as successful
shares. Room/seat events describe acknowledged writes; a later kick or host
rejection of a racing duplicate does not retract the earlier event.

Do not pass nicknames, notes, role/allegiance data, player IDs, room codes, game
IDs or complete invite URLs to the callback. The implementation projects allowed
fields rather than spreading arbitrary room state. It never sends raw UTM
parameters. Invitation URLs keep their functional language/hash and deliberately
drop incoming campaign/private parameters.

Game-start, completion and rematch events use the local game's ID only as a
local deduplication key; it is never delivered to the callback. The bounded last
100 keys live in `lwav.events`. Events fire after acknowledged operations, not
on render/sync/refresh, so reconnecting clients do not report the same game.
Only the host that writes a game transition emits that game event. This is
best-effort client measurement, not a server-level exactly-once delivery system:
closing a tab between a successful write and callback can lose an event, and
clearing storage removes deduplication history. There is no durable delivery
queue or cross-device identity.

## Owner configuration

Define a callback only after choosing an endpoint/service and reviewing its
privacy behavior. For example, a local first-party integration could expose:

```js
window.AvalonAnalytics = {
  track(name, fields) {
    // Forward only this explicit payload to the owner's chosen integration.
    // No service or endpoint is selected by the application.
  }
};
window.AVALON_CAMPAIGNS = {
  friends_newsletter: {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'friends'
  }
};
```

Use nonpersonal campaign labels (`a-z`, digits, `_` and `-`, up to 40 characters)
and nonpersonal configured UTM tuples. A tuple must match all three parameters;
unknown values are ignored. The matched label persists in `lwav.campaign` for
subsequent local events while that label remains configured. This is the last
recognized campaign, not a full multi-touch attribution model. Nothing changes
how `?lang=...#ROOM` invitations join rooms. A future enabled integration needs
its own privacy/consent review and accurate policy updates; none is activated
by this change.
