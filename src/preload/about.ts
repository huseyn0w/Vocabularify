import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type { AboutVocabApi } from '../shared/types';

// API for the About window: open external links via the OS default browser
// (the main process validates the URL scheme).
const api: AboutVocabApi = {
  openExternal: url => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url)
};
contextBridge.exposeInMainWorld('vocab', api);
