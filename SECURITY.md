# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for an unpatched vulnerability. Use GitHub's **Report a vulnerability** feature on the repository's Security tab so the report and any proof of concept remain private.

Include the affected URL or room flow, reproduction steps, expected impact, and browser details. Do not access other players' rooms or data while testing.

## Firebase Web API Key

The Firebase Web API key in `app.js` is a public client identifier, not an authorization credential. Firebase documents that Web API keys are public by design and that access to Realtime Database must be enforced with Authentication, Security Rules, and App Check.

The production key must:

- be restricted to the Firebase APIs required by this application;
- never allow the Generative Language API or unrelated Google APIs;
- be paired with the deployed `database.rules.json` rules;
- be monitored through Firebase App Check before enforcement is enabled.

Moving this key to a frontend environment variable would not make it secret because every browser must receive it.

## Data and Trust Model

- Every player signs in with Firebase Anonymous Authentication.
- Realtime Database rules deny unauthenticated room reads.
- Only the room host can write game state and encrypted secret payloads.
- A player can write only their own seat and presence records; the host may remove seats.
- Role and action payloads use ECDH P-256 and AES-GCM in the browser.

This model does not protect against a compromised host browser, malicious code served from the hosting origin, or a player modifying their own client.

## Verification

Run the production-rule smoke test with Node.js 18 or newer:

```bash
node scripts/security-smoke-test.mjs
```

The test creates a temporary room and two anonymous users, verifies allowed and denied operations, then removes the room data and test accounts.

