const els = {
  learn: document.getElementById('learn-grid'),
  from: document.getElementById('from-grid'),
  langSummary: document.getElementById('lang-summary'),
  level: document.getElementById('level-row'),
  bg: document.getElementById('bg-row'),
  modeBlock: document.getElementById('mode-block'),
  mode: document.getElementById('mode-row'),
  soundToggle: document.getElementById('sound-toggle'),
  speed: document.getElementById('speed-row'),
  speedCustom: document.getElementById('speed-custom'),
  importBtn: document.getElementById('import-btn')
};

let s = null; // full settings snapshot from main

// Sidebar navigation: show one panel at a time.
const navItems = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
for (const item of navItems) {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    navItems.forEach(n => n.classList.toggle('active', n === item));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
  });
}

// Apply the chosen Light/Dark theme to the settings window itself.
function applyTheme() {
  document.body.classList.toggle('dark', s.current.background === 'dark');
}

function langCard(code, { selected, disabled } = {}) {
  const info = s.languages.meta[code] || { name: code, flag: '🏳️' };
  const el = document.createElement('div');
  el.className = 'lang' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '');
  el.innerHTML = `<span class="flag">${info.flag}</span><span>${info.name}</span>`;
  return el;
}

function chip(label, { selected } = {}) {
  const el = document.createElement('div');
  el.className = 'chip' + (selected ? ' selected' : '');
  el.textContent = label;
  return el;
}

function renderLanguages() {
  const { meta, pairs } = s.languages;
  const { to, from } = s.current;

  els.learn.innerHTML = '';
  for (const code of Object.keys(pairs).sort()) {
    const el = langCard(code, { selected: code === to });
    el.addEventListener('click', () => changePair(code, null));
    els.learn.appendChild(el);
  }

  els.from.innerHTML = '';
  const sources = pairs[to] || [];
  for (const code of Object.keys(meta)) {
    if (code === to) continue;
    const available = sources.includes(code);
    const el = langCard(code, { selected: code === from, disabled: !available });
    if (available) el.addEventListener('click', () => changePair(to, code));
    els.from.appendChild(el);
  }

  const t = meta[to], f = meta[from];
  els.langSummary.innerHTML = t && f ? `Learning <b>${t.flag} ${t.name}</b> from <b>${f.flag} ${f.name}</b>` : '';
}

function renderLevels() {
  els.level.innerHTML = '';
  const items = [...s.levels, ...s.customLevels.map(name => `custom:${name}`)];
  for (const lvl of items) {
    const label = lvl.startsWith('custom:') ? `Custom: ${lvl.slice(7)}` : lvl;
    const el = chip(label, { selected: s.current.level === lvl });
    el.addEventListener('click', async () => {
      await window.vocab.setLevel(lvl);
      s.current.level = lvl;
      renderLevels();
    });
    els.level.appendChild(el);
  }
}

function renderBackground() {
  els.bg.innerHTML = '';
  for (const bg of ['light', 'dark']) {
    const el = chip(bg === 'light' ? 'Light' : 'Dark', { selected: s.current.background === bg });
    el.addEventListener('click', async () => {
      await window.vocab.setBackground(bg);
      s.current.background = bg;
      renderBackground();
      applyTheme();
    });
    els.bg.appendChild(el);
  }
}

function renderMode() {
  if (!s.isMac) {
    els.modeBlock.classList.add('hidden');
    return;
  }
  els.modeBlock.classList.remove('hidden');
  els.mode.innerHTML = '';
  for (const mode of s.modes) {
    const el = chip(mode, { selected: s.current.mode === mode });
    el.addEventListener('click', async () => {
      await window.vocab.setMode(mode);
      s.current.mode = mode;
      renderMode();
    });
    els.mode.appendChild(el);
  }
}

function renderSound() {
  els.soundToggle.classList.toggle('on', s.current.sound);
}

function renderSpeed() {
  els.speed.innerHTML = '';
  for (const ms of s.speeds) {
    const el = chip(`${ms / 1000}s`, { selected: s.current.intervalMs === ms });
    el.addEventListener('click', () => applySpeed(ms));
    els.speed.appendChild(el);
  }
  els.speedCustom.value = Math.round(s.current.intervalMs / 1000);
}

async function applySpeed(ms) {
  await window.vocab.setSpeed(ms);
  s.current.intervalMs = ms;
  renderSpeed();
}

async function changePair(to, from) {
  // When only the target changed, keep the source if still valid else pick first.
  const sources = s.languages.pairs[to] || [];
  const nextFrom = from || (sources.includes(s.current.from) ? s.current.from : sources[0]);
  if (!nextFrom) return;
  await window.vocab.setLanguagePair(to, nextFrom);
  s = await window.vocab.getSettings(); // refresh (level/custom dicts may change)
  renderAll();
}

function renderAll() {
  applyTheme();
  renderLanguages();
  renderLevels();
  renderBackground();
  renderMode();
  renderSound();
  renderSpeed();
}

els.soundToggle.addEventListener('click', async () => {
  const next = !s.current.sound;
  await window.vocab.setSound(next);
  s.current.sound = next;
  renderSound();
});

els.speedCustom.addEventListener('change', () => {
  const seconds = Number(els.speedCustom.value);
  if (Number.isFinite(seconds) && seconds > 0) {
    applySpeed(Math.round(seconds * 1000));
  }
});

els.importBtn.addEventListener('click', () => window.vocab.openImport());

window.vocab.getSettings().then(settings => {
  s = settings;
  renderAll();
});
