import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type { SettingsVocabApi } from '../shared/types';

// API for the unified Settings window.
const api: SettingsVocabApi = {
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  setLanguagePair: (to, from) => ipcRenderer.invoke(IPC.SET_LANGUAGE_PAIR, { to, from }),
  setLevel: level => ipcRenderer.invoke(IPC.SET_LEVEL, level),
  setBackground: background => ipcRenderer.invoke(IPC.SET_BACKGROUND_PREF, background),
  setMode: mode => ipcRenderer.invoke(IPC.SET_MODE, mode),
  setSound: enabled => ipcRenderer.invoke(IPC.SET_SOUND, enabled),
  setSpeed: ms => ipcRenderer.invoke(IPC.SET_SPEED, ms),
  openImport: () => ipcRenderer.invoke(IPC.OPEN_IMPORT)
};
contextBridge.exposeInMainWorld('vocab', api);
