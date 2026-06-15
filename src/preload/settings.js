const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../shared/constants');

// API for the Language settings window.
contextBridge.exposeInMainWorld('vocab', {
  getLanguageOptions: () => ipcRenderer.invoke(IPC.GET_LANGUAGE_OPTIONS),
  setLanguagePair: (to, from) => ipcRenderer.invoke(IPC.SET_LANGUAGE_PAIR, { to, from })
});
