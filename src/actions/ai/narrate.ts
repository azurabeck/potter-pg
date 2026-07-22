// src/actions/ai/narrate.ts
// Fala com a Cloud Function "narrate" (functions/src/index.ts) via HTTP
// puro (nao httpsCallable) pra poder ler a resposta em streaming — o SDK
// client do Firebase instalado aqui (firebase 10.x) ainda nao suporta
// streaming callable, entao a function expoe um endpoint HTTP normal que
// devolve o texto da IA aos pedacos conforme o provedor vai gerando, e a
// gente le com fetch + ReadableStream. Autenticacao manual via Bearer do
// ID token do Firebase Auth, ja que sem httpsCallable ele nao e anexado
// sozinho.

import { auth } from "@/services/firebase_settings";

export interface NarrateMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NarrateParams {
  systemPrompt: string;
  messages: NarrateMessage[];
}

const NARRATE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:5001/potterpg/us-central1/narrate"
  : "https://us-central1-potterpg.cloudfunctions.net/narrate";

export async function narrate(params: NarrateParams, onDelta: (chunk: string) => void): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Faça login pra usar a narração por IA.");

  const idToken = await user.getIdToken();

  const response = await fetch(NARRATE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Erro ${response.status} ao chamar a IA.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onDelta(chunk);
  }
}
