const { BrowserWindow } = require('electron');
const path = require('path');

if (process.env.NODE_ENV === 'development') {
    try {
      require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        awaitWriteFinish: true
      });
    } catch (error) {
      console.error('Error loading electron-reload:', error);
    }
  }  

let aboutWindow;

function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 500,
    height: 320,
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
