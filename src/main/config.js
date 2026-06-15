const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Project root (two levels up from src/main). Built-in dictionaries live
// under <root>/languages in development; under process.resourcesPath when
// packaged (see the `extraResources` entry in package.json).
const APP_ROOT = path.join(__dirname, '..', '..');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const CUSTOM_DICTS_PATH = path.join(app.getPath('userData'), 'custom_dictionaries');

function getDictionariesBasePath() {
  return process.env.NODE_ENV === 'development' ? APP_ROOT : process.resourcesPath;
}

// Ensures the directory for user-imported dictionaries exists. Safe to call
// repeatedly (recursive: true is a no-op when the directory is present).
function ensureCustomDictsDir() {
  fs.mkdirSync(CUSTOM_DICTS_PATH, { recursive: true });
}

module.exports = {
  APP_ROOT,
  CONFIG_PATH,
  CUSTOM_DICTS_PATH,
  getDictionariesBasePath,
  ensureCustomDictsDir
};
