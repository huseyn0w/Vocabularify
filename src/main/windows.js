const { BrowserWindow } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');
const { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } = require('../shared/constants');

const htmlPath = name => path.join(APP_ROOT, name);
const preloadPath = name => path.join(__dirname, '..', 'preload', name);

// Hardened defaults: the renderer gets no Node access and runs in an
// isolated world; it talks to the main process only through the channels
// each preload script exposes. sandbox is disabled so the preload can
// require the shared constants module.
function securePreferences(preloadScript) {
  return {
    preload: preloadPath(preloadScript),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  };
}

function createMainWindow({ onClose, onReady } = {}) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: securePreferences('main.js')
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
    webPreferences: securePreferences('import.js')
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
    webPreferences: securePreferences('about.js')
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
