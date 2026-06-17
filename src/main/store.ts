import fs from 'fs';
import { CONFIG_PATH } from './config';
import { normalizeState, DEFAULT_STATE } from '../shared/state';
import type { AppState } from '../shared/types';

// Loads persisted state, always returning a complete, validated object.
// A missing or corrupt config file falls back to defaults rather than
// throwing, so the app can always start.
export function loadState(): AppState {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_STATE };
    }
    return normalizeState(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: AppState): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(normalizeState(state), null, 2));
}
