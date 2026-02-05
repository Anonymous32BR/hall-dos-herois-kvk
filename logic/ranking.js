/**
 * Calcula a pontuação total de cada reino baseado nos pesos configurados
 * e retorna a lista ordenada pelo total de pontos (Decrescente).
 * 
 * @param {Array} kingdoms - Lista de objetos de reino.
 * @param {Object} config - { t5: number, t4: number }
 * @returns {Array} Lista ordenada de reinos com 'totalPoints' preenchido.
 */
export function calculateRanking(kingdoms, config) {
    // Clona para não mutar o input original perigosamente
    const processed = kingdoms.map(k => {
        // Garante que existe o objeto de leitura
        if (!k.leitura) return { ...k, totalPoints: 0 };

        const t5Kills = (k.leitura.infantry_t5 || 0) +
            (k.leitura.cavalry_t5 || 0) +
            (k.leitura.archer_t5 || 0) +
            (k.leitura.siege_t5 || 0);

        const t4Kills = (k.leitura.infantry_t4 || 0) +
            (k.leitura.cavalry_t4 || 0) +
            (k.leitura.archer_t4 || 0) +
            (k.leitura.siege_t4 || 0);

        const points = (t5Kills * config.t5) + (t4Kills * config.t4);

        return {
            ...k,
            stats: { t5Kills, t4Kills }, // Útil para detalhes futuros
            totalPoints: points
        };
    });

    // Ordena Maior -> Menor
    return processed.sort((a, b) => b.totalPoints - a.totalPoints);
}
