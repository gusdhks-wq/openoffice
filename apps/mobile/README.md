# Mobile offline prototype

This is the first mobile milestone for the IeumOffice fork. It is a separate
Capacitor/React application, not the Electron shell in a WebView. It currently
edits Markdown and plain text **as source**, not as the desktop rich-text editor.
It makes no AI requests and has no Drive login or background cloud service.

## Run

From the repository root, with Node 22.12+ and npm 10+:

```sh
npm ci
npm run dev:mobile
```

The development server listens on port 5181. To exercise browser offline startup,
build and serve the production app (the development server has no service worker):

```sh
npm run build:mobile
npm run preview -w @genoffice/mobile -- --port 5181
```

Service workers and `crypto.randomUUID` require HTTPS or localhost. A phone
visiting a PC's plain HTTP LAN address is not equivalent to localhost; use a
trusted HTTPS development origin or the Android build. The first browser visit
must finish installing the offline cache before disconnecting.

## Android

The native project is generated locally and ignored by Git. No Android SDK,
signing key or store account is needed for the web build. To build a native app,
install Android Studio and the Android SDK required by Capacitor 8 (the generated
project currently targets SDK 36), with Java 21:

```sh
npm run android:add -w @genoffice/mobile  # once per checkout
npm run android:sync -w @genoffice/mobile
npm run android:open -w @genoffice/mobile
```

Build a debug APK in Android Studio. After changing the web code, run
`android:sync` again. The prototype uses a distinct application ID and the shared
product-name constant. Replace generated launcher/splash artwork and review
native dependency notices before any public distribution. Native assets are
bundled, so startup does not require a running PC or web server.

Android project creation and Capacitor synchronization have been checked in the
cloud workspace. APK compilation, native file sharing, a real Korean IME and
physical-device suspend/termination still need device verification. There is no
iOS project yet.

## Data and recovery

- Create/import UTF-8 `.md`, `.markdown`, or `.txt` files up to 2 MiB.
- Documents and originals live in IndexedDB; every edit queues a transaction.
- Only a completed transaction displays “Saved on this device”. New/import/open
  navigation is disabled during saving or a failed save. Unsaved text can still
  be exported. Browser unload warnings are best effort; mobile OS termination
  can happen without an unload event.
- Reopening restores saved documents. This is **not** a cloud backup: clearing
  browser/app storage or uninstalling the app may delete them. Export valuable
  documents. Persistent storage is requested when creating a document, but the
  browser can decline it.
- Concurrent tabs must supply the version they last saved/read. Conflicting
  writes are rejected; the draft remains available for export. Automatic merging
  and conflict resolution UI are later milestones.
- Untouched files preserve original bytes, including BOM and mixed line endings.
  Edited files reuse the desktop source codec's BOM, LF/CRLF and final-newline
  behavior. No rich-text parsing or document-engine changes are involved.
- Browser export downloads a file. Native export writes a cache file and opens
  the system share sheet; exported copies may remain in the app cache until the
  OS clears it. Native share behavior needs device verification.
- Built browser assets are cached by a service worker. It caches static assets
  only; it does not upload documents or intercept cross-origin requests.

The build includes LICENSE.txt, NOTICE.txt and THIRD-PARTY-NOTICES.txt. The runtime
license list in `vite.config.ts` must be updated when adding shipped libraries.

## Validation

```sh
npm run build:mobile
npm run test -w @genoffice/mobile
npm run typecheck -w @genoffice/mobile
```

Unit tests cover source fidelity, invalid imports, durable storage recovery and
concurrent-write rejection. The repository-wide test/typecheck scripts include
this workspace. See [the implementation plan](../../docs/plans/mobile-cloud.md)
for the next milestones and the distinction between local editing and cloud AI.
