# Academy installation

The app installs as **Cyberkhana Academy**, using the main Cyberkhana mark in
the existing 192px/512px icons and Apple touch icon. The Academy wordmark is
not used as the installed application icon.

The mobile notice appears inline on landing, sign-in, and app-shell pages at
phone widths with a touch pointer. Its text and manual installation steps
follow `LangContext`, including changes made while the notice is open.
Chromium's one-use install event is retained across routes; iOS and browsers
without that event receive manual instructions. Desktop and standalone app
windows do not show the notice. Dismissal lasts 14 days; an accepted install
or `appinstalled` event suppresses it for 180 days in that browser.

Browser/OS installation dialogs use the device language. The website controls
the language of its own notice and instructions. iOS cannot reliably report to
a regular browser tab that the user already added a separate home-screen app.

## Hosting and offline behavior

Serve the generated `dist` over HTTPS. Serve `/manifest.webmanifest`, `/sw.js`,
`/offline.html`, and `/offline.js` as real static files, not the SPA fallback.
Use `application/manifest+json` for the manifest and JavaScript MIME for the
worker. Do not apply an immutable cache rule to `/sw.js`; registration uses
`updateViaCache: 'none'` so updates are checked against the network.

The worker caches only the public offline notice, its script, and the small
brand icon. Navigation uses the network and shows that notice when unavailable.
The notice follows the stored Academy language. Lessons, authentication, API
responses, and progress are not cached by this worker; learning requires an
internet connection. Increment the worker's cache version when changing the
offline notice or its assets.

## Verification

Run `npm run build` and `node node_modules/typescript/bin/tsc --noEmit`.
Then run `node scripts/verify-pwa.mjs` with Playwright available. If it is not
installed in this project, `PLAYWRIGHT_MODULE` may point to its `index.mjs`.
`BROWSER_EXECUTABLE` selects Chrome/Chromium, and `PWA_QA_OUTPUT` selects the
screenshot directory (otherwise the system temp directory is used).

The script serves the production build locally and mocks API responses. It
checks English/Arabic instructions, narrow layouts, accepted/dismissed/failed
prompts, route and dismissal persistence, standalone/desktop suppression,
public entry points, live language changes, Chromium manifest/installability,
cache contents, and offline recovery. Native install outcomes are simulated;
an actual home-screen installation still needs a physical-device smoke test.

References: [MDN installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
and [custom install prompts](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt).
