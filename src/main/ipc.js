const { ipcMain } = require('electron');
const { IPC } = require('../shared/constants');

// Registers the main-process side of the IPC contract. Only the channels
// the app actually uses are wired up.
function registerIpcHandlers({ importDictionary, onKeyPress }) {
  ipcMain.handle(IPC.IMPORT_DICTIONARY, (event, payload) => importDictionary(payload));
  ipcMain.on(IPC.KEY_PRESS, (event, keyEvent) => onKeyPress(keyEvent));
}

module.exports = { registerIpcHandlers };
