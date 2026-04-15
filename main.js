const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

const LIVE_URL = 'https://vermillion-kheer-60a922.netlify.app';

function setupHeaderStripping() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'x-frame-options') delete headers[key];
      if (key.toLowerCase() === 'content-security-policy') {
        headers[key] = headers[key]
          .map(v => v.replace(/frame-ancestors[^;]*(;|$)/gi, ''))
          .filter(Boolean);
      }
    }
    callback({ responseHeaders: headers });
  });
}

app.whenReady().then(() => {
  setupHeaderStripping();
  createWindow();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Astoria CPW — Concierge Portal',
    backgroundColor: '#0d0d0e',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // Show loading screen first
  win.loadURL('data:text/html,<html style="background:%230d0d0e;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Georgia,serif"><div style="text-align:center;color:%23c8a96a"><div style="font-size:48px;letter-spacing:.2em;margin-bottom:12px">ASTORIA</div><div style="font-size:12px;letter-spacing:.2em;color:%23696870">LOADING...</div></div></html>');

  win.once('ready-to-show', () => {
    win.show();
    win.loadURL(LIVE_URL);
  });

  // Fall back to local if Netlify unreachable
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.includes('netlify')) {
      win.loadFile(path.join(__dirname, 'src', 'index.html'));
    }
  });

  win.webContents.on('did-finish-load', () => {
    win.setTitle('Astoria CPW — Concierge Portal');
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    const embedSites = ['app.luxerone.com', 'app.minnowpod.com'];
    if (!embedSites.some(s => url.includes(s))) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('https://vermillion-kheer-60a922.netlify.app') ||
                    url.startsWith('file://') || url.startsWith('data:');
    if (!allowed) { event.preventDefault(); shell.openExternal(url); }
  });

  const menu = Menu.buildFromTemplate([
    { label: 'File', submenu: [
      { label: '🔒 Lock', accelerator: 'CmdOrCtrl+L', click: () => win.webContents.executeJavaScript('if(typeof lockScreen!=="undefined")lockScreen()') },
      { label: 'Sign Out', click: () => win.webContents.executeJavaScript('if(typeof doLogout!=="undefined")doLogout()') },
      { type: 'separator' },
      { label: '↺ Reload App', click: () => win.loadURL(LIVE_URL) },
      { type: 'separator' },
      { role: 'quit', label: 'Exit' }
    ]},
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'togglefullscreen' },
      { type: 'separator' }, { role: 'toggleDevTools' }
    ]},
    { label: 'Navigate', submenu: [
      { label: 'Dashboard',     accelerator: 'CmdOrCtrl+1', click: () => win.webContents.executeJavaScript("goPage('dashboard')") },
      { label: 'Visitor Log',   accelerator: 'CmdOrCtrl+2', click: () => win.webContents.executeJavaScript("goPage('visitor-log')") },
      { label: 'Sign In Guest', accelerator: 'CmdOrCtrl+3', click: () => win.webContents.executeJavaScript("goPage('sign-in')") },
      { label: 'Plate Lookup',  accelerator: 'CmdOrCtrl+4', click: () => win.webContents.executeJavaScript("goPage('plate-lookup')") },
      { label: 'Valet Map',     accelerator: 'CmdOrCtrl+5', click: () => win.webContents.executeJavaScript("goPage('valet-map')") },
      { type: 'separator' },
      { label: 'Residents', click: () => win.webContents.executeJavaScript("goPage('residents')") },
      { label: 'Vehicles',  click: () => win.webContents.executeJavaScript("goPage('vehicles')") },
      { label: 'Citations', click: () => win.webContents.executeJavaScript("goPage('citations')") },
    ]},
    { label: 'Quick Launch', submenu: [
      { label: '🫙 Minnow Pod', click: () => win.webContents.executeJavaScript("document.getElementById('embed-minnow').classList.add('open')") },
      { label: '📦 Luxer',      click: () => win.webContents.executeJavaScript("openLuxer()") },
      { label: '✉ Gmail',       click: () => win.webContents.executeJavaScript("document.getElementById('embed-gmail').classList.add('open')") },
    ]}
  ]);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
