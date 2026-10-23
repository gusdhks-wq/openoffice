# Mobile offline prototype

This is the first mobile milestone for the IeumOffice fork. It is a separate
Capacitor/React application, not the Electron shell in a WebView. It currently
edits Markdown and plain text **as source**, not as the desktop rich-text editor.
It makes no AI requests. Optional Google Drive authorization and append-only
synchronization are implemented, but require your Google Cloud configuration.
An optional external-agent document service is provided separately in
`packages/cloud-documents`; it requires its own running server and connection keys.

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

The **Mobile preview packages** GitHub Actions workflow builds a debug APK artifact
without a store account or production signing secret. The matching Windows artifact
bundles Node and the local document server; users extract it and run `Start.cmd`.
These are test packages, not a published release or an installed cloud plugin.
Each APK build may use a different temporary debug certificate: export local
documents before any uninstall needed to change certificates. Device verification
is separate from compilation.

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
bundled, so startup does not require a running PC or web server. The Android
setup commands also register the native Drive authorization bridge and add
`com.google.android.gms:play-services-auth:22.0.0`. No Google login is opened
inside the app WebView.

Android project creation and Capacitor synchronization have been checked in the
cloud workspace. A debug APK compiled successfully on a GitHub Ubuntu runner
(Java 21, SDK 36). Native file sharing, a real Korean IME and physical-device
suspend/termination still need device verification. There is no
iOS project yet.

## Drive setup

There is no Google Cloud project or live OAuth client configured for this fork.
The implementation has been tested with simulated Google responses, **not a live
Google account**. Create these resources in your own account before trying login.
Do not send a client secret, access token, refresh token or password to an agent.

### Google Cloud project

1. Create/select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API** in APIs & Services.
3. Configure the Google Auth Platform branding, audience and contact information.
   While the app is in testing, add your own account as a test user where required.
4. Under data access, request only
   `https://www.googleapis.com/auth/drive.file`. This grants access to files the
   app creates or that the user explicitly opens with the app, rather than the
   whole Drive. This prototype only lists its own versioned files. It does not
   yet include Google's file picker for arbitrary pre-existing documents.

### Browser OAuth client

Create a **Web application** OAuth client in the same project. Add the exact
JavaScript origin used for the app, e.g. `http://localhost:5181` for development.
A hosted build needs its actual HTTPS origin. The GIS popup token flow used here
has no application redirect endpoint and requires no client secret in the app.

Set the **public client ID** before starting or building:

```sh
VITE_GOOGLE_DRIVE_CLIENT_ID=YOUR_PUBLIC_CLIENT_ID.apps.googleusercontent.com npm run dev:mobile
```

For PowerShell:

```powershell
$env:VITE_GOOGLE_DRIVE_CLIENT_ID = "YOUR_PUBLIC_CLIENT_ID.apps.googleusercontent.com"
npm run dev:mobile
```

For a production build, set the same variable when running `npm run build:mobile`.
A missing client ID shows the setup message; it does not fall back to another
login or request broad permissions. A popup blocked while loading the Google SDK
can be retried from the Connect button. The SDK is loaded only after that click.

### Android OAuth client

In the same Google Cloud project, create an **Android** OAuth client for package
`com.ieumoffice.mobile.prototype` and the SHA-1 fingerprint of your signing key.
To display the local debug certificate fingerprint:

```sh
cd apps/mobile/android
./gradlew signingReport
```

On Windows use `gradlew.bat signingReport`. A release signing certificate requires
its own matching OAuth registration. Android uses Google's `AuthorizationClient`
and system authorization UI through the local native bridge. It does not use the
browser client ID or need a `google-services.json` file. A device with Google Play
services is required. Native compilation and real authorization remain unverified
until an Android SDK, device and configured project are available. Review Google
SDK terms and native third-party notices before distributing an APK.

### What synchronization does

- Click **Connect Drive**, then **Sync this document** for the first upload.
- Each synchronized revision becomes a **new** `.md` or `.txt` file in My Drive.
  Previous versions are never patched, deleted or pruned. Repeated names are
  expected. The app's Drive list shows current branch heads; normal Drive and
  the desktop file picker can see historical files as well.
- For the currently open linked document, edits queue automatic synchronization
  after 1.5 seconds of inactivity while online and the app is open. IME composition
  must finish first. Other documents synchronize when opened or explicitly synced.
- The captured content and a pre-generated Drive file ID are saved locally before
  upload. An interrupted transfer retries the same ID, including after restarting
  the app and reconnecting. A failed attempt pauses automatic retries until the
  next reconnect or explicit action, rather than looping in the background.
- Concurrent edits create separate heads. Open each head from the Drive list to
  compare them. Opening a remote head retains any different local draft.
- The queue and bindings are tied to the Drive account's stable permission ID.
  Connecting a different account cannot upload another account's pending document.
- Access tokens stay in memory and are conservatively expired. Closing/reloading
  the app requires reconnecting. No refresh token, client secret or Google password
  is stored. Disconnect revokes the current grant before clearing the connection.
- Remote deletion does not delete local documents. There is no automatic merge,
  canonical-file overwrite, dedicated folder, history cleanup, background OS sync,
  arbitrary Drive file picker or Google Docs/Sheets/Slides format support yet.
- This append-only strategy deliberately does not assume Drive v3 supports an
  atomic `If-Match` write. It trades extra version files for retaining both sides
  of a concurrent edit. Google project/client interoperability still needs live
  verification across browser and Android clients in the same project.

Official authorization references:
[Android](https://developer.android.com/identity/authorization),
[browser token flow](https://developers.google.com/identity/oauth2/web/guides/use-token-model),
[Drive file scope](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

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
  only. It never caches Drive files, OAuth tokens or cross-origin API requests.

The build includes LICENSE.txt, NOTICE.txt and THIRD-PARTY-NOTICES.txt. The runtime
license list in `vite.config.ts` must be updated when adding shipped libraries.

## Validation

```sh
npm run build:mobile
npm run test -w @genoffice/mobile
npm run typecheck -w @genoffice/mobile
```

Unit tests cover source fidelity, invalid imports, durable storage recovery,
concurrent-write rejection, interrupted Drive uploads, account binding, branches,
stream limits, token scope checks and repeatable native project configuration. The repository-wide test/typecheck scripts include
this workspace. See [the implementation plan](../../docs/plans/mobile-cloud.md)
for the next milestones and the distinction between local editing and cloud AI.

## External Codex document connection

The mobile UI now has an **External Codex documents** section. It connects to the
separate document service using an HTTPS origin (localhost for development) and
an in-memory owner connection key. Upload a document, explicitly enable sharing,
and a permitted external MCP client can read and edit it. The app preserves local
drafts on version conflicts and can open the server version separately or publish
a new copy. Version restoration appends a new server revision.

The service does not call an AI API. It is not automatically installed as a tool
in this chat or Codex cloud. See the [service setup and support limits](../../packages/cloud-documents/README.md).
Documents from the owner are private until shared. Disconnecting the mobile app
does not revoke the separate agent key: use Stop sharing or rotate that key.

The current cloud connection automatically synchronizes only the open linked
document, checks for external edits while idle, and retains queued operations
across restarts. Credentials must be entered again after restart. The server
workspace ID prevents a queued upload moving into a different workspace at the
same URL. Google Drive synchronization is independent; this service does not read
or persist Google tokens.
