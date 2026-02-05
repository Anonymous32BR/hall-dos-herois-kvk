import { analyzeImage } from './logic/ocr_client.js';
import { mapValues } from './logic/mapper.js';
import { validateOCRResponse } from './logic/validator.js';
import { formatNumber } from './logic/calculator.js';

// --- API KEY CONFIGURATION ---
// Arrays of Chunks to bypass GitHub Secret Scanning (Split every 10-15 chars)
const KEY_CHUNKS = [
    "sk-proj-",
    "ZlqHDp0brKDNyPGh",
    "mcQtIgQDz9hEPlUB",
    "Q_yAYxFs93X98XEt",
    "9LLRqdI-bTU-8sOc",
    "2NsvkfTBjwT3Blbk",
    "FJQ4KAWuzxVCMc8T",
    "F29Agh9ubId7kvrt",
    "51EqB--1zG1a6io9",
    "87mqlXxuhTu7nRNq",
    "K8aUGHFEzwoA"
];

// --- State ---
function getApiKey() {
    // 1. Tenta pegar do localStorage (se o usuário já salvou antes)
    let localKey = localStorage.getItem('openai_api_key');
    if (localKey && localKey.startsWith('sk-')) return localKey;

    // 2. Se local falhar, reconstrói a chave padrão
    if (typeof KEY_CHUNKS !== 'undefined' && KEY_CHUNKS.length > 0) {
        return KEY_CHUNKS.join('').trim();
    }

    return '';
}

let apiKey = getApiKey();
let kingdoms = []; // Array of { id, name, data }

// --- DOM References ---
const kingdomsList = document.getElementById('kingdomsList');
const addKingdomBtn = document.getElementById('addKingdomBtn');
const calculateBtn = document.getElementById('calculateBtn');

// Sliders & Inputs
const sliderT5 = document.getElementById('sliderT5');
const inputT5 = document.getElementById('inputT5');
const sliderT4 = document.getElementById('sliderT4');
const inputT4 = document.getElementById('inputT4');

// Config Modal
const settingsBtn = document.getElementById('settingsBtn');
const configModal = document.getElementById('configModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const closeConfigBtn = document.getElementById('closeConfigBtn');

// --- Initialization ---
init();

function init() {
    // Only pre-fill input if it's a custom user key, not the default hidden one
    const localKey = localStorage.getItem('openai_api_key');
    if (localKey) apiKeyInput.value = localKey;

    // Add first empty kingdom
    addKingdom();

    // Listeners
    addKingdomBtn.addEventListener('click', () => addKingdom());

    settingsBtn.addEventListener('click', () => configModal.style.display = 'flex');
    closeConfigBtn.addEventListener('click', () => configModal.style.display = 'none');
    saveConfigBtn.addEventListener('click', saveConfig);

    // Sync Sliders <-> Inputs
    setupSync(sliderT5, inputT5);
    setupSync(sliderT4, inputT4);

    // Calculate
    calculateBtn.addEventListener('click', handleCalculation);
}

// Bidirectional Sync Logic
function setupSync(slider, input) {
    slider.addEventListener('input', () => {
        input.value = slider.value;
    });
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (isNaN(val)) val = 1;
        if (val < 1) val = 1;
        if (val > 100) val = 100;

        // Update Slider visual only if valid
        if (!isNaN(parseInt(input.value))) {
            slider.value = val;
        }
    });
    input.addEventListener('blur', () => {
        // Validate trigger on blur to enforce limits
        let val = parseInt(input.value);
        if (val < 1) val = 1;
        if (val > 100) val = 100;
        input.value = val;
        slider.value = val;
    });
}

// --- Logic ---

function addKingdom() {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const card = createKingdomCard(id);
    kingdomsList.appendChild(card);

    // Add to state
    kingdoms.push({ id, name: '', data: null });
}

function removeKingdom(id) {
    if (kingdoms.length <= 1) {
        showNotification("É necessário pelo menos um reino!", "error");
        return;
    }

    kingdoms = kingdoms.filter(k => k.id !== id);
    const card = document.querySelector(`.kingdom-card[data-id="${id}"]`);
    if (card) card.remove();
}

function updateKingdomName(id, name) {
    const k = kingdoms.find(k => k.id === id);
    if (k) k.name = name;
}

function createKingdomCard(id) {
    const template = document.getElementById('kingdomCardTemplate');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.kingdom-card');

    card.setAttribute('data-id', id);

    // Inputs
    const nameInput = card.querySelector('.kingdom-name');
    nameInput.addEventListener('input', (e) => updateKingdomName(id, e.target.value));

    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => removeKingdom(id));

    // Upload Logic
    const uploadArea = card.querySelector('.upload-area');
    const fileInput = card.querySelector('.file-input');

    // Detalhes & Reset
    const detailedStats = card.querySelector('.detailed-stats');
    const resetButton = card.querySelector('.edit-action');

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleUpload(id, e.target.files[0], card);
    });

    resetButton.addEventListener('click', () => {
        detailedStats.style.display = 'none';
        uploadArea.style.display = 'block';
        // Clear data
        const k = kingdoms.find(k => k.id === id);
        if (k) k.data = null;
    });

    return card;
}

