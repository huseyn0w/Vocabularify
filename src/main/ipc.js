const { ipcMain } = require('electron');
const { IPC } = require('../shared/constants');

// Registers the main-process side of the IPC contract. Only the channels
// the app actually uses are wired up; each delegates to a callback the
// composition root provides.
function registerIpcHandlers({
  importDictionary,
  chooseDictionaryFile,
  openExternal,
  onKeyPress,
  onSetPaused,
  getIntervalMs,
  setCustomSpeed
}) {
  ipcMain.handle(IPC.IMPORT_DICTIONARY, (event, payload) => importDictionary(payload));
  ipcMain.handle(IPC.CHOOSE_DICTIONARY_FILE, () => chooseDictionaryFile());
  ipcMain.handle(IPC.OPEN_EXTERNAL, (event, url) => openExternal(url));
  ipcMain.handle(IPC.GET_INTERVAL, () => getIntervalMs());
  ipcMain.handle(IPC.SET_CUSTOM_SPEED, (event, seconds) => setCustomSpeed(seconds));
  ipcMain.on(IPC.KEY_PRESS, (event, keyEvent) => onKeyPress(keyEvent));
  ipcMain.on(IPC.SET_PAUSED, (event, paused) => onSetPaused(paused));
}

module.exports = { registerIpcHandlers };
