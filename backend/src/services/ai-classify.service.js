const axios = require('axios');

const { loadEnv } = require('../config/env');
const logger = require('../utils/logger');

// Proxy de classificação por IA (plano 06). O app envia a descrição do problema do cliente
// ("minha pia está vazando") + a lista de nichos do catálogo; a IA escolhe UM nicho da lista.
//
// A chave da Groq vive SÓ aqui no backend (env GROQ_API_KEY no Render) — nunca no APK.
// Mesmo padrão do proxy /api/route (OSRM): o app fala só com o nosso backend.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// O id do modelo da Groq muda de tempos em tempos — configurável por env, com default atual.
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function buildSystemPrompt(niches) {
  const list = niches.map((n) => `- ${n}`).join('\n');
  return [
    'Você é o assistente da AquiResolve, um marketplace de serviços domésticos e profissionais.',
    'Dada a descrição do problema do cliente, escolha EXATAMENTE UM nicho da lista abaixo que melhor resolve o caso.',
    '',
    'NICHOS DISPONÍVEIS (escolha só destes; não invente):',
    list,
    '',
    'Responda SOMENTE com um JSON válido, sem texto fora dele, no formato:',
    '{"niche": <um nicho EXATAMENTE como na lista, ou null>, "confidence": <número de 0 a 1>, "message": <frase curta e amigável em português do Brasil>}',
    '',
    'Regras:',
    '- Se nada na lista se encaixar, use "niche": null e explique gentilmente na "message".',
    '- "message" deve ser curta, calorosa e em pt-BR (ex.: "Parece um problema hidráulico. Posso te levar para Encanador?").',
    '- Nunca escolha um nicho que não esteja na lista.'
  ].join('\n');
}

/**
 * Classifica a descrição do cliente em um dos nichos fornecidos.
 * Nunca lança para o chamador de forma não tratada: erros viram { error }.
 *
 * @returns {Promise<{ niche: string|null, confidence: number, message: string }>}
 */
async function classifyNiche({ description, niches }) {
  const config = loadEnv();
  const apiKey = config.groqApiKey;

  if (!apiKey) {
    const err = new Error('GROQ_API_KEY ausente no servidor');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const model = config.groqModel || DEFAULT_MODEL;

  const { data } = await axios.post(
    GROQ_URL,
    {
      model,
      temperature: 0,
      max_tokens: 250,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(niches) },
        { role: 'user', content: String(description).slice(0, 1000) }
      ]
    },
    {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  const raw = data?.choices?.[0]?.message?.content?.trim() || '';

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    logger.warn('IA devolveu JSON inválido', { raw: raw.slice(0, 200) });
    return { niche: null, confidence: 0, message: 'Não consegui identificar agora. Quer ver todos os serviços?' };
  }

  // Validação anti-alucinação: o nicho retornado precisa existir EXATAMENTE na lista enviada.
  const match = niches.find((n) => n.toLowerCase() === String(parsed?.niche ?? '').trim().toLowerCase());
  const niche = match || null;

  let confidence = Number(parsed?.confidence);
  if (!Number.isFinite(confidence)) confidence = niche ? 0.5 : 0;
  confidence = Math.max(0, Math.min(1, confidence));
  if (!niche) confidence = 0;

  const message =
    typeof parsed?.message === 'string' && parsed.message.trim()
      ? parsed.message.trim()
      : niche
        ? `Acho que é um caso de ${niche}. Posso te direcionar?`
        : 'Não consegui identificar o serviço. Quer ver todos os serviços?';

  return { niche, confidence, message };
}

module.exports = {
  classifyNiche
};
