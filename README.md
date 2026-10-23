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

On iPhone or iPad, open the app in Safari and choose **Share → Add to Home Screen**. In a supported desktop or Android browser, use the browser's install action or **Settings → Add to Home Screen** in Tippy.

Offline use is available once the app has loaded and cached its files. All calculations run in the browser; no backend, analytics, or external runtime assets are included.

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
node --test tests/calc.test.mjs
```

The tests cover cent precision, fractional rates, upward rounding, splitting, zero amounts, input limits, and automatic-clear timing.

## Files and hosting

- `dist/` — complete static app, manifest, icons, and service worker.
- `tests/` — calculation and input tests.
- `scripts/make-icons.py` — dependency-free PWA icon generator; run with Python 3 to regenerate the PNG icons.

Publish the contents of **`dist/`** to an HTTPS static host. Paths are relative so the app can run at a domain root or under a subdirectory. If you change cached app files, update the cache version in `dist/sw.js` when deploying.
