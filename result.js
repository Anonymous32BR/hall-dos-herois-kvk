import { calculateRanking } from './logic/ranking.js';
import { formatNumber } from './logic/calculator.js';

// --- I18N SYSTEM ---
const i18n = {
  "pt-BR": {
    kvk_report_title: "KVK REPORT",
    official_report: "RELATÓRIO OFICIAL",
    champion_kingdom: "Reino Campeão",
    global_summary: "⚔️ Resumo Global",
    total_score: "Pontuação Total",
    total_t5: "Total T5",
    total_t4: "Total T4",
    footer_proof: "Este documento comprova a pontuação do KvK.",
    footer_title: "Calculadora Hall dos Heróis",
    footer_rights: "© Todos os direitos reservados — Anonymous K32",
    footer_version: "Versão 2.0"
  },
  "en-US": {
    kvk_report_title: "KVK REPORT",
    official_report: "OFFICIAL REPORT",
    champion_kingdom: "Champion Kingdom",
    global_summary: "⚔️ Global Summary",
    total_score: "Total Score",
    total_t5: "T5 Total",
    total_t4: "T4 Total",
    footer_proof: "This document certifies the KvK score.",
    footer_title: "Hall of Heroes Calculator",
    footer_rights: "© All rights reserved — Anonymous K32",
    footer_version: "Version 2.0"
  }
};

let currentLang = localStorage.getItem('kvk_lang') || 'pt-BR';

// Expose to window for HTML buttons
window.setLanguage = function (lang) {
  currentLang = lang;
  localStorage.setItem('kvk_lang', lang);
  applyTranslations();
  updateLangButtons();
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.innerText.includes(currentLang === 'pt-BR' ? 'PT' : 'EN')) {
      btn.classList.add('active-lang');
    } else {
      btn.classList.remove('active-lang');
    }
  });
}

function applyTranslations() {
  const dict = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const sessionJson = sessionStorage.getItem('kvk_session');

  // I18n Init
  updateLangButtons();
  applyTranslations();

  if (!sessionJson) {
    alert('Nenhum dado de sessão encontrado. Volte e calcule novamente.');
    window.location.href = 'index.html';
    return;
  }

  const sessionData = JSON.parse(sessionJson);
  renderChampion(sessionData.champion);
  renderFullRanking(sessionData.ranking);
});

function renderChampion(champion) {
  if (!champion) return;
  // Use generic ID if possible, otherwise refactor specific elements
  const champNameEl = document.getElementById('champName');
  if (champNameEl) champNameEl.textContent = champion.reino || "Reino Desconhecido";

  const champScoreEl = document.getElementById('champScore');
  if (champScoreEl) champScoreEl.textContent = `${formatNumber(champion.totalPontos)} pts`;
}

function renderFullRanking(ranking) {
  const listEl = document.getElementById('rankingList');
  if (!listEl) return; // rankingList might not exist in the new layout if removed

  listEl.innerHTML = '';

  ranking.forEach((r, index) => {
    const pos = index + 1;
    let rankClass = '';
    let medal = '';

    // Medalhas para Top 3
    if (pos === 1) { rankClass = 'rank-1'; medal = '🥇'; }
    else if (pos === 2) { rankClass = 'rank-2'; medal = '🥈'; }
    else if (pos === 3) { rankClass = 'rank-3'; medal = '🥉'; }
    else { medal = `#${pos}`; }

    const row = document.createElement('div');
    row.className = `ranking-row ${rankClass}`;
    row.innerHTML = `
      <div class="ranking-pos">${medal}</div>
      <div class="ranking-reino">${r.reino || "Reino " + (index + 1)}</div>
      <div class="ranking-pontos">${formatNumber(r.totalPontos)} pts</div>
    `;
    listEl.appendChild(row);
  });
}

// --- REPORT LOGIC ---

// Listeners
document.getElementById('btnGenerateReport').addEventListener('click', () => {
  const sessionData = JSON.parse(sessionStorage.getItem('kvk_session'));
  if (sessionData) {
    populateReport(sessionData);
    document.getElementById('reportModal').style.display = 'flex';
  }
});

