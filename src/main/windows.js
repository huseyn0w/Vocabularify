const { BrowserWindow } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');
const { WINDOW_WIDTH, WINDOW_HEIGHT } = require('../shared/constants');

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
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 300,
    minHeight: 160,
    // Standard window chrome: native minimise / maximize / close and resize
    // handles, available directly on the window.
    title: 'Vocabularify',
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#ffffff',
    webPreferences: securePreferences('main.js')
  });

  win.loadFile(htmlPath('index.html'));

  if (onClose) {
    win.on('close', onClose);
  }
  if (onReady) {
    win.webContents.on('did-finish-load', () => onReady(win));
  }

  return win;
}

// Dialogs are created as children of the main window (`parent`) so they
// always sit above it — the main window is always-on-top at screen-saver
// level, which would otherwise hide a plain top-level dialog behind it.
// They stay non-modal so the user can still move and interact with them.
function createImportWindow({ parent } = {}) {
  const win = new BrowserWindow({
    width: 500,
    height: 400,
    parent,
    center: true,
    webPreferences: securePreferences('import.js')
  });
  win.loadFile(htmlPath('import.html'));
  return win;
}

function createSpeedWindow({ parent } = {}) {
  const win = new BrowserWindow({
    width: 360,
    height: 260,
    resizable: false,
    parent,
    center: true,
    title: 'Custom Speed',
    webPreferences: securePreferences('speed.js')
  });
  win.loadFile(htmlPath('speed.html'));
  return win;
}

// Language settings window is a singleton.
let settingsWindow = null;

function createSettingsWindow({ parent } = {}) {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 560,
    height: 560,
    minWidth: 460,
    minHeight: 460,
    parent,
    center: true,
    title: 'Language',
    webPreferences: securePreferences('settings.js')
  });
  settingsWindow.loadFile(htmlPath('settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  return settingsWindow;
}

// The About window is a singleton: re-invoking focuses the existing one.
let aboutWindow = null;

function createAboutWindow({ parent } = {}) {
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
    parent,
    center: true,
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
  createSpeedWindow,
  createSettingsWindow,
  createAboutWindow
};
