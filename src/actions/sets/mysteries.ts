// src/actions/sets/mysteries.ts
// Escrita da colecao "mysteries" — ate agora so existia leitura
// (actions/get/mysteries.ts, pages/misterios). Primeiro uso: aplicar
// uma sugestao de mistério que a IA gerou no registro de sessão, DEPOIS
// que o usuário aprova (ver EndSessionModal) — a IA nunca escreve aqui
// sozinha, só sugere (regra explícita do livro "Registros Mágicos").

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Character } from "@/utils/types";
import type { MysterySuggestionEntry } from "@/pages/plataforma/functions";

// Classificações do protocolo que indicam mistério encerrado — o resto
// (pista, suspeita, teoria, informação confirmada etc.) mantém o
// mistério "em andamento", só atualizando `details`.
const RESOLVED_CLASSIFICATIONS = ["resolucao_completa", "resolução_completa"];

export async function applyMysterySuggestion(character: Character, suggestion: MysterySuggestionEntry): Promise<void> {
  if (suggestion.suggested_action === "create") {
    await addDoc(collection(db, COLLECTIONS.MYSTERIES), {
      user_id: character.user_id,
      character_id: character.id,
      category: "mistérios",
      name: suggestion.mystery_name || "Mistério sem nome",
      year: character.ano,
      status: "em andamento",
      clues: [],
      details: suggestion.suggested_update || "",
      last_appearance: "",
      next_session: false,
      awaited_event: "",
      current_situation: "",
      responder: "",
    });
    return;
  }

  if (!suggestion.mystery_id) return;

  const isResolved = RESOLVED_CLASSIFICATIONS.includes(suggestion.classification.toLowerCase());
  await updateDoc(doc(db, COLLECTIONS.MYSTERIES, suggestion.mystery_id), {
    details: suggestion.suggested_update || "",
    ...(isResolved ? { status: "resolvido" } : {}),
  });
}
