const { Tray, Menu } = require('electron');
const path = require('path');
const { APP_ROOT } = require('./config');

// Owns the tray icon + its (minimal) context menu. All configuration lives
// in the Settings window; the tray only opens it, About, and Quit. The tray
// title is also used to show the current phrase in Menu Bar mode.
function createTrayController({ actions }) {
  let tray = null;

  function create() {
    tray = new Tray(path.join(APP_ROOT, 'context_menu_icon.png'));
    tray.setTitle('Vocabularify');
    refresh();
    return tray;
  }

  function refresh() {
    if (!tray) {
      return;
    }
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Vocabularify', enabled: false },
        { type: 'separator' },
        { label: 'Settings…', click: actions.openSettings },
        { label: 'About', click: actions.openAbout },
        { type: 'separator' },
        { label: 'Quit', click: actions.quit }
      ])
    );
  }

  function setTitle(title) {
    if (tray) {
      tray.setTitle(title);
    }
  }

  return { create, refresh, setTitle };
}

module.exports = { createTrayController };
