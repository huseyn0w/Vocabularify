const { Tray, Menu } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');
const {
  MODES,
  LANGUAGES,
  FROM_LANGUAGES,
  LEVELS,
  SPEED_INTERVALS,
  CUSTOM_LEVEL_PREFIX
} = require('../shared/constants');

// Builds and owns the tray + its context menu. A single template builder
// is used for both initial creation and every refresh, so the menu can
// never drift between code paths (the previous code duplicated it).
//
// `getState` returns the current persisted state; `actions` holds the
// callbacks the menu items invoke; `dictionaries` lists custom dictionaries.
function createTrayController({ getState, actions, dictionaries }) {
  let tray = null;

  function create() {
    tray = new Tray(path.join(APP_ROOT, 'context_menu_icon.png'));
    tray.setTitle('Vocabularify');
    refresh();
    return tray;
  }

  function refresh() {
    if (tray) {
      tray.setContextMenu(Menu.buildFromTemplate(buildTemplate(getState())));
    }
  }

  function setTitle(title) {
    if (tray) {
      tray.setTitle(title);
    }
  }

  function buildTemplate(state) {
    return [
      { label: 'Vocabularify', enabled: false },
      backgroundSubmenu(state),
      { label: 'Language', submenu: languageSubmenu(state) },
      // Menu Bar / Checkup modes only make sense with a macOS menu-bar tray.
      ...(process.platform === 'darwin' ? [modeSubmenu(state)] : []),
      {
        label: 'Sound',
        type: 'checkbox',
        checked: state.isSoundMode,
        click: menuItem => actions.toggleSound(menuItem.checked)
      },
      { label: 'Changing speed', submenu: speedSubmenu(state) },
      { label: 'Import Dictionary', click: actions.openImport },
      { label: 'Delete Dictionary', submenu: deleteSubmenu() },
      { label: 'About', click: actions.openAbout },
      { label: 'Quit', click: actions.quit }
    ];
  }

  function backgroundSubmenu(state) {
    return {
      label: 'Background',
      submenu: ['light', 'dark'].map(bg => ({
        label: bg === 'light' ? 'Light' : 'Dark',
        type: 'radio',
        checked: state.currentBackground === bg,
        click: () => actions.setBackground(bg)
      }))
    };
  }

  function languageSubmenu(state) {
    return LANGUAGES.map(language => ({
      label: language.toUpperCase(),
      submenu: FROM_LANGUAGES[language].map(fromLang => ({
        label: `${fromLang.toUpperCase()} -> ${language.toUpperCase()}`,
        submenu: levelSubmenu(state, language, fromLang)
      }))
    }));
  }

  function levelSubmenu(state, language, fromLang) {
    const isActivePair = state.currentLanguage === language && state.currentFromLanguage === fromLang;
    const customs = dictionaries.listCustomDictionaryNamesFor(language, fromLang);

    return [
      ...LEVELS.map(level => ({
        label: `Level ${level}`,
        type: 'radio',
        checked: isActivePair && state.currentLevel === level,
        click: () => actions.switchLanguage(language, fromLang, level)
      })),
      ...customs.map(name => {
        const level = `${CUSTOM_LEVEL_PREFIX}${name}`;
        return {
          label: `Custom: ${name}`,
          type: 'radio',
          checked: isActivePair && state.currentLevel === level,
          click: () => actions.switchLanguage(language, fromLang, level)
        };
      })
    ];
  }

  function modeSubmenu(state) {
    return {
      label: 'Mode',
      submenu: [MODES.WINDOW, MODES.MENU_BAR, MODES.CHECKUP].map(mode => ({
        label: mode,
        type: 'radio',
        checked: state.currentMode === mode,
        click: () => actions.switchMode(mode)
      }))
    };
  }

  function speedSubmenu(state) {
    return SPEED_INTERVALS.map(ms => ({
      label: `${ms / 1000} seconds`,
      type: 'radio',
      checked: state.intervalMs === ms,
      click: () => actions.setSpeed(ms)
    }));
  }

  function deleteSubmenu() {
    return dictionaries.listCustomDictionaries().map(baseName => ({
      label: baseName,
      click: () => actions.deleteDictionary(baseName)
    }));
  }

  return { create, refresh, setTitle };
}

module.exports = { createTrayController };
