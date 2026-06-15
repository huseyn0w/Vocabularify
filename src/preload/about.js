const { contextBridge, ipcRenderer } = require('electron');
const { IPC } = require('../shared/constants');

// API for the About window: open external links via the OS default browser
// (the main process validates the URL scheme).
contextBridge.exposeInMainWorld('vocab', {
  openExternal: url => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url)
});
