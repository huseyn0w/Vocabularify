const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../shared/constants');

// API for the Custom Speed window: read the current interval and set a new one.
contextBridge.exposeInMainWorld('vocab', {
  getIntervalMs: () => ipcRenderer.invoke(IPC.GET_INTERVAL),
  setCustomSpeed: seconds => ipcRenderer.invoke(IPC.SET_CUSTOM_SPEED, seconds)
});
