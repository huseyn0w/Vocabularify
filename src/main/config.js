const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Project root (two levels up from src/main). Built-in dictionaries live
// under <root>/languages in development; under process.resourcesPath when
// packaged (see the `extraResources` entry in package.json).
const APP_ROOT = path.join(__dirname, '..', '..');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const CUSTOM_DICTS_PATH = path.join(app.getPath('userData'), 'custom_dictionaries');

// In a packaged build the dictionaries are shipped under resourcesPath (see
// `extraResources` in package.json); when running from source they live in
// the project root. app.isPackaged is the reliable signal for this — unlike
// NODE_ENV, it is correct however the app was launched.
function getDictionariesBasePath() {
  return app.isPackaged ? process.resourcesPath : APP_ROOT;
}

// Ensures the directory for user-imported dictionaries exists. Safe to call
// repeatedly (recursive: true is a no-op when the directory is present).
function ensureCustomDictsDir() {
  fs.mkdirSync(CUSTOM_DICTS_PATH, { recursive: true });
}

// Scans the built-in dictionaries and returns { <targetLang>: [<sourceLang>, ...] }
// for every pair that actually has data on disk. This is the source of truth
// for which language combinations the UI offers.
function listAvailablePairs() {
  const base = path.join(getDictionariesBasePath(), 'languages');
  const pairs = {};
  for (const to of fs.readdirSync(base)) {
    if (to.startsWith('_') || to.startsWith('.')) continue;
    const toDir = path.join(base, to);
    if (!fs.statSync(toDir).isDirectory()) continue;
    const froms = fs.readdirSync(toDir).filter(from => {
      const d = path.join(toDir, from);
      return !from.startsWith('.') && fs.statSync(d).isDirectory();
    });
    if (froms.length) pairs[to] = froms.sort();
  }
  return pairs;
}

module.exports = {
  APP_ROOT,
  CONFIG_PATH,
  CUSTOM_DICTS_PATH,
  getDictionariesBasePath,
  ensureCustomDictsDir,
  listAvailablePairs
};
