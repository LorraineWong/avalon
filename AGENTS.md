# Avalon Online maintenance

Read [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/ARCHITECTURE.md) and
[maintenance notes](docs/MAINTENANCE.md) before changing this repository.

- Start with `git status`, fetch the remote, and inspect incoming commits.
  Preserve existing work. Use the current suitable checkout rather than moving
  another checkout's branch or deleting unrelated worktrees.
- This is a static HTML/CSS/JS site with no build step or runtime package
  installation. Keep public paths stable. Do not add a framework just to format
  or organise files.
- Keep seven languages and both themes consistent. Player text must never be
  sent to translation services. Use `dev/ui-preview.html` for offline UI work.
- Run `node tests/run-all.mjs`. The default suite must stay offline and require
  no secrets. UI changes also need relevant real-browser layout and interaction
  checks; the VM tests cannot verify layout.
- `--live` creates temporary production Firebase users/rooms. Use it only within
  an authorised session, clean up, and never modify real players' rooms.
- Keep Firebase on Spark. Normal rules are `firebase/database.rules.json`;
  `firebase/emergency-deny-all.rules.json` is standby, not a deployment default.
  Do not change billing, enforce App Check or expand allowed origins implicitly.
- A domain is not confirmed until the owner supplies it. Do not infer one from
  examples, browsing history or another deployment.
- Keep asset query versions and the service-worker cache version aligned when
  changing runtime JS/CSS/assets. Formatting-only HTML and documentation do not
  need a runtime version bump. Never reformat vendored code or upstream licences.
- Code/docs use MIT; images are excluded under `NOTICE` and `assets/LICENSE.md`.
  Preserve the fan-project notice and creation credits. Do not silently change
  licensing or enable payment links.
- Merge/publish only when the active session authorises it, after required
  checks. Follow [RELEASE.md](docs/RELEASE.md). Clean up only the completed task's
  branch; retain `main`. Distinguish GitHub Pages checks from separate Cloudflare checks; inspect the
  current deployment results before attributing a failure.
- Never print authentication tokens or Firebase CLI login JSON, commit secrets,
  or put service-account credentials in browser code.
