const { Tray, Menu } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');
const {
  MODES,
  LEVELS,
  SPEED_INTERVALS,
  CUSTOM_LEVEL_PREFIX,
  LANGUAGE_META
} = require('../shared/constants');

// Builds and owns the tray + its context menu. A single template builder
// is used for both initial creation and every refresh, so the menu can
// never drift between code paths.
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
      // Language pair is chosen in the settings window; the label shows the
      // current source -> target as flags.
      { label: languageLabel(state), click: actions.openSettings },
      { label: 'Level', submenu: levelSubmenu(state) },
      backgroundSubmenu(state),
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
      { label: 'About', click: actions.openAbout },
      { label: 'Quit', click: actions.quit }
    ];
  }

  function languageLabel(state) {
    const from = LANGUAGE_META[state.currentFromLanguage];
    const to = LANGUAGE_META[state.currentLanguage];
    const pair = from && to ? `${from.flag} → ${to.flag}` : '';
    return `Language ${pair}…`.trim();
  }

  // Level + any custom dictionaries for the CURRENT pair.
  function levelSubmenu(state) {
    const { currentLanguage: to, currentFromLanguage: from, currentLevel } = state;
    const customs = dictionaries.listCustomDictionaryNamesFor(to, from);
    return [
      ...LEVELS.map(level => ({
        label: `Level ${level}`,
        type: 'radio',
        checked: currentLevel === level,
        click: () => actions.setLevel(level)
      })),
      ...(customs.length ? [{ type: 'separator' }] : []),
      ...customs.map(name => {
        const level = `${CUSTOM_LEVEL_PREFIX}${name}`;
        return {
          label: `Custom: ${name}`,
          type: 'radio',
          checked: currentLevel === level,
          click: () => actions.setLevel(level)
        };
      })
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
    const isCustom = !SPEED_INTERVALS.includes(state.intervalMs);
    return [
      ...SPEED_INTERVALS.map(ms => ({
        label: `${ms / 1000} seconds`,
        type: 'radio',
        checked: state.intervalMs === ms,
        click: () => actions.setSpeed(ms)
      })),
      { type: 'separator' },
      {
        label: isCustom ? `Custom… (${state.intervalMs / 1000}s)` : 'Custom…',
        type: 'radio',
        checked: isCustom,
        click: () => actions.openCustomSpeed()
      }
    ];
  }

  return { create, refresh, setTitle };
}

module.exports = { createTrayController };
