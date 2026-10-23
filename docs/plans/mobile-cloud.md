# Mobile and cloud document roadmap

## Goal and approved scope

The user's fork is `gusdhks-wq/openoffice`. A phone must work without a running
PC, retain local edits offline, synchronize documents, and allow an external cloud
agent to create or edit permitted documents. The initial implementation is Android
first; iOS follows after the portable editing/storage boundary is validated.

This changes the architecture beyond the upstream local desktop product. Keep
this fork's mobile work isolated from the desktop shell and document engines.
Do not read subscription credentials or transplant desktop CLI execution into
mobile/server code. No AI provider, cloud service or Google account is connected
by the first milestone.

## Reference projects

- [Logseq Capacitor configuration](https://github.com/logseq/logseq/blob/master/capacitor.config.ts):
  web UI reuse with explicit keyboard, navigation and safe-area adaptation.
- [Joplin architecture](https://github.com/laurent22/joplin/blob/dev/readme/dev/spec/architecture.md)
  and [synchronization](https://github.com/laurent22/joplin/blob/dev/readme/dev/spec/sync.md):
  share business logic across clients; keep durable local data and synchronize
  separately from UI. Its mobile frontend is React Native, not Electron.
- [Collabora source mirror](https://github.com/CollaboraOnline/online.mirror)
  and [mobile architecture talk](https://archive.fosdem.org/2025/schedule/event/fosdem-2025-5093-libreoffice-on-mobile-with-the-collabora-office-app/):
  full offline office editing needs an on-device document engine as well as UI.

These are architectural references, not evidence that automatic desktop-to-mobile
conversion works. No source from those projects was copied into this prototype.

## Findings from this checkout

| Component         | Evidence                                                                                                 | Consequence                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Shell             | `apps/shell/package.json` uses Electron                                                                  | Add a separate mobile entry point                                      |
| Markdown UI       | `apps/markdown/src/renderer/App.tsx` calls `window.markdownApi` throughout open/save/export and AI flows | A browser bundle alone cannot replace desktop integration              |
| Source codec      | `apps/markdown/src/shared/source-text.ts` has no Electron/Node runtime dependency                        | Reuse it unchanged for the first source editor                         |
| Google OAuth      | `packages/google-drive/src/oauth.ts` imports `node:http` and `node:crypto`, with a loopback callback     | Introduce mobile browser/deep-link auth and a secure token store later |
| Sheets engine     | `apps/sheets/native/xlsx-engine` is a Rust sidecar                                                       | Verify native/WASM feasibility before promising offline spreadsheets   |
| Shared appearance | `packages/ui/src/tokens.css` and `packages/i18n` are browser-usable                                      | Reuse tokens, branding and all 21 UI language dictionaries             |

## Milestones and gates

1. **Local mobile prototype (implemented, device verification pending).**
   `apps/mobile` supplies a responsive source editor, import/export, IndexedDB
   autosave, completed-write status, stale-write protection and offline browser
   assets. Capacitor Android project generation/sync is reproducible. Verify real
   keyboard composition, Android background termination and file sharing before
   calling this a native beta. Existing rich-text editors are not yet ported.
2. **Portable editing boundary.** Define storage/file-picker/export adapters for
   desktop, browser and native devices. Trial the existing Markdown rich editor
   and one DOCX sample on device. Measure input, selection, memory and fidelity;
   choose Capacitor reuse versus native shell plus embedded web editor from
   measurements. Do not refactor document engines merely to share the shell.
3. **Drive synchronization.** Configure mobile OAuth and server credentials
   through the appropriate platform setup. Add document IDs, Drive file IDs,
   base revisions, pending operations and deletion records. Upload only from a
   durable queue; handle interrupted transfers, revoked auth, device clock skew
   and offline edits. Use optimistic concurrency and preserve conflict copies.
   Verify actual API precondition/version capabilities before selecting an
   atomic write strategy. Google Docs files and binary office files have
   different APIs and are not interchangeable synchronization targets.
4. **Cloud document operations.** Add authenticated document lookup/read/create/
   edit/validate/commit operations with access scoped to selected documents.
   A worker must continue after the phone disconnects, return job status, avoid
   duplicate commits after retries and retain the pre-edit version. Check the
   base version again before publishing an AI edit.
5. **External agent connection.** Expose the same operations through a documented
   API and an authenticated remote MCP adapter where supported. Verify the exact
   Codex cloud product's connection capabilities with one read and one write;
   an MCP endpoint alone does not guarantee that product can connect. Keep the
   document operations independent of any particular agent or hosting runtime.
6. **Format expansion and distribution.** Trial DOCX, then PPTX/XLSX/HWP with real
   files. Classify each feature as on-device/offline, online-only or unsupported.
   Validate unchanged content and desktop interoperability. Finish native
   privacy disclosures, dependency notices, artwork, signing and store packaging.

## End-to-end acceptance

Create a Korean note on the phone offline, reopen it after a completed local
save, reconnect and synchronize. With the PC off, request a cloud edit and close
the mobile app. Reopen later to retrieve the result, inspect the change, undo it
and open the same file on desktop. Simultaneous edits must preserve both versions.
Only the local editing/recovery portion is implemented by milestone 1.

## Open setup decisions

- Select cloud hosting, storage of job metadata and user authentication before
  deploying a backend; do not create billable resources implicitly.
- Verify external Codex connectivity before promising subscription-based cloud
  execution. An app-hosted AI API path requires separately configured credentials
  and explicit provider selection; ChatGPT subscription use is not an API budget.
- Native IndexedDB durability and OS lifecycle behavior require real-device
  evidence; browser emulation is insufficient.
- The prototype retains drafts but does not yet offer document deletion, renaming,
  rich-text editing, PDF viewing, Drive sync or cloud AI.
