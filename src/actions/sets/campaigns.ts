// src/actions/sets/campaigns.ts
// Escrita da colecao "campaigns" — ate agora so existia leitura
// (actions/get/campaigns.ts). Primeiro uso: o registro de sessao (ver
// pages/plataforma/functions.ts) anexa a linha do tempo gerada pela IA
// na campanha do ano letivo atual do personagem.

import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import { getAllCampaigns } from "@/actions/get/campaigns";
import type { Campaign, CampaignSessionEvent, Character } from "@/utils/types";

/**
 * Acrescenta os eventos de uma sessão encerrada à campanha do ano letivo
 * atual do personagem (`campaign_year === character.ano`) — cria uma
 * campanha nova se essa for a primeira sessão do ano (numerando `order`
 * a partir da maior campanha já existente do personagem, de qualquer
 * ano). `event.order` de cada evento é renumerado a partir do que já
 * existe na campanha (a IA numera começando em 1 a cada resposta, sem
 * saber quantas sessões já foram registradas antes).
 *
 * A campanha nova sempre grava `user_id` (igual a `createPlayerCharacter`
 * e `applyMysterySuggestion`) — sem ele a escrita batia num
 * permission-denied silencioso (só `console.error`, sem aparecer pro
 * usuário) sempre que essa era a primeira sessão do ano letivo.
 *
 * Depois de gravar (criar ou atualizar), o id da campanha é atrelado ao
 * personagem em `character.campaign_ids` (`linkCampaignToCharacter`,
 * `arrayUnion` — nunca duplica, e cobre tanto campanha nova quanto
 * campanha já existente sendo atualizada de novo). Isso roda depois da
 * escrita principal e nunca derruba a função por causa dela: a sessão em
 * si (o que importa de verdade) já está salva em `campaigns` nesse
 * ponto, então uma falha só em atrelar o id não deveria aparecer como
 * "a sessão não registrou".
 */
export async function appendSessionToCampaign(character: Character, events: CampaignSessionEvent[]): Promise<void> {
  if (events.length === 0) return;

  const campaigns = await getAllCampaigns(character.id);
  const target = campaigns
    .filter((campaign) => campaign.campaign_year === character.ano)
    .sort((a, b) => b.order - a.order)[0];

  // `target?.id` (não só `target`) — documento sem id de verdade (ex.:
  // dado antigo/importado com um campo "id" próprio dentro do payload,
  // que sobrescreveria o `doc.id` de verdade no spread de
  // `getAllCampaigns`) quebrava `doc(db, COLLECTIONS.CAMPAIGNS, undefined)`
  // com "Document references must have an even number of segments" — cai
  // pro mesmo caminho de "nenhuma campanha do ano ainda", que cria uma
  // nova, em vez de derrubar o encerramento inteiro.
  if (target?.id) {
    const nextOrder = target.sessions.reduce((max, event) => Math.max(max, event.order || 0), 0) + 1;
    const renumbered = events.map((event, index) => ({ ...event, order: nextOrder + index }));
    await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, target.id), {
      sessions: [...target.sessions, ...renumbered],
      updated_at: serverTimestamp(),
    });
    await linkCampaignToCharacter(character.id, target.id);
    return;
  }

  const maxOrder = campaigns.reduce((max, campaign) => Math.max(max, campaign.order || 0), 0);
  const newCampaign: Omit<Campaign, "id"> = {
    user_id: character.user_id,
    campaign_name: `Campanha ${maxOrder + 1} de ${character.name}`,
    campaign_year: character.ano,
    character_id: character.id,
    order: maxOrder + 1,
    sessions: events.map((event, index) => ({ ...event, order: index + 1 })),
    year: new Date().getFullYear(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CAMPAIGNS), {
    ...newCampaign,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  await linkCampaignToCharacter(character.id, docRef.id);
}

async function linkCampaignToCharacter(characterId: string, campaignId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.CHARACTERS, characterId), {
      campaign_ids: arrayUnion(campaignId),
    });
  } catch (error) {
    console.error("Erro ao atrelar a campanha ao personagem:", error);
  }
}
