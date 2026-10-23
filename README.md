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

## iPhone display

The calculator and Settings use dynamic viewport height with safe-area insets applied once. The bottom-strip fix was confirmed on an iPhone 13 mini running iOS 27.0.1. The system header blur remains on that device, including after a fresh Home Screen installation and an opaque status-bar request.

Tap the version number to open **Display check**, then **Copy details** to share layout measurements when troubleshooting. The details stay on the device unless you choose to copy and share them; no diagnostics are transmitted automatically.

## Credits and testing revisions

The bottom credit reads **© 2026 Mark Steven Smith, Jr. (v0.1.2-00001)**. The name links to [markstevensmithjr.com](https://www.markstevensmithjr.com), inherits the surrounding color, and is underlined only on hover.

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

The tests cover cent precision, fractional rates, upward rounding, splitting, zero amounts, input limits, automatic-clear timing, platform detection, and accepted, dismissed, or unavailable native installation prompts.

## Files and hosting

- `dist/` — complete static app, manifest, icons, and service worker.
- `tests/` — calculation, input, and installation-flow tests.
- `scripts/make-icons.py` — dependency-free PWA icon generator; run with Python 3 to regenerate the PNG icons.

Publish the contents of **`dist/`** to an HTTPS static host. Paths are relative so the app can run at a domain root or under a subdirectory. Run the testing-revision helper before publishing changes to cached app files so the interface, release URLs, and offline cache stay in sync.
