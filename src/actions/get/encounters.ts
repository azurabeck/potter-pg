// src/actions/get/encounters.ts
// Leitura da colecao "encounters" — pedidos de um personagem pra
// encontrar outro numa mesa (ver actions/sets/encounters.ts pra criar/
// responder, e utils/types.ts pro formato de Encounter).

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Encounter } from "@/utils/types";

/** Escuta em tempo real pedidos de encontro pendentes endereçados a este usuário. */
export function subscribeToPendingEncounters(userId: string, onChange: (encounters: Encounter[]) => void): () => void {
  const encountersRef = collection(db, COLLECTIONS.ENCOUNTERS);
  const q = query(encountersRef, where("toUserId", "==", userId), where("status", "==", "pending"));

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Encounter)),
    (error) => console.error("Erro ao escutar pedidos de encontro:", error)
  );
}

/**
 * Escuta se este personagem tem um encontro **aceito** em andamento (de
 * qualquer um dos dois lados — quem pediu ou quem aceitou). Duas
 * consultas separadas em vez de uma só com `or()`, pra não depender de
 * combinações de filtro mais exóticas do Firestore. `onChange(null)`
 * quando não há nenhum — é o sinal pra `pages/plataforma/index.tsx`
 * voltar a narrar na própria sessão em vez da compartilhada.
 */
export function subscribeToMyEncounter(characterId: string, onChange: (encounter: Encounter | null) => void): () => void {
  const encountersRef = collection(db, COLLECTIONS.ENCOUNTERS);
  let fromResult: Encounter | null = null;
  let toResult: Encounter | null = null;

  function emit() {
    onChange(fromResult ?? toResult ?? null);
  }

  const unsubFrom = onSnapshot(
    query(encountersRef, where("fromCharacterId", "==", characterId), where("status", "==", "accepted")),
    (snapshot) => {
      fromResult = snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Encounter);
      emit();
    },
    (error) => console.error("Erro ao escutar encontro (lado de quem pediu):", error)
  );

  const unsubTo = onSnapshot(
    query(encountersRef, where("toCharacterId", "==", characterId), where("status", "==", "accepted")),
    (snapshot) => {
      toResult = snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Encounter);
      emit();
    },
    (error) => console.error("Erro ao escutar encontro (lado de quem aceitou):", error)
  );

  return () => {
    unsubFrom();
    unsubTo();
  };
}
