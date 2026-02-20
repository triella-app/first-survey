#!/usr/bin/env node
// ─── Generate self-contained HTML dashboard ─────────────────────────────────
// Reads data/enquesta.csv → outputs output/dashboard.html
// Reproduces the Streamlit app.py dashboard as a single HTML file with Plotly.

const fs = require('fs');
const path = require('path');
const { parseCSVFile } = require('./csv-parser');
const { normGender, ageGroup, normRelationship } = require('./normalizers');

// ─── Read & parse CSV ───────────────────────────────────────────────────────
let raw;
try {
  raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'enquesta.csv'), 'latin1');
} catch {
  raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'enquesta.csv'), 'utf-8');
}

const records = parseCSVFile(raw);

// ─── Build embedded records with raw fields + 3 pre-normalized ──────────────
const embedded = records.map(r => ({
  id: r.id,
  edat: r.age,
  genere: normGender(r.gender) || 'Altre',
  estat_relacional: normRelationship(r.relationship) || 'Altre',
  rang_edat: ageGroup(r.age),
  frequencia: r.frequency || '',
  experiencia: r.hasTried || '',
  barreres: r.barriers.join(';'),
  que_buscaries: r.lookingFor || '',
  composicio: r.composition.join(';'),
  on_buscaries: r.whereSearch.join(';'),
  usaries_app: r.wouldUseApp || '',
  pagaries: r.wouldPay || '',
  feedback: r.openText || ''
}));

// ─── Extract unique filter values ───────────────────────────────────────────
function uniqueSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort();
}

const filterValues = {
  genere: uniqueSorted(embedded.map(r => r.genere)),
  estat_relacional: uniqueSorted(embedded.map(r => r.estat_relacional)),
  frequencia: uniqueSorted(embedded.map(r => r.frequencia)),
  experiencia: uniqueSorted(embedded.map(r => r.experiencia)),
  que_buscaries: uniqueSorted(embedded.map(r => r.que_buscaries)),
  usaries_app: uniqueSorted(embedded.map(r => r.usaries_app)),
  pagaries: uniqueSorted(embedded.map(r => r.pagaries)),
};

const ages = embedded.map(r => r.edat).filter(a => a != null);
const edatMin = Math.min(...ages);
const edatMax = Math.max(...ages);

// ─── Generate HTML ──────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Enquesta: App social per a grups de 3+</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<style>
/* ── Root variables ──────────────────────────────────────────────────────── */
:root {
  --accent: #a855f7;
  --accent-light: #c084fc;
  --accent-dark: #7c3aed;
  --green: #34d399;
  --yellow: #fbbf24;
  --red: #f87171;
  --blue: #60a5fa;
  --surface: rgba(26, 18, 48, 0.6);
  --glass: rgba(168, 85, 247, 0.08);
  --glass-border: rgba(168, 85, 247, 0.2);
  --text-primary: #f0ecff;
  --text-secondary: #a89ec8;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(165deg, #0f0a1a 0%, #150d2e 30%, #1a1040 60%, #0f0a1a 100%);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 30% 40%, rgba(168,85,247,0.04) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(96,165,250,0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
  animation: orbFloat 20s ease-in-out infinite alternate;
}

@keyframes orbFloat {
  0% { transform: translate(0,0) rotate(0deg); }
  100% { transform: translate(-3%,3%) rotate(5deg); }
}

h1,h2,h3,h4,h5,h6 { font-family: 'Space Grotesk','Inter',sans-serif; }

/* ── Layout ──────────────────────────────────────────────────────────────── */
.layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: linear-gradient(180deg, #150d2e 0%, #1a1040 50%, #0f0a1a 100%);
  border-right: 1px solid rgba(168,85,247,0.15);
  padding: 1.5rem 1rem;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
  align-self: flex-start;
}

.sidebar-title {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.2rem;
  text-align: center;
}

.filter-group { margin-bottom: 1.2rem; }

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.pill-container { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(168,85,247,0.3);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
}

.pill.active {
  background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(96,165,250,0.2));
  border-color: var(--accent);
  color: var(--text-primary);
}

.pill:hover { border-color: var(--accent-light); }

/* Age slider */
.range-container { padding: 0.3rem 0.2rem; }

.range-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--accent-light);
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.dual-range {
  position: relative;
  height: 30px;
  width: 100%;
}

.dual-range input[type=range] {
  position: absolute;
  width: 100%;
  pointer-events: none;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  top: 8px;
}

