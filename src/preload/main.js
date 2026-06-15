const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../shared/constants');

// Exposes a minimal, explicit API to the main display window. The renderer
// runs with contextIsolation + nodeIntegration disabled and can only reach
// the main process through these whitelisted channels.
contextBridge.exposeInMainWorld('vocab', {
  onDisplayPhrase: callback =>
    ipcRenderer.on(IPC.DISPLAY_PHRASE, (_event, phrase, mode, index, total) =>
      callback({ phrase, mode, index, total })
    ),
  onSetBackground: callback =>
    ipcRenderer.on(IPC.SET_BACKGROUND, (_event, background) => callback(background)),
  onToggleSound: callback =>
    ipcRenderer.on(IPC.TOGGLE_SOUND_MODE, (_event, enabled) => callback(enabled)),
  onSetLanguages: callback =>
    ipcRenderer.on(IPC.SET_LANGUAGES, (_event, fromLocale, toLocale) =>
      callback({ fromLocale, toLocale })
    ),
  onClearTimeouts: callback => ipcRenderer.on(IPC.CLEAR_TIMEOUTS, () => callback()),
  sendKeyPress: keyEvent => ipcRenderer.send(IPC.KEY_PRESS, keyEvent)
});
