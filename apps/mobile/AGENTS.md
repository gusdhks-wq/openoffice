# Mobile prototype

Read the repository-root instructions first. This workspace is an offline source
editor with optional Drive sync, not the Electron shell or a cloud AI service.

- Renderer code must run without Node, Electron, subscription CLIs or desktop IPC.
- Keep the imported desktop source-text codec unchanged. Reuse source bytes when
  unedited; any new file-format behavior needs round-trip tests.
- Persist locally before reporting a successful save. All writes supply the last
  persisted revision; do not weaken conflict rejection to make retries pass.
- Put UI strings in every shard under `src/renderer/i18n`; use shared branding
  constants and `@genoffice/ui/tokens.css`.
- `android/`, `ios/` and `dist/` are generated and ignored. Use `android:add` once
  and `android:sync` after building. Do not check generated vendor artwork in.
- The production browser service worker caches static build assets only. Native
  assets ship in the app and do not need a service worker. Keep dynamic document
  content, OAuth and cloud requests out of that cache.
- Runtime dependencies need license text in the mobile build. Update the explicit
  runtime list in `vite.config.ts` whenever adding a shipped dependency.
- Drive access tokens stay in memory. Never store OAuth secrets in IndexedDB,
  Preferences, localStorage, logs or committed files. Only explicit connection
  uses the Google SDK. Legacy snapshot sync is append-only: do not PATCH/DELETE
  historical files. The separately selected native Google Docs mode edits working
  source documents with required revision IDs, preserves local conflicting drafts
  and refuses unsupported native structure. Never flatten rich native documents
  or automatically recreate a file after an uncertain creation result.
- Do not imply real Drive authorization or AI is verified without live evidence.
  Follow `docs/plans/mobile-cloud.md` for the migration boundaries.

Run `npm run build:mobile`, `npm run test -w @genoffice/mobile` and repository
checks. Physical-device IME, file sharing and OS termination need separate
verification; browser viewport emulation is insufficient.

The HWP editor embeds the same pinned offline studio as the desktop and stores
immutable original bytes plus separately verified edited bytes. Legacy guarded
command journals are migrated on open; backup v2 also retains the edited snapshot.
Never route a HWP plain-text projection into source/Google Docs sync. Native export
must pass password, container, desktop preservation, engine reopen and document
fence checks. The desktop helper sources and engine stay unchanged: the build
adapts only the supported Node primitives to browser implementations. Keep the
original PC preservation tests running against that adapter. See
`docs/plans/mobile-hwp.md` for implementation boundaries and remaining device,
Hangul compatibility and structured AI/binary Drive integration checks.
