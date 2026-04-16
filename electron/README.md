# Astoria CPW — Electron Desktop App

Wraps the Astoria CPW Netlify web app in a native Windows desktop application with auto-updates, system tray, and offline error handling.

---

## Project Structure

```
astoria-cpw/               ← your existing Netlify repo root
├── index.html             ← the web app (already here)
├── netlify/functions/     ← serverless functions
└── electron/              ← NEW: put this folder here
    ├── package.json
    ├── src/
    │   ├── main.js        ← Electron main process
    │   ├── preload.js     ← secure bridge
    │   └── offline.html   ← shown when offline
    ├── build/
    │   ├── icon.ico       ← app icon (copy your icon.ico here)
    │   └── installer.nsh  ← NSIS customization
    └── .github/
        └── workflows/
            └── build.yml  ← auto-builds .exe on git tag push
```

---

## One-Time Setup

### 1. Prerequisites (on your Windows machine)
- **Node.js 20+** — https://nodejs.org
- **Git** — https://git-scm.com

### 2. Add the electron folder to your repo

```bash
# In your astoria-cpw repo root:
mkdir electron
# Copy all files from this zip into the electron/ folder
```

### 3. Copy your icon

```bash
cp path/to/icon.ico electron/build/icon.ico
```

### 4. Set your Netlify URL

Open `electron/src/main.js` and update line 10:
```js
const APP_URL = 'https://YOUR-ACTUAL-APP.netlify.app';
```

### 5. Install dependencies

```bash
cd electron
npm install
```

### 6. Test locally (no build needed)

```bash
npm start
```
This opens the app in an Electron window. Verify login works, navigation works, etc.

---

## Building the .exe Installer

### Option A — Build locally on Windows

```bash
cd electron
npm run build
```

Output will be in `electron/dist/`:
- `AstoriaCPW-Setup-1.0.0.exe` — full NSIS installer (recommended for distribution)
- `AstoriaCPW-Portable-1.0.0.exe` — portable, no install needed

### Option B — Auto-build via GitHub Actions (recommended)

Every time you push a version tag, GitHub will automatically build and publish the `.exe` as a GitHub Release:

```bash
# In your repo root:
git add electron/
git commit -m "Add Electron desktop app"
git push

# Tag a release to trigger the build:
git tag v1.0.0
git push origin v1.0.0
```

Go to your GitHub repo → **Actions** tab to watch the build.  
When done, the `.exe` will appear under **Releases** — ready to download and share.

---

## Auto-Updates

The app uses `electron-updater` pointed at your GitHub repo (`zalabubuadmin/astoria-cpw`).

When you push a new tag (e.g. `v1.1.0`), the GitHub Action builds a new release. Users running the app will automatically see an update notification and can install with one click.

**To release an update:**
```bash
# 1. Bump version in electron/package.json  (e.g. "version": "1.1.0")
git add electron/package.json
git commit -m "Bump to v1.1.0"
git tag v1.1.0
git push && git push --tags
```

---

## Features

| Feature | Details |
|---|---|
| **Window memory** | Remembers last size and position |
| **System tray** | Minimizes to tray instead of closing; double-click to restore |
| **Auto-update** | Checks GitHub Releases on launch; prompts to restart when ready |
| **Offline page** | Shows a branded error page instead of a blank screen |
| **Single instance** | Second launch focuses existing window |
| **Security** | External links open in system browser; navigation locked to allowed origins |
| **Dev tools** | Ctrl+Shift+I opens DevTools in dev mode only |

---

## Distributing to Staff

Once built, share the `AstoriaCPW-Setup-1.0.0.exe` file with staff.  
They double-click → install → desktop shortcut appears → done.  
Future updates happen automatically in the background.

---

## Troubleshooting

**"Windows protected your PC" warning on install**  
This appears because the `.exe` isn't code-signed. Click "More info" → "Run anyway". To eliminate this permanently, you need a code signing certificate (~$200/yr from DigiCert or Sectigo).

**App shows blank/offline page**  
The computer has no internet or the Netlify URL is wrong. Check `APP_URL` in `main.js`.

**Build fails on GitHub Actions**  
Make sure `electron/build/icon.ico` exists and is a valid `.ico` file. You can convert PNG → ICO at https://convertio.co.
