import { app, BrowserWindow, dialog, globalShortcut, shell } from "electron";

import {
  MODES,
  IPC,
  LEVELS,
  SPEED_INTERVALS,
  CUSTOM_LEVEL_PREFIX,
  LANGUAGE_META,
  PHRASE_SEPARATOR,
} from "./shared/constants";
import { getLanguageFilePath, getLocale } from "./shared/languagePaths";
import {
  CUSTOM_DICTS_PATH,
  getDictionariesBasePath,
  ensureCustomDictsDir,
  listAvailablePairs,
} from "./main/config";
import { clampInterval, progressKey } from "./shared/state";
import { loadState, saveState } from "./main/store";
import * as dictionaries from "./main/dictionaries";
import { createPhraseEngine } from "./main/phraseEngine";
import {
  createMainWindow,
  createImportWindow,
  createSettingsWindow,
  createAboutWindow,
} from "./main/windows";
import { createTrayController } from "./main/tray";
import { registerIpcHandlers } from "./main/ipc";
import { joinTokens, layoutTokens } from "./shared/items";
import type { Item } from "./shared/items";
import type {
  AppState,
  PhraseEngine,
  TrayController,
  KeyEvent,
  LanguagePair,
  Background,
  SettingsSnapshot,
  ImportPayload,
} from "./shared/types";

let state: AppState = loadState();
let mainWindow: BrowserWindow | null = null;
let engine: PhraseEngine;
let tray: TrayController;
let isHoverPaused = false;
let isExerciseHold = false;

function showError(message: string, error?: unknown) {
  dialog.showErrorBox(
    message,
    error
      ? error instanceof Error
        ? (error.stack ?? error.toString())
        : String(error)
      : "Unknown error",
  );
}

