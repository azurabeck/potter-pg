// src/actions/sets/table.ts
// Escrita da colecao "tables" — o documento nasce sozinho na primeira
// vez que faz falta: seja porque o anfitrião acabou de convidar o
// primeiro player pra mesa (ensureTableExists, chamado por createInvite
// em actions/sets/invites.ts) ou porque alguém ganhou ponto de casa
// antes disso acontecer, por algum motivo (addHousePoints, chamado pelo
// encerramento de sessão em pages/plataforma). Sem tela de criação
// manual — as duas só garantem que o documento existe.

import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { TablePlayer } from "@/utils/types";

/**
 * Garante que o documento da mesa existe (cria vazio se não existir) —
 * chamado ao adicionar o primeiro player à mesa, pra ela já aparecer
 * (com 0 pontos em todas as casas) antes de qualquer sessão terminar.
 * Não sobrescreve nada se o documento já existir (senão apagaria os
 * pontos já somados de uma mesa em andamento).
 */
export async function ensureTableExists(hostUserId: string): Promise<void> {
  const tableRef = doc(db, COLLECTIONS.TABLES, hostUserId);
  const snapshot = await getDoc(tableRef);
  if (snapshot.exists()) return;

  await setDoc(tableRef, { year: new Date().getFullYear(), npcs: [], players: [] });
}

/**
 * Soma `points` ao total do personagem no documento da mesa (cria a
 * entrada dele se for a primeira vez, cria o documento inteiro se for o
 * primeiro ponto da mesa). Usa transação porque mais de um jogador pode
 * encerrar sessão ao mesmo tempo e escrever no mesmo documento — um
 * simples get+set correria risco de um sobrescrever o ponto do outro.
 */
export async function addHousePoints(hostUserId: string, characterId: string, points: number): Promise<void> {
  if (!points) return;
  const tableRef = doc(db, COLLECTIONS.TABLES, hostUserId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tableRef);
    const existingPlayers: TablePlayer[] = snapshot.exists() && Array.isArray(snapshot.data().players)
      ? snapshot.data().players
      : [];

    const index = existingPlayers.findIndex((player) => player.characterId === characterId);
    const nextPlayers =
      index === -1
        ? [...existingPlayers, { characterId, pointsForHouse: points }]
        : existingPlayers.map((player, i) =>
            i === index ? { ...player, pointsForHouse: player.pointsForHouse + points } : player
          );

    if (snapshot.exists()) {
      transaction.update(tableRef, { players: nextPlayers });
    } else {
      transaction.set(tableRef, { year: new Date().getFullYear(), npcs: [], players: nextPlayers });
    }
  });
}
