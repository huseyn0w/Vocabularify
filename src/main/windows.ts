import { BrowserWindow } from 'electron';
import path from 'path';
import { APP_ROOT } from './config';
import { WINDOW_WIDTH, WINDOW_HEIGHT } from '../shared/constants';

const htmlPath = (name: string) => path.join(APP_ROOT, name);
const preloadPath = (name: string) => path.join(__dirname, '..', 'preload', name);

// Hardened defaults: the renderer gets no Node access and runs in an
// isolated world; it talks to the main process only through the channels
// each preload script exposes. sandbox is disabled so the preload can
// require the shared constants module.
function securePreferences(preloadScript: string) {
  return {
    preload: preloadPath(preloadScript),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  };
}

export function createMainWindow(
  { onClose, onReady }: { onClose?: () => void; onReady?: (win: BrowserWindow) => void } = {}
): BrowserWindow {
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
    // Obsidian base — avoids a white flash before the renderer paints (dark is default).
    backgroundColor: '#16171c',
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
export function createImportWindow({ parent }: { parent?: BrowserWindow } = {}): BrowserWindow {
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

// Settings window is a singleton.
let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow({ parent }: { parent?: BrowserWindow } = {}): BrowserWindow {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 740,
    height: 560,
    minWidth: 640,
    minHeight: 480,
    parent,
    center: true,
    title: 'Settings',
    webPreferences: securePreferences('settings.js')
  });
  settingsWindow.loadFile(htmlPath('settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  return settingsWindow;
}

// The About window is a singleton: re-invoking focuses the existing one.
let aboutWindow: BrowserWindow | null = null;

export function createAboutWindow({ parent }: { parent?: BrowserWindow } = {}): BrowserWindow {
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
