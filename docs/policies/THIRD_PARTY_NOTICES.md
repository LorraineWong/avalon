# Third-party notices

These notices apply to the named dependencies, not to Avalon Online as a whole.
The project's own source code and documentation are under the [MIT License](../../LICENSE);
its images are excluded, as described in [NOTICE](../../NOTICE) and
[site/assets/LICENSE.md](../../site/assets/LICENSE.md).

## Firebase JavaScript SDK

`site/vendor/firebase-app-compat.js`, `site/vendor/firebase-auth-compat.js` and
`site/vendor/firebase-database-compat.js` and `site/vendor/firebase-app-check-compat.js` bundle Firebase's compatibility SDK. The app
bundle identifies the SDK version as 10.14.1.

Firebase is distributed under Apache-2.0, with additional dependency notices in
the upstream licence file. A complete copy is included in
[FIREBASE-LICENSE.txt](../licenses/FIREBASE-LICENSE.txt).

Source and versioned notices:
https://github.com/firebase/firebase-js-sdk/tree/firebase%4010.14.1

## QRCode.js

`site/vendor/qrcode.min.js` is QRCode.js 1.0.0, distributed under the MIT License.

Copyright © 2012 davidshimjs

Source: https://github.com/davidshimjs/qrcodejs

The full licence is included in [QRCODE-LICENSE.txt](../licenses/QRCODE-LICENSE.txt).

## Web fonts

The site requests Cinzel, Cormorant Garamond, Inter and Noto Serif SC from Google
Fonts. Font files are served by Google, not bundled in this repository. Their
upstream font sources and licence files are available through the
[Google Fonts repository](https://github.com/google/fonts). A future self-hosted
font copy must include its applicable licence.

## Project artwork and game rights

The maintainer confirms that site images were generated with GPT, and that
no official board-game card artwork is used. Development primarily uses Claude
Code and OpenAI Codex. These creation credits are not an endorsement by the tool
providers. The code, artwork and third-party game rights remain separate: the
MIT License covers code and documentation only, and no artwork redistribution
licence is granted.

Avalon Online is an unofficial fan project. Game names, concepts and any
third-party rights are separate from the software dependency licences above;
this repository does not grant rights on behalf of the original game's owners.

The App Check compat bundle was retrieved unchanged from
https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check-compat.js
SHA-256: `ab1b63a9da4d418fee727518b6487c6021d1404bc2b58eac1499323334e17f83`.
It uses the same 10.14.1 Firebase SDK release and upstream licence scope above.
