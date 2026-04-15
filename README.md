# Astoria CPW Concierge

## Structure
- `src/index.html` — The app (served by Netlify, loaded by desktop app)
- `main.js` — Electron desktop shell
- `package.json` — Desktop build config

## Update the app
1. Get new index.html from Claude
2. Replace src/index.html
3. Commit & push in GitHub Desktop → Netlify auto-deploys

## Build desktop .exe
```
npm install
npm run build-win
```
Installer appears in dist/
