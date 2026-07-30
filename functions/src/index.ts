// functions/src/index.ts
// Proxy server-side pra chamada de IA de narracao. O token do usuario
// (colecao "settings", ver src/actions/get|sets/settings.ts no app)
// nunca sai daqui: o client manda so o prompt de sistema + historico de
// mensagens, autenticado via Bearer do ID token do Firebase Auth; esta
// function le o token do Firestore com o Admin SDK (que ignora as regras
// de seguranca do client) e chama o provedor escolhido, repassando o
// texto de resposta em streaming conforme ele vai sendo gerado.
//
// E um endpoint HTTP puro (onRequest), nao httpsCallable: o SDK client do
// Firebase instalado no app (firebase 10.x) ainda nao suporta streaming
// callable, entao a autenticacao e feita manualmente via header
// Authorization e a resposta e escrita aos pedacos em `res` em vez de
// devolvida de uma vez so.

import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { generateImage, streamProvider, type AiProvider, type NarrateMessage } from "./providers.js";

const VALID_PROVIDERS: AiProvider[] = ["anthropic", "openai", "gemini", "grok"];

initializeApp();
const db = getFirestore();

interface NarrateRequest {
  systemPrompt: string;
  messages: NarrateMessage[];
}

export const narrate = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader = req.get("Authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!idToken) {
    res.status(401).json({ error: "Faça login pra usar a narração por IA." });
    return;
  }

  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(idToken)).uid;
  } catch {
    res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    return;
  }

  const { systemPrompt, messages } = req.body as Partial<NarrateRequest>;
  if (typeof systemPrompt !== "string" || !Array.isArray(messages)) {
    res.status(400).json({ error: "systemPrompt e messages são obrigatórios." });
    return;
  }

  let aiProvider: { provider?: string; apiKey?: string } | undefined;
  try {
    const settingsDoc = await db.collection("settings").doc(uid).get();
    aiProvider = settingsDoc.data()?.aiProvider;
  } catch (error) {
    // Erro mais comum aqui: rodando no emulador local sem `firebase login`
    // feito antes — o Admin SDK não tem credencial pra ler o Firestore de
    // produção. `npx firebase-tools login` (dentro de functions/) resolve.
    res.status(500).json({
      error: `Não consegui ler as configurações no Firestore: ${error instanceof Error ? error.message : error}`,
    });
    return;
  }

  if (!aiProvider?.apiKey || !VALID_PROVIDERS.includes(aiProvider.provider as AiProvider)) {
    res.status(412).json({
      error: "Nenhum token de IA configurado. Abra Configurações e cole o token do provedor escolhido.",
    });
    return;
  }

  // Setado antes do streaming comecar, mas so vai realmente pro cliente
  // no primeiro `res.write` — se o fetch pro provedor falhar antes disso,
  // ainda da pra responder com JSON de erro no catch abaixo.
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");

  try {
    await streamProvider(aiProvider.provider as AiProvider, aiProvider.apiKey, systemPrompt, messages, (chunk) => {
      res.write(chunk);
    });
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao chamar a IA.";
    if (res.headersSent) {
      res.write(`\n[ERRO: ${message}]`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// Mesmo protocolo de `narrate` (HTTP + streaming, auth via Bearer), mas
// pra uma chamada de IA que não é da narração da sessão: a história do
// teste de seleção de casa do wizard de criação de personagem
// (pages/character-wizard). Diferença central: não lê token do Firestore
// por usuário — usa a chave própria do projeto (GEMINI_KEY, carregada de
// functions/.env pelo Functions Framework) porque é uma experiência do
// app, não algo que dependa do usuário já ter configurado um provedor de
// IA em Configurações (aliás, no momento em que o wizard roda, o usuário
// nem tem personagem ainda).
export const sortingNarrate = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader = req.get("Authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!idToken) {
    res.status(401).json({ error: "Faça login pra usar o teste de seleção." });
    return;
  }

  try {
    await getAuth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    return;
  }

  const { systemPrompt, messages } = req.body as Partial<NarrateRequest>;
  if (typeof systemPrompt !== "string" || !Array.isArray(messages)) {
    res.status(400).json({ error: "systemPrompt e messages são obrigatórios." });
    return;
  }

  const geminiKey = process.env.GEMINI_KEY;
  if (!geminiKey) {
    res.status(500).json({ error: "GEMINI_KEY não configurada nas variáveis de ambiente da function." });
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");

  try {
    await streamProvider("gemini", geminiKey, systemPrompt, messages, (chunk) => {
      res.write(chunk);
    });
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao chamar a IA.";
    if (res.headersSent) {
      res.write(`\n[ERRO: ${message}]`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
});

interface GenerateImageRequest {
  prompt: string;
}

// Gera o retrato do personagem (step 1 do wizard de criação — botão
// "Gerar imagem do personagem"). Sem streaming (imagem não chega aos
// pedaços como texto) — devolve `{ imageDataUrl }` de uma vez só, já
// pronta pra usar num <img src>. Mesma GEMINI_KEY de `sortingNarrate`, e
// pelo mesmo motivo (usuário ainda não tem personagem nesse ponto).
export const generateCharacterImage = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader = req.get("Authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!idToken) {
    res.status(401).json({ error: "Faça login pra gerar a imagem do personagem." });
    return;
  }

  try {
    await getAuth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    return;
  }

  const { prompt } = req.body as Partial<GenerateImageRequest>;
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "prompt é obrigatório." });
    return;
  }

  const geminiKey = process.env.GEMINI_KEY;
  if (!geminiKey) {
    res.status(500).json({ error: "GEMINI_KEY não configurada nas variáveis de ambiente da function." });
    return;
  }

  try {
    const imageDataUrl = await generateImage(geminiKey, prompt);
    res.json({ imageDataUrl });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Erro ao gerar a imagem." });
  }
});
