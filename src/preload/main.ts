import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/constants';
import type { Background, MainVocabApi } from '../shared/types';

// The main process passes the persisted theme as a launch argument
// (`--vocab-theme=dark|light`) so the renderer can paint the right theme on the
// very first frame instead of waiting for the post-load SET_BACKGROUND message.
const themeArg = process.argv.find(arg => arg.startsWith('--vocab-theme='));
const initialBackground: Background = themeArg?.split('=')[1] === 'dark' ? 'dark' : 'light';

// Exposes a minimal, explicit API to the main display window. The renderer
// runs with contextIsolation + nodeIntegration disabled and can only reach
// the main process through these whitelisted channels.
const api: MainVocabApi = {
  initialBackground,
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
  sendKeyPress: keyEvent => ipcRenderer.send(IPC.KEY_PRESS, keyEvent),
  setPaused: paused => ipcRenderer.send(IPC.SET_PAUSED, paused)
};
contextBridge.exposeInMainWorld('vocab', api);
