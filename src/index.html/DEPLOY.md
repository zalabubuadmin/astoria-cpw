# Deploying Astoria CPW to Netlify

## One-Time Setup (do this once)

1. Go to https://app.netlify.com and sign up (free)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop just the `src` folder onto the Netlify upload area
4. Netlify gives you a URL like `https://astoria-cpw.netlify.app`
5. (Optional) Go to Site Settings → Domain Management to set a custom subdomain

## Every Time There's an Update

1. Download the new `astoria-app-v4.html` file from Claude
2. Rename it to `index.html`
3. Go to your Netlify site → Deploys → "Deploy manually"
4. Drag JUST the `index.html` file into the upload area
5. Done — all running apps update within 30 seconds, no reinstall needed

## Desktop App Auto-Update

Once you have the Netlify URL, the desktop .exe loads the app from that URL.
This means you only ever need to rebuild the .exe if the Electron shell changes
(essentially never for normal app updates).
