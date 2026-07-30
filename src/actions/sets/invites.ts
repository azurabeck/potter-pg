// src/actions/sets/invites.ts
// Escrita da colecao "invites" — criar convite (SettingsModal, "Players
// da sessão") e responder aceitar/rejeitar (aviso global do app).

import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import { ensureTableExists } from "@/actions/sets/table";
import type { TableInviteStatus } from "@/utils/types";

/** Devolve o id do convite criado — HistoryPanel usa pra acompanhar o status depois (ver settings-modal). */
export async function createInvite(
  hostUserId: string,
  hostCharacterId: string,
  hostName: string,
  toEmail: string
): Promise<string> {
  // Primeiro convite do anfitrião: garante que a mesa (colecao "tables",
  // Taça das Casas) já existe, em vez de só nascer quando alguém
  // encerrar a primeira sessão (ver ensureTableExists).
  await ensureTableExists(hostUserId);

  const invitesRef = collection(db, COLLECTIONS.INVITES);
  const docRef = await addDoc(invitesRef, {
    hostUserId,
    hostCharacterId,
    hostName,
    toEmail: toEmail.trim().toLowerCase(),
    status: "pending" satisfies TableInviteStatus,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function respondToInvite(inviteId: string, status: "accepted" | "rejected"): Promise<void> {
  const inviteRef = doc(db, COLLECTIONS.INVITES, inviteId);
  await updateDoc(inviteRef, { status });
}

/**
 * Registra qual personagem o convidado está usando nesta mesa — chamado
 * pela Plataforma assim que ela detecta um `guestSeat` sem
 * `guestCharacterId` ainda (ver `pages/plataforma/index.tsx`). Fica
 * separado de `respondToInvite` porque aceitar o convite (no aviso
 * global) pode acontecer antes do convidado terminar o wizard de
 * criação — nesse momento ele ainda não tem personagem pra registrar.
 */
export async function recordGuestCharacter(
  inviteId: string,
  guestUserId: string,
  guestCharacterId: string,
  guestCharacterName: string
): Promise<void> {
  const inviteRef = doc(db, COLLECTIONS.INVITES, inviteId);
  await updateDoc(inviteRef, { guestUserId, guestCharacterId, guestCharacterName });
}
