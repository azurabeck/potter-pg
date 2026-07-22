// src/actions/get/campaigns.ts
// Leitura da colecao "campaigns" — cada documento e um bloco de campanha
// (ex: "Campanha 22 - O Reflexo Dourado") pertencente a um personagem,
// com um array `sessions` de eventos/cenas que aconteceram nele.

import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/services/firebase_settings";
import { COLLECTIONS } from "@/services/genene_settings";
import type { Campaign } from "@/utils/types";

/**
 * Busca as `count` campanhas mais recentes de um personagem (por
 * `character_id`, ordenadas por `order`), devolvidas da mais antiga pra
 * mais nova — pra dar continuidade recente à IA sem mandar o historico
 * inteiro, que pode ter dezenas de campanhas.
 *
 * Exige um indice composto (character_id + order) no Firestore; na
 * primeira vez que essa query rodar sem o indice existir, o console do
 * navegador mostra um link direto do Firebase pra criar ele.
 */
export async function getRecentCampaigns(characterId: string, count: number): Promise<Campaign[]> {
  const campaignsRef = collection(db, COLLECTIONS.CAMPAIGNS);
  const q = query(
    campaignsRef,
    where("character_id", "==", characterId),
    orderBy("order", "desc"),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Campaign).reverse();
}
