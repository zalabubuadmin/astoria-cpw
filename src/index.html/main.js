const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

// Strip X-Frame-Options & CSP so Luxer/Minnow Pod load inside the app
function setupHeaderStripping() {
  const filter = { urls: ['https://app.luxerone.com/*', 'https://app.minnowpod.com/*', 'https://*/*'] };
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    // Delete X-Frame-Options so iframes work
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'x-frame-options') delete headers[key];
      if (key.toLowerCase() === 'content-security-policy') {
        headers[key] = headers[key].map(v => v.replace(/frame-ancestors[^;]*(;|$)/gi, '')).filter(Boolean);
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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0d0d0e',
    show: false,
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open new windows in default browser (except Luxer/Minnow which embed)
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigating away from local file
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.once('ready-to-show', () => win.show());

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: '🔒 Lock Screen', accelerator: 'CmdOrCtrl+L', click: () => win.webContents.executeJavaScript('if(typeof lockScreen!=="undefined")lockScreen()') },
        { label: 'Sign Out', click: () => win.webContents.executeJavaScript('if(typeof doLogout!=="undefined")doLogout()') },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Astoria CPW' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Developer Tools' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard',     accelerator: 'CmdOrCtrl+1', click: () => win.webContents.executeJavaScript("goPage('dashboard')") },
        { label: 'Visitor Log',   accelerator: 'CmdOrCtrl+2', click: () => win.webContents.executeJavaScript("goPage('visitor-log')") },
        { label: 'Sign In Guest', accelerator: 'CmdOrCtrl+3', click: () => win.webContents.executeJavaScript("goPage('sign-in')") },
        { label: 'Plate Lookup',  accelerator: 'CmdOrCtrl+4', click: () => win.webContents.executeJavaScript("goPage('plate-lookup')") },
        { type: 'separator' },
        { label: 'Residents',     click: () => win.webContents.executeJavaScript("goPage('residents')") },
        { label: 'Vehicles',      click: () => win.webContents.executeJavaScript("goPage('vehicles')") },
        { label: 'Citations',     click: () => win.webContents.executeJavaScript("goPage('citations')") },
      ]
    },
    {
      label: 'Quick Launch',
      submenu: [
        { label: '🫙 Minnow Pod', click: () => win.webContents.executeJavaScript("document.getElementById('embed-minnow').classList.add('open')") },
        { label: '📦 Luxer',      click: () => win.webContents.executeJavaScript("openLuxer()") },
        { label: '✉ Gmail',       click: () => win.webContents.executeJavaScript("document.getElementById('embed-gmail').classList.add('open')") },
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
