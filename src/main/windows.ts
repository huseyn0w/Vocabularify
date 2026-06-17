import { BrowserWindow } from 'electron';
import path from 'path';
import { APP_ROOT } from './config';
import { WINDOW_WIDTH, WINDOW_HEIGHT } from '../shared/constants';
import type { Background } from '../shared/types';

// Native window background per theme — painted on the very first frame so the
// window opens already in the right theme (see also the renderer's synchronous
// theme application via the --vocab-theme launch argument).
const WINDOW_BG: Record<Background, string> = { dark: '#16171c', light: '#f5f5f7' };

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
  { onClose, onReady, initialBackground = 'dark' }: {
    onClose?: () => void;
    onReady?: (win: BrowserWindow) => void;
    initialBackground?: Background;
  } = {}
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
    // Paint the persisted theme on the first frame (no flash before the renderer paints).
    backgroundColor: WINDOW_BG[initialBackground],
    webPreferences: {
      ...securePreferences('main.js'),
      // Hand the theme to the preload so the renderer can apply it before paint.
      additionalArguments: [`--vocab-theme=${initialBackground}`]
    }
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

// Dialogs are independent top-level windows, NOT children of the main card.
// A child window on macOS is pinned to its parent and moves together with it,
// so dragging the card dragged the open dialog along with it. Instead each
// dialog floats at the same screen-saver always-on-top level as the card — it
// stays above the card (which would otherwise hide a plain window) while being
// freely movable on its own.
function floatAboveCard(win: BrowserWindow): void {
  win.setAlwaysOnTop(true, 'screen-saver');
}

export function createImportWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 500,
    height: 400,
    center: true,
    alwaysOnTop: true,
    webPreferences: securePreferences('import.js')
  });
  floatAboveCard(win);
  win.loadFile(htmlPath('import.html'));
  return win;
}

// Settings window is a singleton.
let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 740,
    height: 560,
    minWidth: 640,
    minHeight: 480,
    center: true,
    alwaysOnTop: true,
    title: 'Settings',
    webPreferences: securePreferences('settings.js')
  });
  floatAboveCard(settingsWindow);
  settingsWindow.loadFile(htmlPath('settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  return settingsWindow;
}

// The About window is a singleton: re-invoking focuses the existing one.
let aboutWindow: BrowserWindow | null = null;

export function createAboutWindow(): BrowserWindow {
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
    center: true,
    alwaysOnTop: true,
    webPreferences: securePreferences('about.js')
  });

  floatAboveCard(aboutWindow);
  aboutWindow.loadFile(htmlPath('about.html'));
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });

  return aboutWindow;
}
