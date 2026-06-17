import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type { ImportVocabApi } from '../shared/types';

// API for the Import Dictionary window. File selection goes through a native
// dialog in the main process (the renderer never touches the filesystem).
const api: ImportVocabApi = {
  chooseFile: () => ipcRenderer.invoke(IPC.CHOOSE_DICTIONARY_FILE),
  importDictionary: payload => ipcRenderer.invoke(IPC.IMPORT_DICTIONARY, payload)
};
contextBridge.exposeInMainWorld('vocab', api);
