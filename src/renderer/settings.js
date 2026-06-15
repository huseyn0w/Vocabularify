const learnGrid = document.getElementById('learn-grid');
const fromGrid = document.getElementById('from-grid');
const summary = document.getElementById('summary');

let meta = {};
let pairs = {}; // { targetLang: [sourceLang, ...] }
let selectedTo = null;
let selectedFrom = null;

function card(code, { selected, disabled } = {}) {
  const el = document.createElement('div');
  el.className = 'lang' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '');
  el.dataset.code = code;
  const info = meta[code] || { name: code, flag: '🏳️' };
  el.innerHTML = `<span class="flag">${info.flag}</span><span>${info.name}</span>`;
  return el;
}

function renderLearn() {
  learnGrid.innerHTML = '';
  // Targets are the languages we have any dictionary for.
  for (const code of Object.keys(pairs).sort()) {
    const el = card(code, { selected: code === selectedTo });
    el.addEventListener('click', () => selectTarget(code));
    learnGrid.appendChild(el);
  }
}

function renderFrom() {
  fromGrid.innerHTML = '';
  const sources = pairs[selectedTo] || [];
  // Show every language except the target; disable ones without data.
  for (const code of Object.keys(meta)) {
    if (code === selectedTo) continue;
    const available = sources.includes(code);
    const el = card(code, { selected: code === selectedFrom, disabled: !available });
    if (available) el.addEventListener('click', () => selectSource(code));
    fromGrid.appendChild(el);
  }
}

function renderSummary() {
  if (!selectedTo || !selectedFrom) {
    summary.textContent = '';
    return;
  }
  const t = meta[selectedTo], f = meta[selectedFrom];
  summary.innerHTML = `Learning <b>${t.flag} ${t.name}</b> from <b>${f.flag} ${f.name}</b>`;
}

function selectTarget(code) {
  selectedTo = code;
  const sources = pairs[code] || [];
  // Keep the current source if still valid, else pick the first available.
  if (!sources.includes(selectedFrom)) {
    selectedFrom = sources[0] || null;
  }
  renderLearn();
  renderFrom();
  apply();
}

function selectSource(code) {
  selectedFrom = code;
  renderFrom();
  apply();
}

function apply() {
  renderSummary();
  if (selectedTo && selectedFrom) {
    window.vocab.setLanguagePair(selectedTo, selectedFrom);
  }
}

window.vocab.getLanguageOptions().then(opts => {
  meta = opts.meta;
  pairs = opts.pairs;
  selectedTo = opts.current.to;
  selectedFrom = opts.current.from;
  renderLearn();
  renderFrom();
  renderSummary();
});