document.getElementById('btnCloseReport').addEventListener('click', () => {
  document.getElementById('reportModal').style.display = 'none';
});

const downloadMobileBtn = document.getElementById('btnDownloadMobile');
const downloadDesktopBtn = document.getElementById('btnDownloadDesktop');

downloadMobileBtn.addEventListener('click', () => handleDownload('mobile'));
downloadDesktopBtn.addEventListener('click', () => handleDownload('desktop'));

// --- HANDLE DOWNLOAD ---
// --- HANDLE DOWNLOAD (OFF-SCREEN CLONE STRATEGY) ---
function handleDownload(mode) {
  const mobileBtn = document.getElementById('btnDownloadMobile');
  const desktopBtn = document.getElementById('btnDownloadDesktop');
  const clickedBtn = mode === 'mobile' ? mobileBtn : desktopBtn;
  const originalText = clickedBtn.innerText;

  // Feedback
  clickedBtn.innerText = "⏳ Gerando...";

  // Apply Export Mode mainly for scaling details
  document.body.classList.add('export-mode');

  // 1. IDENTIFY SOURCE
  const originalId = mode === 'mobile' ? 'report-mobile' : 'report-desktop';
  const originalEl = document.getElementById(originalId);

  if (!originalEl) {
    console.error("Target element not found:", originalId);
    clickedBtn.innerText = "❌ Erro";
    document.body.classList.remove('export-mode');
    setTimeout(() => clickedBtn.innerText = originalText, 2000);
    return;
  }

  // 2. CLONE & PREPARE CONTAINER
  const clone = originalEl.cloneNode(true);

  // Default Dimensions
  const width = mode === 'desktop' ? 1920 : 1080;
  let height = mode === 'desktop' ? 1080 : 1920;

  // Create temp wrapper attached to BODY
  const wrapper = document.createElement('div');
  wrapper.id = 'export-wrapper-temp';
  wrapper.style.position = 'absolute';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = width + 'px';
  // Wrapper height will be determined by content for mobile
  wrapper.style.zIndex = '-9999';
  wrapper.style.visibility = 'visible';
  wrapper.style.background = '#0f0c29';
  wrapper.style.overflow = 'hidden';

  // Apply specific styles for mode
  if (mode === 'desktop') {
    wrapper.style.height = '1080px';
    clone.style.width = '1920px';
    clone.style.height = '1080px';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.position = 'static';
    clone.style.display = 'flex';
  } else {
    // MOBILE: Auto height to fit all content
    wrapper.style.height = 'auto'; // Allow expansion
    wrapper.style.minHeight = '1920px';
    clone.style.width = width + 'px';
    clone.style.height = 'auto'; // Allow expansion
    clone.style.minHeight = '1920px';
    clone.style.maxWidth = 'none';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.position = 'static';
    clone.style.display = 'block';
  }

  // Add export class to clone as well just in case
  if (mode === 'mobile') clone.classList.add('mobile');

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // CALC ACTUAL HEIGHT (For Mobile)
  if (mode === 'mobile') {
    height = wrapper.scrollHeight; // Capture full height including overflow
    // Update wrapper explicitly to match for html2canvas
    wrapper.style.height = height + 'px';
  }

  // 3. CAPTURE
  window.scrollTo(0, 0);

  setTimeout(() => {
    html2canvas(wrapper, {
      scale: 1,
      width: width,
      height: height,
      windowWidth: width,
      windowHeight: height,
      useCORS: true,
      backgroundColor: '#0f0c29',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `KVK_REPORT_${mode.toUpperCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Cleanup
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      document.body.classList.remove('export-mode');
      clickedBtn.innerText = "✅ Sucesso!";
      setTimeout(() => clickedBtn.innerText = originalText, 2500);

    }).catch(err => {
      console.error("Export Error:", err);
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      document.body.classList.remove('export-mode');
      clickedBtn.innerText = "❌ Erro";
      setTimeout(() => clickedBtn.innerText = originalText, 2000);
    });
  }, 500); // Increased timeout slightly for layout recalc
}


// --- POPULATE DATA ---
function formatCompactNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' M';
  }
  return formatNumber(num);
}

function populateReport(data) {
  const champ = data.champion;
  const ranking = data.ranking || [];

  // Helper to set text everywhere a class exists
  const setAll = (selector, val) => {
    document.querySelectorAll(selector).forEach(el => el.textContent = val);
  };

  // 1. GLOBAL TEXTS
  setAll('.data-date', new Date().toLocaleDateString('pt-BR'));
  setAll('.data-champion-name', champ.reino || "N/A");

  // Config Rules (T5/T4)
  const config = data.config || { t5: 20, t4: 8 };
  setAll('.data-config-t5', config.t5);
  setAll('.data-config-t4', config.t4);

  // 2. GLOBAL STATS CALC
  let globalScore = 0, globalT5 = 0, globalT4 = 0;
  ranking.forEach(r => {
    globalScore += r.totalPontos;
    globalT5 += (r.stats?.totalT5 || 0);
    globalT4 += (r.stats?.totalT4 || 0);
  });

  setAll('.data-global-score', formatCompactNumber(globalScore));
  setAll('.data-global-t5', formatCompactNumber(globalT5));
  setAll('.data-global-t4', formatCompactNumber(globalT4));

  // 3. GENERATE KINGDOM CARDS (HTML String)
  let kingdomsHTML = '';
  ranking.forEach(kingdom => {
    const bd = kingdom.breakdown || {};
    const stats = kingdom.stats || { totalT5: 0, totalT4: 0 };

    kingdomsHTML += `
        <div class="kingdom-card">
            <div class="kingdom-card-header">
                <div class="kingdom-name">🏰 Reino ${kingdom.reino}</div>
                <div class="score-wrapper">
                    <div class="score-primary">${formatCompactNumber(kingdom.totalPontos)}</div>
                    <div class="score-secondary">(${formatNumber(kingdom.totalPontos)} pts)</div>
                </div>
            </div>

            <!-- T5 -->
            <div class="troop-block">
                <div style="color:#ffcd58; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:8px; font-size:0.9em;">
                    TIER 5
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Infantaria</span> <span>${formatNumber(bd.infantry_t5 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Cavalaria</span> <span>${formatNumber(bd.cavalry_t5 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Arqueiros</span> <span>${formatNumber(bd.archer_t5 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Cerco</span> <span>${formatNumber(bd.siege_t5 || 0)}</span>
                </div>
                <div class="troop-total" style="text-align:right; color:#FFD700; font-weight:bold; font-size:1em; margin-top:5px;">
                   Total T5: ${formatNumber(stats.totalT5)}
                </div>
            </div>

            <!-- T4 -->
            <div class="troop-block">
                <div style="color:#cd7f32; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:8px; font-size:0.9em;">
                    TIER 4
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Infantaria</span> <span>${formatNumber(bd.infantry_t4 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Cavalaria</span> <span>${formatNumber(bd.cavalry_t4 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Arqueiros</span> <span>${formatNumber(bd.archer_t4 || 0)}</span>
                </div>
                <div class="troop-row" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:#ddd;">
                    <span>Cerco</span> <span>${formatNumber(bd.siege_t4 || 0)}</span>
                </div>
                <div class="troop-total" style="text-align:right; color:#FFD700; font-weight:bold; font-size:1em; margin-top:5px;">
                   Total T4: ${formatNumber(stats.totalT4)}
                </div>
            </div>
        </div>
        `;
  });

  // Inject into both lists
  if (document.querySelector('.mobile-list')) document.querySelector('.mobile-list').innerHTML = kingdomsHTML;
  if (document.querySelector('.desktop-list')) document.querySelector('.desktop-list').innerHTML = kingdomsHTML;


  // 4. RANKING LIST (HTML String)
  let rankingHTML = '';
  ranking.forEach((r, idx) => {
    let medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    rankingHTML += `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">
                <span>${medal} ${r.reino}</span>
                <span style="color:#FFD700">${formatCompactNumber(r.totalPontos)}</span>
            </div>
        `;
  });

  // Inject into all ranking containers
  document.querySelectorAll('.data-ranking-list').forEach(el => el.innerHTML = rankingHTML);
}
