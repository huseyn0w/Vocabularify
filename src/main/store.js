const fs = require('fs');
const { CONFIG_PATH } = require('./config');
const { normalizeState, DEFAULT_STATE } = require('../shared/state');

// Loads persisted state, always returning a complete, validated object.
// A missing or corrupt config file falls back to defaults rather than
// throwing, so the app can always start.
function loadState() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_STATE };
    }
    return normalizeState(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalizeState(state), null, 2));
}

module.exports = { loadState, saveState };
