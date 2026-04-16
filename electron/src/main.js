'use strict';

const { app, BrowserWindow, shell, ipcMain, session, Menu, Tray, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');
const os = require('os');

// ─── App config ───────────────────────────────────────────────────────────────
const APP_URL = 'https://vermillion-kheer-60a922.netlify.app'; // your Netlify URL
const APP_NAME = 'Astoria CPW';
const store = new Store();

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// ─── Window reference ──────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let isQuitting = false;

// ─── Security: disable navigation to unknown origins ──────────────────────────
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowed = [
      APP_URL,
      'https://oltvblkmsjtmkstwmkps.supabase.co',
      'https://accounts.google.com',
      'https://mail.google.com',
      'https://calendar.google.com',
      'https://app.minnowpod.com',
      'https://app.luxerone.com',
      'https://outlook.office.com',
      'https://script.google.com',
    ];
    const isAllowed = allowed.some(origin => url.startsWith(origin));
    if (!isAllowed && !url.startsWith('devtools://')) {
      event.preventDefault();
      // Open external links in the system browser
      shell.openExternal(url);
    }
  });

  // Open target="_blank" links in system browser
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  // Restore last window size/position or use sensible defaults
  const savedBounds = store.get('windowBounds', {
    width: 1400,
    height: 860,
    x: undefined,
    y: undefined,
  });

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    backgroundColor: '#0d0d0e',
    show: false, // show after ready-to-show to avoid white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    autoHideMenuBar: true, // hide menu bar but keep alt-accessible
  });

  // Remove default menu in production
  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  // Load the Netlify app
  mainWindow.loadURL(APP_URL);

  // Show window once content is ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    checkForUpdates();
  });

  // Persist window size/position on close
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      return;
    }
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle loading errors gracefully
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // aborted (normal on redirect)
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
    mainWindow.loadFile(path.join(__dirname, 'offline.html'));
  });

  // Dev tools shortcut (only in dev mode)
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (_, input) => {
      if (input.control && input.shift && input.key === 'I') {
        mainWindow.webContents.openDevTools();
      }
    });
  }
}

// ─── System tray ─────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Astoria CPW',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => checkForUpdates(true),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Auto-updater ─────────────────────────────────────────────────────────────
function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox({ message: 'Updates only run in packaged builds.' });
    return;
  }

  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.error('Update check failed:', err.message);
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Check',
        message: `Could not check for updates: ${err.message}`,
      });
    }
  });
}

autoUpdater.on('update-available', (info) => {
  if (!mainWindow) return;
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `Astoria CPW v${info.version} is available and will download in the background.`,
    buttons: ['OK'],
  });
});

autoUpdater.on('update-downloaded', (info) => {
  if (!mainWindow) return;
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Update Ready',
    message: `v${info.version} has been downloaded. Restart now to apply the update?`,
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
  }).then(({ response }) => {
    if (response === 0) {
      isQuitting = true;
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('AutoUpdater error:', err.message);
});

// ─── Second instance: focus existing window ───────────────────────────────────
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Set CSP headers permissive enough for the app
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
        ],
      },
    });
  });

  createWindow();
  createTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else if (mainWindow) mainWindow.show();
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Keep app alive when all windows closed (macOS) — use tray on Windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit — keep in tray
    // app.quit() — uncomment to quit instead of minimizing to tray
  }
});

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('quit-app', () => {
  isQuitting = true;
  app.quit();
});
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));
