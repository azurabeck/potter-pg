// src/actions/sets/presence.ts
// Escrita da colecao "presence" — um documento por usuario, com um
// heartbeat ("estou com o app aberto agora") que `context/character`
// dispara periodicamente enquanto o usuario estiver logado. Ver
// actions/get/presence.ts pra como isso vira "online"/"offline" pra
// quem le.

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";

// Precisa ser menor que PRESENCE_ONLINE_THRESHOLD_MS (actions/get/presence.ts)
// com folga suficiente pra tolerar 1 heartbeat perdido (rede lenta, aba em
// segundo plano por um instante) sem piscar offline por engano.
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 20_000;

/** Marca "visto por último agora" pro usuário — Firestore não tem `onDisconnect` (isso é só do Realtime Database), então "offline" é sempre inferido por ausência de heartbeat recente, nunca detectado na hora. */
export async function sendPresenceHeartbeat(userId: string): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.PRESENCE, userId), { lastSeenAt: serverTimestamp() }, { merge: true });
}
