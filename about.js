const { BrowserWindow } = require('electron');
const path = require('path');

let aboutWindow;

function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 500,
    height: 310,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  aboutWindow.loadFile(path.join(__dirname, 'about.html'));

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

module.exports = {
  createAboutWindow
};
