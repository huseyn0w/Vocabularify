const { ipcMain } = require('electron');
const { IPC } = require('../shared/constants');

// Registers the main-process side of the IPC contract. Only the channels
// the app actually uses are wired up; each delegates to a callback the
// composition root provides.
function registerIpcHandlers(handlers) {
  const {
    importDictionary,
    chooseDictionaryFile,
    openExternal,
    openImport,
    onKeyPress,
    onSetPaused,
    getSettings,
    setLanguagePair,
    setLevel,
    setBackground,
    setMode,
    setSound,
    setSpeed
  } = handlers;

  ipcMain.handle(IPC.IMPORT_DICTIONARY, (event, payload) => importDictionary(payload));
  ipcMain.handle(IPC.CHOOSE_DICTIONARY_FILE, () => chooseDictionaryFile());
  ipcMain.handle(IPC.OPEN_EXTERNAL, (event, url) => openExternal(url));
  ipcMain.handle(IPC.OPEN_IMPORT, () => openImport());
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());
  ipcMain.handle(IPC.SET_LANGUAGE_PAIR, (event, pair) => setLanguagePair(pair));
  ipcMain.handle(IPC.SET_LEVEL, (event, level) => setLevel(level));
  ipcMain.handle(IPC.SET_BACKGROUND_PREF, (event, background) => setBackground(background));
  ipcMain.handle(IPC.SET_MODE, (event, mode) => setMode(mode));
  ipcMain.handle(IPC.SET_SOUND, (event, enabled) => setSound(enabled));
  ipcMain.handle(IPC.SET_SPEED, (event, ms) => setSpeed(ms));
  ipcMain.on(IPC.KEY_PRESS, (event, keyEvent) => onKeyPress(keyEvent));
  ipcMain.on(IPC.SET_PAUSED, (event, paused) => onSetPaused(paused));
}

module.exports = { registerIpcHandlers };
