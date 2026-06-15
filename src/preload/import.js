const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../shared/constants');

// API for the Import Dictionary window. File selection goes through a native
// dialog in the main process (the renderer never touches the filesystem).
contextBridge.exposeInMainWorld('vocab', {
  chooseFile: () => ipcRenderer.invoke(IPC.CHOOSE_DICTIONARY_FILE),
  importDictionary: payload => ipcRenderer.invoke(IPC.IMPORT_DICTIONARY, payload)
});
