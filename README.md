# Tippy

A small, installable tip calculator inspired by Tipsy. Enter a bill, choose a tip, split it with friends, and round up. Tippy works offline after the first visit.

## Features

- Tip percentage and party-size wheels, plus custom tip percentages.
- Bill splitting for up to 30 people, with tip and total shown per person.
- No rounding, round tip up, or round total up; exact whole-dollar amounts stay unchanged.
- Eight themes with automatic, light, and dark appearance.
- Phone and calculator keypad layouts, plus desktop keyboard controls.
- Saved preferences and bill amount stored locally on your device.
- Optional automatic bill clearing after 15 minutes of inactivity.
- Installable PWA with offline caching and Home Screen icons.

## Run locally

No package installation or build step is required. With Python 3 installed:

```sh
git clone https://github.com/akrabu/Tippy.git
cd Tippy
python3 -m http.server 8000 --directory dist
```

Open **http://localhost:8000**. Serve the folder through HTTP rather than opening `index.html` as a file so JavaScript modules and the service worker work correctly.

## Install

Open **Settings → Install Tippy** for the installation guide. In browser mode, the entry is near the top of Settings; once installed, **Installation help** is below Appearance. The guide opens only when requested and includes instructions for both platforms.

- **iPhone or iPad:** open Tippy in Safari, choose **Share → Add to Home Screen**, keep **Open as Web App** on if offered, then tap **Add**.
- **Android:** open Tippy in Chrome, choose **⋮ → Install and create shortcut** or **Add to Home screen**, then **Install**. A native **Install app** button appears in the guide when the browser supports it.
- If you are viewing Tippy inside another app, open the page in Safari or Chrome first.

Offline use is available once the app has loaded and cached its files. All calculations run in the browser; no backend, analytics, or external runtime assets are included.

Only successful HTML responses for the app's root or index page refresh its saved offline page. Network failures, temporary server errors, and unexpected response types use that saved page instead. Opening an icon or another asset cannot replace the offline app.

## iPhone display

The installed page, calculator, and Settings sheet use `min(100vh, calc(100dvh + env(safe-area-inset-top)))`. This includes the status area only when iOS reports its top safe inset, capped at the classic viewport height, so the page can fit both installed launch geometries. Browser tabs and Android retain dynamic viewport sizing. The existing up-to-32-pixel header clearance remains in place to avoid the native scroll-edge blur, tapering on very short viewports.

The total and people wheel share the lower readout on opposite sides, leaving more height for the keypad. The footer reserves a 16-pixel gap below the keys (8 pixels on very short screens). The full-height background and roller clearances remain in place.

The iPhone 13 mini on iOS 27.0.1 has reported both 0/34 and 50/34-pixel safe-area insets with a 375 × 762 dynamic viewport. Revision `v0.1.2-00005` fits a 762-pixel page in the zero-top-inset case and includes the overlaid 50-pixel status area in the other case. Both browser fixtures produce 79-pixel keys and a fully visible footer. Tapping the version and opening or closing dialogs leave the page at scroll position zero. The larger buttons, clear header, and visible footer were confirmed in the Home Screen app on that revision.

Tap the version number to open **Display check**, then **Copy details** to share layout measurements when troubleshooting. It includes all four viewport-unit heights, key size, and footer clearance. Details stay on the device unless you copy and share them; no diagnostics are transmitted automatically.

## Credits and testing revisions

The bottom credit reads **© 2026 Mark Steven Smith, Jr. (v0.1.2-00006)**. The name links to [markstevensmithjr.com](https://www.markstevensmithjr.com), inherits the surrounding color, and is underlined only on hover.

Before each subsequent publication, run:

```sh
node scripts/bump-version.mjs
```

The helper increments the five-digit testing revision and updates the displayed version, metadata, stylesheet and module URLs, and service-worker cache together. For a feature release, change the three-part base version consistently in `dist/index.html` and `dist/sw.js` before running the helper.

## Controls and calculations

- Enter the bill in cents: `1 2 3 4` enters **$12.34**. Clear resets the bill; backspace removes one digit.
- Swipe either wheel, click a neighboring value, or focus a wheel and use the arrow keys. Double-click the percentage wheel, or press Enter while it is focused, to set a custom rate.
- Tip and total are per person when splitting. The original full bill stays visible at the top.
- Rounding always goes **up** to the next whole dollar per person. An exact whole-dollar amount is unchanged. Tap the tip or total to toggle its rounding mode; this shortcut can be disabled in Settings.
- For example, a **$52.38** bill at **18%** is **$61.81** before rounding. Round Total makes it **$62.00** with a **$9.62** tip. Split three ways with Round Total and each person pays **$21.00**, including **$3.54** in tip.
- Clear Automatically resets the bill after 15 minutes of inactivity, including time spent outside the app. Tip rate and party size remain selected.
- Desktop keyboard: digits enter amounts, Backspace deletes, and Escape or C clears.

The interface was recreated from reference screenshots. Behavior not visible in those references, including cent-based input and per-person rounding, is implemented as described above.

## Tests

With Node.js 18 or newer:

```sh
node --test tests/*.test.mjs
```

The tests cover cent precision, fractional rates, upward rounding, splitting, zero amounts, input limits, automatic-clear timing, platform detection, accepted/dismissed/unavailable native installation prompts, offline launches and updates, server-error fallback, subdirectory hosting, and protection of the cached app page when opening assets.

## Files and hosting

- `dist/` — complete static app, manifest, icons, and service worker.
- `tests/` — calculation, input, and installation-flow tests.
- `scripts/make-icons.py` — dependency-free PWA icon generator; run with Python 3 to regenerate the PNG icons.

Publish the contents of **`dist/`** to an HTTPS static host. Paths are relative so the app can run at a domain root or under a subdirectory. Run the testing-revision helper before publishing changes to cached app files so the interface, release URLs, and offline cache stay in sync.
