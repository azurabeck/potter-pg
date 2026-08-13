// src/actions/sets/table.ts
// Escrita da colecao "tables" — o documento nasce sozinho na primeira
// vez que faz falta: seja porque o anfitrião acabou de convidar o
// primeiro player pra mesa (ensureTableExists, chamado por createInvite
// em actions/sets/invites.ts) ou porque alguém ganhou ponto de casa
// antes disso acontecer, por algum motivo (addHousePoints, chamado pelo
// encerramento de sessão em pages/plataforma). Sem tela de criação
// manual — todas só garantem que o documento existe, que quem está na
// mesa tem uma entrada em `players` (syncTableMembers, chamado por
// createInvite/recordGuestCharacter e pelo botão de atualizar do
// CharacterPanel) e que `housePoints` (placar geral, uma chave por
// casa) reflete o total certo.

import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import { HOUSES } from "@/pages/character-wizard/functions";
import type { TablePlayer } from "@/utils/types";

/** As 4 casas sempre presentes em `housePoints`, todas começando em 0. */
function emptyHousePoints(): Record<string, number> {
  return Object.fromEntries(HOUSES.map((casa) => [casa, 0]));
}

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

  await setDoc(tableRef, {
    hostUserId,
    year: new Date().getFullYear(),
    npcs: [],
    players: [],
    housePoints: emptyHousePoints(),
  });
}

/**
 * Garante que cada `characterId` passado tem uma entrada em `players`
 * (com 0 pontos, se ainda não tiver nenhuma) — sem mexer nos pontos de
 * quem já está lá. É o que faltava pra "entrar na mesa" (aceitar convite,
 * anfitrião criar o primeiro convite) também significar "virar membro da
 * mesa pra valer": antes disso só `addHousePoints` inseria alguém em
 * `players`, então quem nunca tinha ganhado ponto ficava de fora do
 * documento, mesmo já estando na mesa. Chamado automaticamente em
 * `createInvite`/`recordGuestCharacter` (`actions/sets/invites.ts`) e
 * também pelo botão de atualizar em `CharacterPanel` (conserta mesas
 * antigas que ficaram sem alguém por causa desse bug).
 */
export async function syncTableMembers(hostUserId: string, characterIds: string[]): Promise<void> {
  const ids = Array.from(new Set(characterIds.filter(Boolean)));
  if (ids.length === 0) return;

  const tableRef = doc(db, COLLECTIONS.TABLES, hostUserId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tableRef);
    const existingPlayers: TablePlayer[] = snapshot.exists() && Array.isArray(snapshot.data().players)
      ? snapshot.data().players
      : [];

    const missingIds = ids.filter((id) => !existingPlayers.some((player) => player.characterId === id));
    if (missingIds.length === 0 && snapshot.exists() && snapshot.data().housePoints && snapshot.data().hostUserId) {
      return;
    }

    const nextPlayers = [...existingPlayers, ...missingIds.map((characterId) => ({ characterId, pointsForHouse: 0 }))];

    if (snapshot.exists()) {
      transaction.update(tableRef, {
        hostUserId: snapshot.data().hostUserId ?? hostUserId,
        players: nextPlayers,
        housePoints: snapshot.data().housePoints ?? emptyHousePoints(),
      });
    } else {
      transaction.set(tableRef, {
        hostUserId,
        year: new Date().getFullYear(),
        npcs: [],
        players: nextPlayers,
        housePoints: emptyHousePoints(),
      });
    }
  });
}

/**
 * Recalcula `housePoints` do zero a partir de `players` — usa o mapa
 * characterId→casa passado (o roster já carregado na tela, com a casa de
 * cada personagem; `Table` não guarda casa de propósito, ver doc do tipo
 * em utils/types.ts) pra somar `pointsForHouse` por casa. Só corrige
 * `housePoints`, não mexe em `players`; chamado junto com
 * `syncTableMembers` pelo botão de atualizar do `CharacterPanel`, pra
 * mesas que foram criadas antes desse campo existir (ou que, por
 * qualquer motivo, ficaram com o placar desatualizado).
 */
export async function recalculateHousePoints(
  hostUserId: string,
  houseByCharacterId: Record<string, string>
): Promise<void> {
  const tableRef = doc(db, COLLECTIONS.TABLES, hostUserId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tableRef);
    if (!snapshot.exists()) return;

    const players: TablePlayer[] = Array.isArray(snapshot.data().players) ? snapshot.data().players : [];
    const nextHousePoints = emptyHousePoints();

    for (const player of players) {
      const house = houseByCharacterId[player.characterId];
      if (house && house in nextHousePoints) {
        nextHousePoints[house] += player.pointsForHouse;
      }
    }

    transaction.update(tableRef, { housePoints: nextHousePoints });
  });
}

/**
 * Soma `points` (aceita negativo, pra descontar) ao total do personagem
 * e da casa dele no documento da mesa (cria a entrada dele se for a
 * primeira vez, cria o documento inteiro se for o primeiro ponto da
 * mesa). Usa transação porque mais de um jogador pode encerrar sessão ao
 * mesmo tempo e escrever no mesmo documento — um simples get+set
 * correria risco de um sobrescrever o ponto do outro.
 */
export async function addHousePoints(
  hostUserId: string,
  characterId: string,
  house: string,
  points: number
): Promise<void> {
  if (!points) return;
  const tableRef = doc(db, COLLECTIONS.TABLES, hostUserId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tableRef);
    const existingPlayers: TablePlayer[] = snapshot.exists() && Array.isArray(snapshot.data().players)
      ? snapshot.data().players
      : [];
    const existingHousePoints: Record<string, number> =
      snapshot.exists() && snapshot.data().housePoints ? snapshot.data().housePoints : {};

    const index = existingPlayers.findIndex((player) => player.characterId === characterId);
    const nextPlayers =
      index === -1
        ? [...existingPlayers, { characterId, pointsForHouse: points }]
        : existingPlayers.map((player, i) =>
            i === index ? { ...player, pointsForHouse: player.pointsForHouse + points } : player
          );

    const nextHousePoints = {
      ...emptyHousePoints(),
      ...existingHousePoints,
      [house]: (existingHousePoints[house] ?? 0) + points,
    };

    if (snapshot.exists()) {
      transaction.update(tableRef, {
        hostUserId: snapshot.data().hostUserId ?? hostUserId,
        players: nextPlayers,
        housePoints: nextHousePoints,
      });
    } else {
      transaction.set(tableRef, {
        hostUserId,
        year: new Date().getFullYear(),
        npcs: [],
        players: nextPlayers,
        housePoints: nextHousePoints,
      });
    }
  });
}
