/**
 * Mapeamento das posições retornadas pelo OCR para chaves semânticas.
 * O OCR deve retornar um array de 8 números na ordem:
 * [Inf T5, Cav T5, Arc T5, Siege T5, Inf T4, Cav T4, Arc T4, Siege T4]
 */
export const positionMap = {
  infantry_t5: 0,
  cavalry_t5: 1,
  archer_t5: 2,
  siege_t5: 3,
  infantry_t4: 4,
  cavalry_t4: 5,
  archer_t4: 6,
  siege_t4: 7
};

/**
 * Transforma o array de valores brutos do OCR em um objeto estruturado.
 * @param {number[]} values - Array de 8 números inteiros.
 * @returns {Object} Objeto com as chaves de tipos de tropa.
 * @throws {Error} Se o input não for um array válido de 8 itens.
 */
export function mapValues(values) {
  if (!Array.isArray(values) || values.length !== 8) {
    throw new Error("Leitura OCR inválida: Esperado array de 8 números.");
  }

  return {
    infantry_t5: values[positionMap.infantry_t5],
    cavalry_t5: values[positionMap.cavalry_t5],
    archer_t5: values[positionMap.archer_t5],
    siege_t5: values[positionMap.siege_t5],
    infantry_t4: values[positionMap.infantry_t4],
    cavalry_t4: values[positionMap.cavalry_t4],
    archer_t4: values[positionMap.archer_t4],
    siege_t4: values[positionMap.siege_t4]
  };
}
