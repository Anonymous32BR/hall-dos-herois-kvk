/**
 * Pesos de pontuação para o KvK (Lost Kingdom).
 * Valores baseados nas regras padrão do jogo.
 */
export const kvkPoints = {
    infantry_t5: 20,
    cavalry_t5: 20,
    archer_t5: 20,
    siege_t5: 20,

    infantry_t4: 8,
    cavalry_t4: 8,
    archer_t4: 8,
    siege_t4: 8
};

/**
 * Calcula os pontos totais e parciais baseado nas mortes.
 * @param {Object} data - Objeto mapeado com as quantidades de mortes por tipo.
 * @returns {Object} Objeto contendo o total geral e detalhamento se necessário.
 */
export function calculateKvK(data) {
    let totalPoints = 0;
    const details = {};

    // Ordenar chaves apenas para garantir consistência se necessário, 
    // mas Object.keys geralmente segue ordem de inserção em JS modernos.
    const keys = Object.keys(kvkPoints);

    for (const key of keys) {
        const kills = data[key] || 0;
        const points = kills * kvkPoints[key];

        details[key] = {
            kills: kills,
            factor: kvkPoints[key],
            points: points
        };

        totalPoints += points;
    }

    return {
        total: totalPoints,
        details: details
    };
}

/**
 * Formata um número para o padrão brasileiro (ex: 1.234.567).
 * @param {number} value 
 * @returns {string}
 */
export function formatNumber(value) {
    if (!value) return "0";

    // Formato Inteiro Brasileiro (ex: 1.234.567)
    const full = new Intl.NumberFormat('pt-BR').format(value);

    // Se for menor que 1000, não precisa de abreviação
    if (value < 1000) return full;

    let abbr = "";

    // Bilhões
    if (value >= 1_000_000_000) {
        abbr = (value / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + " B";
    }
    // Milhões
    else if (value >= 1_000_000) {
        abbr = (value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + " M";
    }
    // Milhares
    else {
        abbr = (value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + " K";
    }

    // Retorna formato híbrido: "1.2 M (1.200.000)"
    return `${abbr} (${full})`;
}
