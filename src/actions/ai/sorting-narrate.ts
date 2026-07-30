// src/actions/ai/sorting-narrate.ts
// Fala com a Cloud Function "sortingNarrate" (functions/src/index.ts) —
// mesmo protocolo HTTP + streaming de `narrate.ts` (ver comentários lá),
// mas pra história do teste de seleção de casa do wizard de criação de
// personagem (pages/character-wizard/components/sorting-story). Usa a
// GEMINI_KEY do próprio projeto (functions/.env) em vez do token que o
// usuário configura em Configurações — nesse ponto do fluxo o usuário
// ainda nem tem personagem.

import { auth } from "@/services/firebase_settings";
import type { NarrateMessage } from "./narrate";

export interface SortingNarrateParams {
  systemPrompt: string;
  messages: NarrateMessage[];
}

const SORTING_NARRATE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:5001/potterpg/us-central1/sortingNarrate"
  : "https://us-central1-potterpg.cloudfunctions.net/sortingNarrate";

export async function sortingNarrate(params: SortingNarrateParams, onDelta: (chunk: string) => void): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Faça login pra usar o teste de seleção.");

  const idToken = await user.getIdToken();

  const response = await fetch(SORTING_NARRATE_URL, {
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
