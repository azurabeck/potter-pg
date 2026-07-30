// src/actions/sets/table.ts
// Escrita da colecao "tables" — só existe esta função de escrita por
// enquanto (somar pontos de casa, chamada pelo encerramento de sessão em
// pages/plataforma). Sem fluxo de criação manual do documento: ele nasce
// sozinho na primeira vez que alguém ganha ponto (ver addHousePoints).

import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { TablePlayer } from "@/utils/types";

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
