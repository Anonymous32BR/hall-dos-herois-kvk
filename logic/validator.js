/**
 * Valida se a resposta do OCR está no formato corretíssimo.
 * Regras:
 * 1. Deve ser um array.
 * 2. Deve ter exatamente 8 elementos.
 * 3. Todos elementos devem ser números inteiros não-negativos.
 * 
 * @param {any} rawData - Dados crus vindos do JSON do OCR.
 * @returns {Object} { valid: boolean, error?: string, cleanValues?: number[] }
 */
export function validateOCRResponse(rawData) {
    // Verifica se existe o objeto 'values' (conforme prompt solicitado)
    // O prompt pede retorno: { "values": [...] }

    if (!rawData || !Array.isArray(rawData.values)) {
        return {
            valid: false,
            error: "Formato de resposta inválido. JSON não contém lista 'values'."
        };
    }

    const values = rawData.values;

    if (values.length !== 8) {
        return {
            valid: false,
            error: `Quantidade de números incorreta. Esperado: 8, Recebido: ${values.length}.`
        };
    }

    for (let i = 0; i < values.length; i++) {
        const num = values[i];

        if (typeof num !== 'number' || isNaN(num)) {
            return {
                valid: false,
                error: `Valor da posição ${i + 1} não é um número válido.`
            };
        }

        if (num < 0) {
            return {
                valid: false,
                error: `Valor da posição ${i + 1} é negativo.`
            };
        }
    }

    return { valid: true, cleanValues: values };
}
