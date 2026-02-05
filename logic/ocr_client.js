/**
 * Cliente para integração com a API da OpenAI.
 */

// Prompt "Definitivo" encapsulado no código para segurança e consistência
const SYSTEM_PROMPT = `
Leia a imagem fornecida.

A imagem contém exatamente 8 números organizados em 3 linhas:
- Linha 1: 3 números
- Linha 2: 3 números
- Linha 3: 2 números

Regras obrigatórias:
1. Leia APENAS números inteiros.
2. Ignore qualquer texto, ícones ou imagens.
3. Leia da esquerda para a direita, linha por linha.
4. Não invente números.
5. Se algum número não puder ser identificado, retorne ERRO.

Formato de saída obrigatório (JSON puro):
{
  "values": [
    n1, n2, n3,
    n4, n5, n6,
    n7, n8
  ]
}
👉 Não peça especialidade, não peça tier, só números. Não inclua markdown (nada de \`\`\`json).
`;

/**
 * Envia uma imagem para a API da OpenAI (GPT-4o) para extração de dados.
 * @param {File} imageFile - O arquivo de imagem selecionado pelo usuário.
 * @param {string} apiKey - A chave de API da OpenAI.
 * @returns {Promise<Object>} Promessa com o JSON de resposta (com 'values').
 */
export async function analyzeImage(imageFile, apiKey) {
    if (!apiKey) {
        throw new Error("Chave da API não fornecida.");
    }

    // Converter imagem para Base64
    const base64Image = await toBase64(imageFile);

    const payload = {
        model: "gpt-4o", // Modelo Vision atualizado
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image
                        }
                    }
                ]
            }
        ],
        temperature: 0.0, // Reduz alucinação
        max_tokens: 300,
        response_format: { type: "json_object" } // Força JSON
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API OpenAI: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse do conteúdo
        try {
            return JSON.parse(content);
        } catch (e) {
            throw new Error("Falha ao ler resposta da IA (JSON inválido).");
        }

    } catch (error) {
        console.error("Erro no OCR:", error);
        throw error;
    }
}

/**
 * Helper para converter File em string Base64 Data URL.
 */
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