// Sends to the main window only when it is alive. Guards against the
// teardown race where the auto-advance timer fires after the window has
// been destroyed (closing the window quits the app).
function sendToWindow(channel: string, ...args: unknown[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// --- Item rendering ---------------------------------------------------------

function currentProgressKey(): string {
  return progressKey(state.currentLanguage, state.currentFromLanguage, state.currentLevel);
}

// Routes the current item to whichever surface the active mode uses: the tray
// title in Menu Bar mode, the window otherwise.
function renderPhrase(item: Item, index: number, total: number) {
  state.currentIndex = index;
  state.progress[currentProgressKey()] = index;

  if (state.currentMode === MODES.MENU_BAR) {
    // The tray title is a plain string, so a sentence goes in joined and
    // without its translation. The OS truncates a long one.
    tray.setTitle(
      item.kind === "word"
        ? `${item.source}${PHRASE_SEPARATOR}${item.target}`
        : joinTokens(item.target),
    );
  } else {
    sendToWindow(IPC.DISPLAY_PHRASE, {
      item,
      layout: item.kind === "sentence" ? layoutTokens(item.target) : [],
      mode: state.currentMode,
      index,
      total,
    });
  }

  // A sentence is a lesson boundary. State is otherwise written only on quit,
  // so a crash part-way through a course would throw the position away.
  if (item.kind === "sentence") {
    saveState(state);
  }
}

function currentDictionaryPath() {
  return getLanguageFilePath({
    basePath: getDictionariesBasePath(),
    customDictsPath: CUSTOM_DICTS_PATH,
    language: state.currentLanguage,
    fromLanguage: state.currentFromLanguage,
    level: state.currentLevel,
  });
}

function loadCurrentDictionary(startIndex: number) {
  try {
    engine.load(currentDictionaryPath(), startIndex);
  } catch (error) {
    showError("Failed to load phrases.", error);
  }
}

// --- Tray actions -----------------------------------------------------------

function setBackground(background: Background) {
  state.currentBackground = background;
  sendToWindow(IPC.SET_BACKGROUND, background);
  tray.refresh();
}

function switchLanguage(language: string, fromLanguage: string, level: string) {
  // Remember where we were before the key changes under us - but only if
  // the engine has actually loaded something. The tray (and its Settings
  // action) is live before the main window's first `did-finish-load`, so a
  // pair/level switch that races ahead of that first `load()` would
  // otherwise read the engine's uninitialised index (0) and stamp it over
  // real persisted progress for the old key.
  if (engine.hasLoaded()) {
    state.progress[currentProgressKey()] = engine.getIndex();
  }
  state.currentLanguage = language;
  state.currentFromLanguage = fromLanguage;
  state.currentLevel = level;
  loadCurrentDictionary(state.progress[currentProgressKey()] ?? 0);
  sendToWindow(IPC.SET_LANGUAGES, getLocale(fromLanguage), getLocale(language));
  tray.refresh();
}

function switchMode(mode: AppState["currentMode"]) {
  state.currentMode = mode;
  // A mode switch can leave an assemble exercise stranded mid-solve - most
  // visibly, switching to Menu Bar, which has no interaction surface to
  // finish it on. displayPhrase only releases the hold from inside the main
  // window's own render loop, which stops running once it is hidden, so
  // nothing else would ever clear it. Release it unconditionally here so a
  // mode switch can never leave auto-advance (window or tray) stuck off.
  setExerciseHold(false);
  if (mode === MODES.WINDOW || mode === MODES.CHECKUP) {
    if (!mainWindow) {
      createWiredMainWindow();
    } else {
      mainWindow.show();
    }
    tray.setTitle("Vocabularify");
  } else if (mode === MODES.MENU_BAR && mainWindow) {
    mainWindow.hide();
  }
  engine.render();
  registerGlobalShortcuts();
  tray.refresh();
}

function setSpeed(intervalMs: number) {
  state.intervalMs = intervalMs;
  engine.setIntervalMs(intervalMs);
  tray.refresh();
}

function toggleSound(enabled: boolean) {
  state.isSoundMode = enabled;
  sendToWindow(IPC.TOGGLE_SOUND_MODE, enabled);
}

function toggleAssemble(enabled: boolean) {
  state.isAssembleMode = enabled;
  sendToWindow(IPC.SET_ASSEMBLE, enabled);
  // Leaving assemble mid-exercise must not strand the timer.
  if (!enabled) {
    setExerciseHold(false);
  }
  engine.render();
}

function setLevel(level: string) {
  switchLanguage(state.currentLanguage, state.currentFromLanguage, level);
}

// Called from the language settings window. Switches the pair, keeping a
// standard CEFR level (custom levels are pair-specific, so reset to A1).
function setLanguagePair({ to, from }: LanguagePair) {
  const level = String(state.currentLevel).startsWith(CUSTOM_LEVEL_PREFIX)
    ? "A1"
    : state.currentLevel;
  switchLanguage(to, from, level);
}

// Full snapshot consumed by the Settings window.
function getSettings(): SettingsSnapshot {
  return {
    languages: { meta: LANGUAGE_META, pairs: listAvailablePairs() },
    levels: LEVELS,
    customLevels: dictionaries.listCustomDictionaryNamesFor(
      state.currentLanguage,
      state.currentFromLanguage,
    ),
    speeds: SPEED_INTERVALS,
    isMac: process.platform === "darwin",
    modes: [MODES.WINDOW, MODES.MENU_BAR, MODES.CHECKUP],
    current: {
      to: state.currentLanguage,
      from: state.currentFromLanguage,
      level: state.currentLevel,
      background: state.currentBackground,
      mode: state.currentMode,
      sound: state.isSoundMode,
      assemble: state.isAssembleMode,
      intervalMs: state.intervalMs,
    },
  };
}

// --- Input ------------------------------------------------------------------

function handleKeyPress(keyEvent: KeyEvent) {
  if (
    !keyEvent.shiftKey ||
    (keyEvent.key !== "ArrowRight" && keyEvent.key !== "ArrowLeft")
  ) {
    return;
  }
  sendToWindow(IPC.CLEAR_TIMEOUTS);
  if (keyEvent.key === "ArrowRight") {
    engine.next();
  } else {
    engine.previous();
  }
  // Don't resume auto-advance if the pointer is still hovering, or an
  // unsolved exercise is waiting - the engine's own `canAutoAdvance`
  // predicate makes that call, not this call site.
  engine.restartTimer();
}

function setHoverPaused(paused: boolean) {
  isHoverPaused = paused;
  engine.restartTimer();
}

function setExerciseHold(hold: boolean) {
  isExerciseHold = hold;
  engine.restartTimer();
}

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  if (state.currentMode === MODES.MENU_BAR) {
    globalShortcut.register("Shift+Right", () => engine.next());
    globalShortcut.register("Shift+Left", () => engine.previous());
  }
}

// --- Persistence ------------------------------------------------------------

function persist() {
  state.currentIndex = engine.getIndex();
  saveState(state);
}

function quitApp() {
  persist();
  app.quit();
}

// --- Window wiring ----------------------------------------------------------

function createWiredMainWindow() {
  mainWindow = createMainWindow({
    initialBackground: state.currentBackground,
    onClose: () => {
      engine.stop(); // halt the timer before the window is destroyed
      app.quit();
    },
    onReady: (win) => {
      win.webContents.send(
        IPC.SET_LANGUAGES,
        getLocale(state.currentFromLanguage),
        getLocale(state.currentLanguage),
      );
      win.webContents.send(IPC.SET_BACKGROUND, state.currentBackground);
      win.webContents.send(IPC.SET_ASSEMBLE, state.isAssembleMode);
      loadCurrentDictionary(state.progress[currentProgressKey()] ?? state.currentIndex);
      if (state.currentMode === MODES.MENU_BAR) {
        win.hide();
      }
    },
  });
  return mainWindow;
}

// --- App lifecycle ----------------------------------------------------------

app.whenReady().then(() => {
  // Become an accessory app (no Dock icon) BEFORE creating any window. Hiding
  // the Dock flips the activation policy, and doing it after a window exists
  // makes macOS hide and re-show that window - a visible pop/disappear/pop
  // flicker on launch. Setting it first avoids the flicker entirely.
  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  ensureCustomDictsDir();

  engine = createPhraseEngine({
    intervalMs: state.intervalMs,
    onRender: renderPhrase,
    // Auto-advance is off while the pointer is over the window, and while
    // an unsolved assemble card is on screen. Either alone keeps it off.
    // The engine consults this on every path that arms a timer, so no call
    // site (setSpeed, a dictionary/pair/level switch, ...) can bypass it.
    canAutoAdvance: () => !isHoverPaused && !isExerciseHold,
  });

  tray = createTrayController({
    actions: {
      openSettings: () => createSettingsWindow(),
      openAbout: () => createAboutWindow(),
      quit: quitApp,
    },
  });
  tray.create();

  registerIpcHandlers({
    importDictionary: (payload: ImportPayload) => {
      const result = dictionaries.importDictionary(payload);
      tray.refresh();
      return result;
    },
    chooseDictionaryFile: async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Select Dictionary File",
        properties: ["openFile"],
        filters: [{ name: "Text", extensions: ["txt"] }],
      });
      return canceled ? null : filePaths[0];
    },
    openExternal: (url) => {
      // Only ever hand http(s) URLs to the OS to avoid opening arbitrary
      // schemes (file:, etc.) from renderer-supplied input.
      if (typeof url === "string" && /^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    },
    openImport: () => createImportWindow(),
    onKeyPress: handleKeyPress,
    onSetPaused: setHoverPaused,
    onSetHold: setExerciseHold,
    getSettings,
    setLanguagePair,
    setLevel,
    setBackground,
    setMode: switchMode,
    setSound: toggleSound,
    setAssemble: toggleAssemble,
    setSpeed: (ms) => setSpeed(clampInterval(ms)),
  });

  createWiredMainWindow();
  registerGlobalShortcuts();

  if (process.platform === "darwin") {
    mainWindow!.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  mainWindow!.setAlwaysOnTop(true, "screen-saver");

  app.on("activate", () => {
    if (
      BrowserWindow.getAllWindows().length === 0 &&
      (state.currentMode === MODES.WINDOW ||
        state.currentMode === MODES.CHECKUP)
    ) {
      createWiredMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  engine.stop();
  persist();
});
