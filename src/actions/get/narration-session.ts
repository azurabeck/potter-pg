// src/actions/get/narration-session.ts
// Leitura da colecao "narration_sessions" — guarda o estado da sessao de
// narracao em andamento de um personagem (as falas do feed). Um
// documento por personagem (id do documento == character id), nao por
// usuario nem por navegador — assim funciona de qualquer aparelho em
// que o dono logar. Cada personagem narra na propria sessao por padrao,
// mesmo estando "na mesa" de outro (ver TableInvite) — so passa a
// compartilhar sessao com outro personagem depois de um Encounter
// aceito, usando `sharedCharacterId` no lugar do proprio characterId
// (ver doc do `plataforma`, secao "Encontros").

import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { NarrationMessage } from "@/utils/types";

/**
 * Escuta em tempo real o feed de narração de um personagem (ou de uma
 * sessão compartilhada, se `characterId` for o `sharedCharacterId` de um
 * `Encounter` aceito) — qualquer participante que salvar uma resposta
 * nova (`saveNarrationSession`) atualiza o feed de todo mundo que
 * estiver escutando o mesmo id, sem reload. Só a resposta *pronta* é
 * sincronizada — o streaming chunk a chunk continua visível só pra quem
 * disparou a chamada (ver ressalva na doc do `plataforma`).
 */
export function subscribeToNarrationSession(
  characterId: string,
  onChange: (messages: NarrationMessage[]) => void
): () => void {
  const sessionRef = doc(db, COLLECTIONS.NARRATION_SESSIONS, characterId);

  return onSnapshot(
    sessionRef,
    (snapshot) => {
      const messages = snapshot.data()?.messages;
      onChange(Array.isArray(messages) ? messages : []);
    },
    (error) => console.error("Erro ao escutar a sessão de narração:", error)
  );
}

/**
 * Busca única (sem escutar) do feed de um personagem — usada só na hora
 * de montar um encontro: pra narrar a cena de convergência, a IA precisa
 * saber o que estava acontecendo na sessão do *outro* personagem naquele
 * momento (ver `mergeEncounter` em `pages/plataforma/index.tsx`).
 */
export async function getNarrationSessionOnce(characterId: string): Promise<NarrationMessage[]> {
  const sessionRef = doc(db, COLLECTIONS.NARRATION_SESSIONS, characterId);
  const snapshot = await getDoc(sessionRef);
  if (!snapshot.exists()) return [];
  const messages = snapshot.data().messages;
  return Array.isArray(messages) ? messages : [];
}
