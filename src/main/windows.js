const { BrowserWindow } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');
const { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } = require('../shared/constants');

const htmlPath = name => path.join(APP_ROOT, name);

// NOTE: webPreferences are hardened (contextIsolation + preload) in a later
// stage; for now they preserve the existing renderer contract.
const LEGACY_WEB_PREFERENCES = {
  nodeIntegration: true,
  contextIsolation: false
};

function createMainWindow({ onClose, onReady } = {}) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { ...LEGACY_WEB_PREFERENCES }
  });

  win.loadFile(htmlPath('index.html'));
  win.setBackgroundColor('#FFFFFF');

  if (onClose) {
    win.on('close', onClose);
  }
  if (onReady) {
    win.webContents.on('did-finish-load', () => onReady(win));
  }

  return win;
}

function createImportWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: { ...LEGACY_WEB_PREFERENCES }
  });
  win.loadFile(htmlPath('import.html'));
  return win;
}

// The About window is a singleton: re-invoking focuses the existing one.
let aboutWindow = null;

function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return aboutWindow;
  }

  aboutWindow = new BrowserWindow({
    width: 500,
    height: 310,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: { ...LEGACY_WEB_PREFERENCES }
  });

  aboutWindow.loadFile(htmlPath('about.html'));
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });

  return aboutWindow;
}

module.exports = {
  createMainWindow,
  createImportWindow,
  createAboutWindow
};