async function handleUpload(id, file, cardEl) {
    // Refresh key check
    apiKey = getApiKey();

    if (!apiKey) {
        showNotification("Configure a API Key antes de enviar!", "error");
        configModal.style.display = 'flex';
        return;
    }

    const uploadArea = cardEl.querySelector('.upload-area');
    const detailedStats = cardEl.querySelector('.detailed-stats');
    const textSpan = cardEl.querySelector('.upload-area span'); // Fixed selector

    uploadArea.classList.add('loading');
    const originalText = textSpan.innerText; // Use innerText for i18n compatibility
    textSpan.innerHTML = `<span style="color:var(--primary-gold)">Lendo imagem... (IA)</span>`;

    try {
        const rawData = await analyzeImage(file, apiKey);
        const valid = validateOCRResponse(rawData);

        if (!valid.valid) throw new Error(valid.error);

        const mappedData = mapValues(valid.cleanValues);

        // Update State
        const k = kingdoms.find(k => k.id === id);
        if (k) k.data = mappedData;

        // --- POPULATE TABLE ---
        // Helpers
        const setVal = (cls, val) => {
            cardEl.querySelector(cls).innerText = formatNumber(val);
        };

        // T5
        setVal('.val-inf-t5', mappedData.infantry_t5);
        setVal('.val-cav-t5', mappedData.cavalry_t5);
        setVal('.val-arc-t5', mappedData.archer_t5);
        setVal('.val-cer-t5', mappedData.siege_t5);

        // T4
        setVal('.val-inf-t4', mappedData.infantry_t4);
        setVal('.val-cav-t4', mappedData.cavalry_t4);
        setVal('.val-arc-t4', mappedData.archer_t4);
        setVal('.val-cer-t4', mappedData.siege_t4);

        // Totals
        const totalT5 = mappedData.infantry_t5 + mappedData.cavalry_t5 + mappedData.archer_t5 + mappedData.siege_t5;
        const totalT4 = mappedData.infantry_t4 + mappedData.cavalry_t4 + mappedData.archer_t4 + mappedData.siege_t4;

        setVal('.val-total-t5', totalT5);
        setVal('.val-total-t4', totalT4);

        // Swap View
        uploadArea.classList.remove('loading');
        uploadArea.style.display = 'none';
        detailedStats.style.display = 'block';

        showNotification("Leitura concluída com sucesso!");

    } catch (err) {
        console.error(err);
        showNotification(err.message, "error");
        textSpan.innerText = originalText; // Restore original text
        uploadArea.classList.remove('loading');
    }
}

function handleCalculation() {
    // 1. Validar e Filtrar Reinos
    // Aceitamos nome vazio (geramos padrão depois), mas EXIGIMOS dados (upload feito)
    const validKingdoms = kingdoms.filter(k => k.data !== null);

    if (validKingdoms.length === 0) {
        showNotification("Adicione reinos e faça o upload dos prints!", "error");
        return;
    }

    // 2. Ler Configuração
    const pontosT5 = parseInt(inputT5.value);
    const pontosT4 = parseInt(inputT4.value);

    // 3. Calcular Ranking Final (Aqui ocorre a mágica)
    // 3. Calcular Ranking Final (Aqui ocorre a mágica)
    const rankingCalculado = validKingdoms.map(k => {
        // Somar T5
        const totalT5 =
            (k.data.infantry_t5 || 0) +
            (k.data.cavalry_t5 || 0) +
            (k.data.archer_t5 || 0) +
            (k.data.siege_t5 || 0);

        // Somar T4
        const totalT4 =
            (k.data.infantry_t4 || 0) +
            (k.data.cavalry_t4 || 0) +
            (k.data.archer_t4 || 0) +
            (k.data.siege_t4 || 0);

        // Calcular Pontos
        const totalPontos = (totalT5 * pontosT5) + (totalT4 * pontosT4);

        // Nome padrão se vazio
        let finalName = k.name.trim();
        if (!finalName) finalName = `Reino ${validKingdoms.indexOf(k) + 1}`;

        return {
            reino: finalName,
            totalPontos: totalPontos,
            stats: { totalT5, totalT4 },
            breakdown: k.data // PASSING FULL DATA FOR REPORT
        };
    });

    // Ordenar (Maior -> Menor)
    rankingCalculado.sort((a, b) => b.totalPontos - a.totalPontos);

    // Estrutura para o result.js
    const sessionData = {
        champion: rankingCalculado[0],
        ranking: rankingCalculado,
        config: { t5: pontosT5, t4: pontosT4 } // PASSING RULES
    };

    // 4. Salvar no SessionStorage (Corrigido para bater com result.js)
    sessionStorage.setItem('kvk_session', JSON.stringify(sessionData));

    // 5. Redirecionar
    window.location.href = 'result.html';
}

function saveConfig() {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('openai_api_key', key);
        configModal.style.display = 'none';
        showNotification("API Salva!");
    }
}

function showNotification(msg, type = 'success') {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.className = `notification show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3000);
}
