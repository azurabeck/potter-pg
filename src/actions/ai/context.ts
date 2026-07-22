// src/actions/ai/context.ts
// Monta o bloco de contexto que entra junto do prompt de sistema mandado
// pra IA de narracao — ficha do personagem (atributos, feiticos e
// maestria), NPCs conhecidos e as campanhas recentes — pra ela ter
// continuidade real com o que ja aconteceu, em vez de narrar no vacuo.

import { getNpcCharacters } from "@/actions/get/characters";
import { getRecentCampaigns } from "@/actions/get/campaigns";
import { getSpells } from "@/actions/get/spells";
import type { Campaign, Character } from "@/utils/types";

const RECENT_CAMPAIGNS_COUNT = 5;

export async function buildCampaignContext(character: Character): Promise<string> {
  const [npcs, campaigns, spells] = await Promise.all([
    getNpcCharacters(),
    getRecentCampaigns(character.id, RECENT_CAMPAIGNS_COUNT),
    getSpells(),
  ]);

  const spellNameById = new Map(spells.map((spell) => [spell.id, spell.attributes.name]));

  return [describeCharacter(character, spellNameById), describeNpcs(npcs), describeCampaigns(campaigns)]
    .filter(Boolean)
    .join("\n\n");
}

function describeCharacter(character: Character, spellNameById: Map<string, string>): string {
  const attributes = Object.entries(character.atributos)
    .map(([name, value]) => `${name} ${value}`)
    .join(", ");

  const spells = Object.entries(character.habilidades)
    .map(([spellId, habilidade]) => {
      const name = spellNameById.get(spellId) ?? spellId;
      return habilidade.nivel ? `${name} (${habilidade.nivel})` : name;
    })
    .join(", ");

  return [
    `PERSONAGEM: ${character.name}, ${character.casa}, ${character.ano}º ano.`,
    attributes ? `Atributos: ${attributes}.` : "",
    spells ? `Feitiços conhecidos e maestria: ${spells}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function describeNpcs(npcs: Character[]): string {
  if (npcs.length === 0) return "";
  return `NPCS CONHECIDOS: ${npcs.map((npc) => npc.name).join(", ")}.`;
}

function describeCampaigns(campaigns: Campaign[]): string {
  if (campaigns.length === 0) return "";

  const blocks = campaigns.map((campaign) => {
    const events = campaign.sessions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((session) => `- [${session.local}] ${session.event}`)
      .join("\n");
    return `## ${campaign.campaign_name}\n${events}`;
  });

  return `SESSÕES RECENTES (da mais antiga pra mais nova):\n\n${blocks.join("\n\n")}`;
}