.dual-range input[type=range]::-webkit-slider-runnable-track {
  height: 4px;
  background: rgba(168,85,247,0.15);
  border-radius: 2px;
}

.dual-range input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  border: 2px solid #c084fc;
  pointer-events: all;
  cursor: pointer;
  margin-top: -7px;
  box-shadow: 0 2px 8px rgba(168,85,247,0.4);
}

.dual-range input[type=range]::-moz-range-track {
  height: 4px;
  background: rgba(168,85,247,0.15);
  border-radius: 2px;
  border: none;
}

.dual-range input[type=range]::-moz-range-thumb {
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  border: 2px solid #c084fc;
  pointer-events: all;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(168,85,247,0.4);
}

/* ── Mobile sidebar toggle ───────────────────────────────────────────────── */
.sidebar-toggle {
  display: none;
  position: fixed;
  top: 1rem; left: 1rem;
  z-index: 1000;
  width: 42px; height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(96,165,250,0.2));
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-size: 1.3rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

/* ── Main content ────────────────────────────────────────────────────────── */
.main {
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  min-width: 0;
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.hero-title {
  text-align: center;
  padding: 1rem 0 0.5rem;
}

.hero-title h1 {
  font-size: 2.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a855f7 0%, #60a5fa 50%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  margin-bottom: 0.2rem;
}

.hero-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  margin-bottom: 1rem;
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */
.kpi-container {
  display: flex;
  gap: 1rem;
  margin: 1rem 0 1.5rem;
  flex-wrap: wrap;
}

.kpi-card {
  flex: 1;
  min-width: 160px;
  background: linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(96,165,250,0.05) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(168,85,247,0.2);
  border-radius: 16px;
  padding: 1.4rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 16px 16px 0 0;
}

.kpi-card:nth-child(1)::before { background: linear-gradient(90deg, #a855f7, #c084fc); }
.kpi-card:nth-child(2)::before { background: linear-gradient(90deg, #60a5fa, #93c5fd); }
.kpi-card:nth-child(3)::before { background: linear-gradient(90deg, #34d399, #6ee7b7); }
.kpi-card:nth-child(4)::before { background: linear-gradient(90deg, #fbbf24, #fcd34d); }

.kpi-card:hover {
  transform: translateY(-4px);
  border-color: rgba(168,85,247,0.4);
  box-shadow: 0 12px 40px rgba(168,85,247,0.15);
}

.kpi-icon { font-size: 1.6rem; margin-bottom: 0.3rem; }

.kpi-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f0ecff, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.kpi-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 0.3rem;
}

/* ── Section headers ─────────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 2rem 0 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(168,85,247,0.15);
}

.section-header .icon {
  font-size: 1.5rem;
  width: 42px; height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(96,165,250,0.1));
  border-radius: 12px;
  border: 1px solid rgba(168,85,247,0.2);
}

.section-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* ── Chart containers ────────────────────────────────────────────────────── */
.chart-row { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.chart-half { flex: 1; min-width: 300px; }
.chart-full { width: 100%; }

.chart-box {
  background: rgba(26,18,48,0.4);
  border: 1px solid rgba(168,85,247,0.1);
  border-radius: 16px;
  padding: 0.5rem;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  overflow: hidden;
  position: relative;
}

.chart-box:hover {
  border-color: rgba(168,85,247,0.25);
  box-shadow: 0 8px 30px rgba(168,85,247,0.08);
}

/* ── Dividers ────────────────────────────────────────────────────────────── */
.divider {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent);
  margin: 2rem 0;
}

/* ── Feedback table ──────────────────────────────────────────────────────── */
.feedback-search {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.5rem;
  border-radius: 12px;
  border: 1px solid rgba(168,85,247,0.2);
  background: rgba(26,18,48,0.6);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.feedback-search:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
}

.search-wrap {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
}

.feedback-count {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.8rem;
}

.feedback-count strong { color: var(--text-primary); }

.fb-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(168,85,247,0.15);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.fb-table th {
  background: rgba(168,85,247,0.12);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.8rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(168,85,247,0.15);
}

.fb-table td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(168,85,247,0.08);
  font-size: 0.9rem;
  color: var(--text-primary);
  vertical-align: top;
}

.fb-table tr:last-child td { border-bottom: none; }

.fb-table tr:hover td { background: rgba(168,85,247,0.05); }

.fb-table td:first-child { white-space: nowrap; width: 50px; }
.fb-table td:nth-child(2) { white-space: nowrap; width: 70px; }
.fb-table td:nth-child(3) { white-space: nowrap; width: 70px; }

/* ── Themes box ──────────────────────────────────────────────────────────── */
.themes-box {
  background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(96,165,250,0.04));
  border: 1px solid rgba(168,85,247,0.15);
  border-radius: 16px;
  padding: 1.5rem;
}

.themes-box ul { padding-left: 1.2rem; }

.themes-box li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.themes-box li strong { color: var(--text-primary); }

/* ── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar { display: none; position: fixed; top: 0; left: 0; z-index: 999; height: 100vh; }
  .sidebar.open { display: block; }
  .sidebar-toggle { display: flex; }
  .main { padding: 1rem; padding-top: 4rem; }
  .hero-title h1 { font-size: 1.8rem; }
  .kpi-container { flex-direction: column; }
  .chart-row { flex-direction: column; }
  .chart-half { min-width: 100%; }
}
</style>
</head>
<body>

<button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle filters">&#9776;</button>

<div class="layout">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-title">Filtres</div>

    <div class="filter-group">
      <div class="filter-label">Gènere</div>
      <div class="pill-container" id="filter-genere">
        ${filterValues.genere.map(v => `<button class="pill active" data-col="genere" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Rang d'edat</div>
      <div class="range-container">
        <div class="range-values"><span id="age-lo">${edatMin}</span><span id="age-hi">${edatMax}</span></div>
        <div class="dual-range">
          <input type="range" id="age-min" min="${edatMin}" max="${edatMax}" value="${edatMin}">
          <input type="range" id="age-max" min="${edatMin}" max="${edatMax}" value="${edatMax}">
        </div>
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Estat relacional</div>
      <div class="pill-container" id="filter-estat_relacional">
        ${filterValues.estat_relacional.map(v => `<button class="pill active" data-col="estat_relacional" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Freqüència</div>
      <div class="pill-container" id="filter-frequencia">
        ${filterValues.frequencia.map(v => `<button class="pill active" data-col="frequencia" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Experiència</div>
      <div class="pill-container" id="filter-experiencia">
        ${filterValues.experiencia.map(v => `<button class="pill active" data-col="experiencia" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Què buscarien</div>
      <div class="pill-container" id="filter-que_buscaries">
        ${filterValues.que_buscaries.map(v => `<button class="pill active" data-col="que_buscaries" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Utilitzarien l'app</div>
      <div class="pill-container" id="filter-usaries_app">
        ${filterValues.usaries_app.map(v => `<button class="pill active" data-col="usaries_app" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-label">Pagarien</div>
      <div class="pill-container" id="filter-pagaries">
        ${filterValues.pagaries.map(v => `<button class="pill active" data-col="pagaries" data-val="${escHtml(v)}">${escHtml(v)}</button>`).join('')}
      </div>
    </div>
  </aside>

  <main class="main">
    <div class="hero-title"><h1>Enquesta: App social per a grups de 3+</h1></div>
    <p class="hero-subtitle">Dashboard interactiu d'anàlisi de l'enquesta</p>

    <div class="kpi-container">
      <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-value" id="kpi-total">0</div><div class="kpi-label">Total respostes</div></div>
      <div class="kpi-card"><div class="kpi-icon">🎂</div><div class="kpi-value" id="kpi-age">–</div><div class="kpi-label">Edat mitjana</div></div>
      <div class="kpi-card"><div class="kpi-icon">🚀</div><div class="kpi-value" id="kpi-app">0%</div><div class="kpi-label">Utilitzarien l'app</div></div>
      <div class="kpi-card"><div class="kpi-icon">💎</div><div class="kpi-value" id="kpi-pay">0%</div><div class="kpi-label">Disposats a pagar</div></div>
    </div>

    <hr class="divider">

    <!-- B. Demografia -->
    <div class="section-header"><span class="icon">📊</span><h2>Demografia</h2></div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-age-hist"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-gender"></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-relationship"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-age-group"></div></div>
    </div>

    <hr class="divider">

    <!-- C. Interès i experiència -->
    <div class="section-header"><span class="icon">🔥</span><h2>Interès i experiència</h2></div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-frequency"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-experience"></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-full"><div class="chart-box" id="chart-barriers"></div></div>
    </div>

    <hr class="divider">

    <!-- D. Preferències -->
    <div class="section-header"><span class="icon">💜</span><h2>Preferències</h2></div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-looking-for"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-composition"></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-full"><div class="chart-box" id="chart-where"></div></div>
    </div>

    <hr class="divider">

    <!-- E. Viabilitat de mercat -->
    <div class="section-header"><span class="icon">📈</span><h2>Viabilitat de mercat</h2></div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-would-use"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-would-pay"></div></div>
    </div>

    <div class="section-header"><span class="icon">🔀</span><h2>Interès en l'app per segments</h2></div>
    <div class="chart-row">
      <div class="chart-half"><div class="chart-box" id="chart-app-gender"></div></div>
      <div class="chart-half"><div class="chart-box" id="chart-app-age"></div></div>
    </div>

    <hr class="divider">

    <!-- F. Feedback obert -->
    <div class="section-header"><span class="icon">💬</span><h2>Feedback obert</h2></div>
    <p class="feedback-count" id="fb-count"></p>
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input class="feedback-search" id="fb-search" type="text" placeholder="Cerca dins els comentaris...">
    </div>
    <table class="fb-table" id="fb-table">
      <thead><tr><th>ID</th><th>Gènere</th><th>Rang d'edat</th><th>Comentari</th></tr></thead>
      <tbody id="fb-body"></tbody>
    </table>

    <div class="section-header"><span class="icon">🏷️</span><h2>Temes principals</h2></div>
    <div class="themes-box">
      <ul>
        <li><strong>Privacitat i anonimat</strong>: Preocupació per ser reconegut/da per persones de l'entorn professional o social.</li>
        <li><strong>Verificació d'identitat</strong>: Demanda de sistemes anti-catfish i verificació real dels perfils.</li>
        <li><strong>Seguretat</strong>: Sol·liciten controls de reputació, vetaments i protecció contra comportaments inadequats.</li>
        <li><strong>Consentiment</strong>: Importància de mecanismes clars de consentiment mutu abans de qualsevol interacció.</li>
        <li><strong>Preu</strong>: La majoria prefereix una versió gratuïta; disposició a pagar és baixa.</li>
        <li><strong>Discreció</strong>: Que l'app no aparegui com a tal al mòbil, mode ocult, etc.</li>
      </ul>
    </div>
  </main>
</div>

<script>
// ─── Embedded data ──────────────────────────────────────────────────────────
var DATA = ${JSON.stringify(embedded)};

// ─── Plotly shared layout ───────────────────────────────────────────────────
var COLORS = ["#a855f7","#60a5fa","#34d399","#fbbf24","#f87171","#c084fc","#38bdf8","#6ee7b7","#fcd34d","#fca5a5"];
var BASE_LAYOUT = {
  template: "plotly_dark",
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: {family: "Inter, sans-serif", color: "#e2e0f0"},
  title: {font: {family: "Space Grotesk, sans-serif", size: 18, color: "#f0ecff"}},
  margin: {l: 40, r: 20, t: 50, b: 40},
  height: 400,
  colorway: COLORS,
  hoverlabel: {bgcolor: "#1a1230", font_size: 13, font_family: "Inter, sans-serif", bordercolor: "rgba(168,85,247,0.3)"},
  xaxis: {gridcolor: "rgba(168,85,247,0.08)", zerolinecolor: "rgba(168,85,247,0.12)"},
  yaxis: {gridcolor: "rgba(168,85,247,0.08)", zerolinecolor: "rgba(168,85,247,0.12)"}
};

function mkLayout(overrides) {
  var l = JSON.parse(JSON.stringify(BASE_LAYOUT));
  for (var k in overrides) {
    if (typeof overrides[k] === 'object' && !Array.isArray(overrides[k]) && l[k]) {
      for (var kk in overrides[k]) l[k][kk] = overrides[k][kk];
    } else {
      l[k] = overrides[k];
    }
  }
  return l;
}

var PLOT_CFG = {responsive: true, displayModeBar: false};

// ─── Client-side normalizers (matching app.py Section E) ────────────────────
function normUsaries(val) {
  if (!val) return "(Sense resposta)";
  var low = val.toLowerCase();
  if (low.indexOf("segur") !== -1 || (low.indexOf("si") === 0 && low.indexOf("segur") === -1)) return "Sí segur";
  if (low.indexOf("potser") !== -1) return "Potser";
  if (low.indexOf("probablement no") !== -1) return "Probablement no";
  if (low.indexOf("no") !== -1) return "Probablement no";
  return val;
}

function normPagaries(val) {
  if (!val) return "(Sense resposta)";
  var low = val.toLowerCase();
  if (low.indexOf("no pagaria") !== -1) return "No pagaria (gratis)";
  if (low.indexOf("potser") !== -1 || low.indexOf("depenent") !== -1) return "Potser, depenent del preu";
  if (low.indexOf("molt baix") !== -1) return "Només si preu molt baix";
  if (low.indexOf("segurament") !== -1) return "Sí, segurament";
  return val;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function countBy(arr, key) {
  var m = {};
  arr.forEach(function(r) {
    var v = typeof key === 'function' ? key(r) : r[key];
    if (v == null || v === '') return;
    m[v] = (m[v] || 0) + 1;
  });
  return m;
}

function explode(arr, key) {
  var vals = [];
  arr.forEach(function(r) {
    var raw = r[key];
    if (!raw) return;
    raw.split(';').forEach(function(s) {
      s = s.trim();
      if (s && s !== '-') vals.push(s);
    });
  });
  return vals;
}

function countList(vals) {
  var m = {};
  vals.forEach(function(v) { m[v] = (m[v] || 0) + 1; });
  return m;
}

function sortedEntries(obj, desc) {
  var entries = Object.entries(obj);
  entries.sort(function(a, b) { return desc ? b[1] - a[1] : a[1] - b[1]; });
  return entries;
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Filters state ──────────────────────────────────────────────────────────
// Columns where empty values pass through (non-required fields)
var PASSTHROUGH_COLS = ['frequencia','experiencia','que_buscaries','usaries_app','pagaries'];

function getActiveValues(col) {
  var container = document.getElementById('filter-' + col);
  if (!container) return null;
  var pills = container.querySelectorAll('.pill.active');
  var vals = [];
  pills.forEach(function(p) { vals.push(p.getAttribute('data-val')); });
  return vals;
}

function applyFilters() {
  var ageMin = parseInt(document.getElementById('age-min').value);
  var ageMax = parseInt(document.getElementById('age-max').value);
  if (ageMin > ageMax) { var tmp = ageMin; ageMin = ageMax; ageMax = tmp; }
  document.getElementById('age-lo').textContent = ageMin;
  document.getElementById('age-hi').textContent = ageMax;

  var filters = {
    genere: getActiveValues('genere'),
    estat_relacional: getActiveValues('estat_relacional'),
    frequencia: getActiveValues('frequencia'),
    experiencia: getActiveValues('experiencia'),
    que_buscaries: getActiveValues('que_buscaries'),
    usaries_app: getActiveValues('usaries_app'),
    pagaries: getActiveValues('pagaries')
  };

  var filtered = DATA.filter(function(r) {
    // Age filter
    if (r.edat != null && (r.edat < ageMin || r.edat > ageMax)) return false;

    for (var col in filters) {
      var allowed = filters[col];
      if (!allowed || allowed.length === 0) {
        // No pills selected → nothing passes
        return false;
      }
      var val = r[col];
      // Passthrough: empty values always pass
      if (PASSTHROUGH_COLS.indexOf(col) !== -1 && (!val || val === '')) continue;
      if (allowed.indexOf(val) === -1) return false;
    }
    return true;
  });

  updateURL(ageMin, ageMax, filters);
  renderDashboard(filtered);
}

// ─── URL query param sync ───────────────────────────────────────────────────
var PILL_COLS = ['genere','estat_relacional','frequencia','experiencia','que_buscaries','usaries_app','pagaries'];

function getAllValues(col) {
  var container = document.getElementById('filter-' + col);
  if (!container) return [];
  var pills = container.querySelectorAll('.pill');
  var vals = [];
  pills.forEach(function(p) { vals.push(p.getAttribute('data-val')); });
  return vals;
}

function updateURL(ageMin, ageMax, filters) {
  var params = new URLSearchParams();
  var globalMin = parseInt(document.getElementById('age-min').min);
  var globalMax = parseInt(document.getElementById('age-min').max);
  if (ageMin !== globalMin || ageMax !== globalMax) {
    params.set('age_min', ageMin);
    params.set('age_max', ageMax);
  }
  PILL_COLS.forEach(function(col) {
    var all = getAllValues(col);
    var active = filters[col] || [];
    // Only add param if not all are selected (i.e. user deselected something)
    if (active.length < all.length) {
      params.set(col, active.join(','));
    }
  });
  var qs = params.toString();
  var url = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', url);
}

function initFromURL() {
  var params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;

  // Age range
  if (params.has('age_min')) {
    document.getElementById('age-min').value = params.get('age_min');
  }
  if (params.has('age_max')) {
    document.getElementById('age-max').value = params.get('age_max');
  }

  // Pill filters
  PILL_COLS.forEach(function(col) {
    if (!params.has(col)) return;
    var wanted = params.get(col).split(',');
    var container = document.getElementById('filter-' + col);
    if (!container) return;
    container.querySelectorAll('.pill').forEach(function(pill) {
      var val = pill.getAttribute('data-val');
      if (wanted.indexOf(val) !== -1) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  });
}

// ─── Pill click handlers ────────────────────────────────────────────────────
document.querySelectorAll('.pill').forEach(function(pill) {
  pill.addEventListener('click', function() {
    this.classList.toggle('active');
    applyFilters();
  });
});

// ─── Age slider handlers ────────────────────────────────────────────────────
document.getElementById('age-min').addEventListener('input', applyFilters);
document.getElementById('age-max').addEventListener('input', applyFilters);

// ─── Sidebar toggle ─────────────────────────────────────────────────────────
document.getElementById('sidebarToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── Feedback search ────────────────────────────────────────────────────────
var lastFiltered = DATA;
document.getElementById('fb-search').addEventListener('input', function() {
  renderFeedback(lastFiltered, this.value);
});

// ─── Render dashboard ───────────────────────────────────────────────────────
function renderDashboard(records) {
  lastFiltered = records;

  // KPIs
  var total = records.length;
  document.getElementById('kpi-total').textContent = total;

  var ages = records.filter(function(r) { return r.edat != null; }).map(function(r) { return r.edat; });
  if (ages.length > 0) {
    var avg = ages.reduce(function(a,b) { return a+b; }, 0) / ages.length;
    document.getElementById('kpi-age').textContent = avg.toFixed(1);
  } else {
    document.getElementById('kpi-age').textContent = '–';
  }

  if (total > 0) {
    var usaPositiu = records.filter(function(r) { return /segur|potser|si,/i.test(r.usaries_app); }).length;
    document.getElementById('kpi-app').textContent = Math.round(usaPositiu / total * 100) + '%';

    var pagPositiu = records.filter(function(r) {
      return r.pagaries && r.pagaries !== '' && !/no pagaria/i.test(r.pagaries);
    }).length;
    document.getElementById('kpi-pay').textContent = Math.round(pagPositiu / total * 100) + '%';
  } else {
    document.getElementById('kpi-app').textContent = '0%';
    document.getElementById('kpi-pay').textContent = '0%';
  }

  // ── B. Demografia charts ────────────────────────────────────────────────
  // Age histogram
  var ageVals = records.filter(function(r) { return r.edat != null; }).map(function(r) { return r.edat; });
  Plotly.react('chart-age-hist', [{
    x: ageVals, type: 'histogram', nbinsx: 20,
    marker: {color: '#a855f7'}
  }], mkLayout({title: {text: "Distribució d'edat"}, bargap: 0.1, xaxis: {title: 'Edat', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Gender bar
  var gCounts = countBy(records, 'genere');
  var gEntries = sortedEntries(gCounts, true);
  Plotly.react('chart-gender', [{
    x: gEntries.map(function(e){return e[0];}),
    y: gEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: gEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Distribució de gènere"}, showlegend: false, xaxis: {title: 'Gènere', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Relationship h-bar
  var rCounts = countBy(records, 'estat_relacional');
  var rEntries = sortedEntries(rCounts, false);
  Plotly.react('chart-relationship', [{
    y: rEntries.map(function(e){return e[0];}),
    x: rEntries.map(function(e){return e[1];}),
    type: 'bar', orientation: 'h',
    marker: {color: rEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Estat relacional"}, showlegend: false, height: Math.max(300, rEntries.length * 50 + 90), margin: {l: 160, r: 20, t: 50, b: 40}, yaxis: {gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, xaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Age group bar
  var AGE_ORDER = ["18-20","21-25","26-30","31-35","36-40","41+"];
  var agCounts = countBy(records, 'rang_edat');
  Plotly.react('chart-age-group', [{
    x: AGE_ORDER,
    y: AGE_ORDER.map(function(g){return agCounts[g] || 0;}),
    type: 'bar',
    marker: {color: AGE_ORDER.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Distribució per rang d'edat"}, showlegend: false, xaxis: {title: "Rang d'edat", gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // ── C. Interès i experiència ─────────────────────────────────────────────
  // Frequency bar
  var fCounts = countBy(records, 'frequencia');
  var fEntries = sortedEntries(fCounts, true);
  Plotly.react('chart-frequency', [{
    x: fEntries.map(function(e){return e[0];}),
    y: fEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: fEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Amb quina freqüència hi pensen?"}, showlegend: false, xaxis: {title: 'Freqüència', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Experience bar
  var eCounts = countBy(records, 'experiencia');
  var eEntries = sortedEntries(eCounts, true);
  Plotly.react('chart-experience', [{
    x: eEntries.map(function(e){return e[0];}),
    y: eEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: eEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Ho han intentat alguna vegada?"}, showlegend: false, xaxis: {title: 'Experiència', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Barriers h-bar (exploded)
  var bVals = explode(records, 'barreres');
  var bCounts = countList(bVals);
  var bEntries = sortedEntries(bCounts, false);
  if (bEntries.length > 0) {
    Plotly.react('chart-barriers', [{
      y: bEntries.map(function(e){return e[0];}),
      x: bEntries.map(function(e){return e[1];}),
      type: 'bar', orientation: 'h',
      marker: {color: bEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
    }], mkLayout({title: {text: "Barreres principals (multi-select)"}, showlegend: false, height: Math.max(300, bEntries.length * 50 + 90), margin: {l: 250, r: 20, t: 50, b: 40}, yaxis: {categoryorder: 'total ascending', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, xaxis: {title: 'Mencions', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);
  } else {
    Plotly.react('chart-barriers', [], mkLayout({title: {text: "Barreres principals (multi-select)"}}), PLOT_CFG);
  }

  // ── D. Preferències ───────────────────────────────────────────────────────
  // What they seek bar
  var lfCounts = {};
  records.forEach(function(r) { if (r.que_buscaries) { lfCounts[r.que_buscaries] = (lfCounts[r.que_buscaries] || 0) + 1; } });
  var lfEntries = sortedEntries(lfCounts, true);
  Plotly.react('chart-looking-for', [{
    x: lfEntries.map(function(e){return e[0];}),
    y: lfEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: lfEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Què buscarien?"}, showlegend: false, xaxis: {title: 'Buscaria', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Composition bar (exploded)
  var cVals = explode(records, 'composicio');
  var cCounts = countList(cVals);
  var cEntries = sortedEntries(cCounts, true);
  Plotly.react('chart-composition', [{
    x: cEntries.map(function(e){return e[0];}),
    y: cEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: cEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Composició preferida (multi-select)"}, showlegend: false, xaxis: {title: 'Composició', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Mencions', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Where search h-bar (exploded)
  var wVals = explode(records, 'on_buscaries');
  var wCounts = countList(wVals);
  var wEntries = sortedEntries(wCounts, false);
  if (wEntries.length > 0) {
    Plotly.react('chart-where', [{
      y: wEntries.map(function(e){return e[0];}),
      x: wEntries.map(function(e){return e[1];}),
      type: 'bar', orientation: 'h',
      marker: {color: wEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
    }], mkLayout({title: {text: "On buscarien actualment? (multi-select)"}, showlegend: false, height: Math.max(300, wEntries.length * 50 + 90), margin: {l: 200, r: 20, t: 50, b: 40}, yaxis: {categoryorder: 'total ascending', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, xaxis: {title: 'Mencions', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);
  } else {
    Plotly.react('chart-where', [], mkLayout({title: {text: "On buscarien actualment? (multi-select)"}}), PLOT_CFG);
  }

  // ── E. Viabilitat de mercat ─────────────────────────────────────────────
  var SENTIMENT_COLORS = {"Sí segur": "#34d399", "Potser": "#fbbf24", "Probablement no": "#f87171", "(Sense resposta)": "#6b7280"};

  // Would use app (normalized)
  var uNorm = {};
  records.forEach(function(r) {
    var v = normUsaries(r.usaries_app);
    uNorm[v] = (uNorm[v] || 0) + 1;
  });
  var uEntries = sortedEntries(uNorm, true);
  Plotly.react('chart-would-use', [{
    x: uEntries.map(function(e){return e[0];}),
    y: uEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: uEntries.map(function(e){return SENTIMENT_COLORS[e[0]] || COLORS[0];})}
  }], mkLayout({title: {text: "Utilitzarien l'app?"}, showlegend: false, xaxis: {title: 'Resposta', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Would pay (normalized)
  var pNorm = {};
  records.forEach(function(r) {
    var v = normPagaries(r.pagaries);
    pNorm[v] = (pNorm[v] || 0) + 1;
  });
  var pEntries = sortedEntries(pNorm, true);
  Plotly.react('chart-would-pay', [{
    x: pEntries.map(function(e){return e[0];}),
    y: pEntries.map(function(e){return e[1];}),
    type: 'bar',
    marker: {color: pEntries.map(function(_,i){return COLORS[i % COLORS.length];})}
  }], mkLayout({title: {text: "Pagarien per premium?"}, showlegend: false, xaxis: {title: 'Resposta', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Stacked: app by gender
  var sentimentKeys = Object.keys(SENTIMENT_COLORS);
  var genders = Object.keys(countBy(records, 'genere'));
  var crossGender = {};
  records.forEach(function(r) {
    var g = r.genere;
    var u = normUsaries(r.usaries_app);
    if (!crossGender[g]) crossGender[g] = {};
    crossGender[g][u] = (crossGender[g][u] || 0) + 1;
  });
  var gTraces = sentimentKeys.map(function(sk) {
    return {
      x: genders,
      y: genders.map(function(g) { return (crossGender[g] && crossGender[g][sk]) || 0; }),
      name: sk,
      type: 'bar',
      marker: {color: SENTIMENT_COLORS[sk]}
    };
  });
  Plotly.react('chart-app-gender', gTraces, mkLayout({title: {text: "Interès en l'app per gènere"}, barmode: 'stack', xaxis: {title: 'Gènere', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // Stacked: app by age group
  var crossAge = {};
  records.forEach(function(r) {
    var ag = r.rang_edat;
    if (!ag) return;
    var u = normUsaries(r.usaries_app);
    if (!crossAge[ag]) crossAge[ag] = {};
    crossAge[ag][u] = (crossAge[ag][u] || 0) + 1;
  });
  var aTraces = sentimentKeys.map(function(sk) {
    return {
      x: AGE_ORDER,
      y: AGE_ORDER.map(function(ag) { return (crossAge[ag] && crossAge[ag][sk]) || 0; }),
      name: sk,
      type: 'bar',
      marker: {color: SENTIMENT_COLORS[sk]}
    };
  });
  Plotly.react('chart-app-age', aTraces, mkLayout({title: {text: "Interès en l'app per rang d'edat"}, barmode: 'stack', xaxis: {title: "Rang d'edat", categoryorder: 'array', categoryarray: AGE_ORDER, gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}, yaxis: {title: 'Respostes', gridcolor: 'rgba(168,85,247,0.08)', zerolinecolor: 'rgba(168,85,247,0.12)'}}), PLOT_CFG);

  // ── F. Feedback ─────────────────────────────────────────────────────────
  renderFeedback(records, document.getElementById('fb-search').value);
}

function renderFeedback(records, searchTerm) {
  var fb = records.filter(function(r) { return r.feedback && r.feedback.trim() !== ''; });
  if (searchTerm) {
    var q = searchTerm.toLowerCase();
    fb = fb.filter(function(r) { return r.feedback.toLowerCase().indexOf(q) !== -1; });
  }
  document.getElementById('fb-count').innerHTML = '<strong>' + fb.length + '</strong> respostes amb comentaris';
  var html = '';
  fb.forEach(function(r) {
    html += '<tr><td>' + r.id + '</td><td>' + escapeHtml(r.genere) + '</td><td>' + (r.rang_edat || '') + '</td><td>' + escapeHtml(r.feedback) + '</td></tr>';
  });
  document.getElementById('fb-body').innerHTML = html;
}

// ─── Resize handler — force Plotly to recalculate dimensions ────────────────
var resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    document.querySelectorAll('.chart-box').forEach(function(el) {
      Plotly.Plots.resize(el);
    });
  }, 150);
});

// ─── Initial render ─────────────────────────────────────────────────────────
initFromURL();
applyFilters();
</script>
</body>
</html>`;

// ─── Write output ───────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dashboard.html'), html, 'utf-8');
console.log('✓ output/dashboard.html generated (' + embedded.length + ' records)');

// ─── HTML escaping helper ───────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
