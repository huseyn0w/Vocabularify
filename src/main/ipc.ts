import { ipcMain } from 'electron';
import { IPC } from '../shared/constants';
import type { IpcHandlers, ImportPayload, LanguagePair, Mode, Background, KeyEvent } from '../shared/types';

// Registers the main-process side of the IPC contract. Only the channels
// the app actually uses are wired up; each delegates to a callback the
// composition root provides.
export function registerIpcHandlers(handlers: IpcHandlers): void {
  const {
    importDictionary,
    chooseDictionaryFile,
    openExternal,
    openImport,
    onKeyPress,
    onSetPaused,
    getSettings,
    setLanguagePair,
    setLevel,
    setBackground,
    setMode,
    setSound,
    setSpeed
  } = handlers;

  ipcMain.handle(IPC.IMPORT_DICTIONARY, (_event, payload: ImportPayload) => importDictionary(payload));
  ipcMain.handle(IPC.CHOOSE_DICTIONARY_FILE, () => chooseDictionaryFile());
  ipcMain.handle(IPC.OPEN_EXTERNAL, (_event, url: string) => openExternal(url));
  ipcMain.handle(IPC.OPEN_IMPORT, () => openImport());
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());
  ipcMain.handle(IPC.SET_LANGUAGE_PAIR, (_event, pair: LanguagePair) => setLanguagePair(pair));
  ipcMain.handle(IPC.SET_LEVEL, (_event, level: string) => setLevel(level));
  ipcMain.handle(IPC.SET_BACKGROUND_PREF, (_event, background: Background) => setBackground(background));
  ipcMain.handle(IPC.SET_MODE, (_event, mode: Mode) => setMode(mode));
  ipcMain.handle(IPC.SET_SOUND, (_event, enabled: boolean) => setSound(enabled));
  ipcMain.handle(IPC.SET_SPEED, (_event, ms: number) => setSpeed(ms));
  ipcMain.on(IPC.KEY_PRESS, (_event, keyEvent: KeyEvent) => onKeyPress(keyEvent));
  ipcMain.on(IPC.SET_PAUSED, (_event, paused: boolean) => onSetPaused(paused));
}
