// src/pages/sessoes/functions.ts
import type { Campaign } from "@/utils/types";

// Capas dos "livros" da estante — uma por ano letivo (1º-7º + adulto).
export const YEAR_CARD_BG = [
  "https://i.pinimg.com/736x/0b/88/35/0b88358eac705a39272815d9aa3f62c0.jpg",
  "https://i.pinimg.com/1200x/c5/b9/59/c5b959814d184132f5891949bedb3dd7.jpg",
  "https://i.pinimg.com/1200x/21/48/5a/21485af730d0842b1e3a7fe7eb91833e.jpg",
  "https://i.pinimg.com/1200x/64/b1/33/64b1336e64998f8b298be8803ef66923.jpg",
  "https://i.pinimg.com/1200x/4b/08/79/4b0879c0e2843c6ff5b94943c86dd30c.jpg",
  "https://i.pinimg.com/736x/19/97/eb/1997eb5dafdac3694652ea499fabda9b.jpg",
  "https://i.pinimg.com/1200x/fb/0b/dd/fb0bddb39c93b4e4ab9efab401886155.jpg",
  "https://i.pinimg.com/webp87/736x/cc/7b/f8/cc7bf80f4ccd3dc6a2eb19b048326400.webp",
];

/** Capa do "livro" de um ano letivo — clampada pra nunca estourar `YEAR_CARD_BG`. */
export function yearCoverImage(campaignYear: number): string {
  const index = Math.min(Math.max(campaignYear - 1, 0), YEAR_CARD_BG.length - 1);
  return YEAR_CARD_BG[index];
}

export interface YearBook {
  year: number;
  campaigns: Campaign[];
}

/**
 * Agrupa as campanhas por `campaign_year` (o ano letivo em que a
 * campanha aconteceu — não `year`, que é o ano cronológico do mundo) —
 * um "livro" por ano, na ordem em que aparecem na estante. Dentro de
 * cada ano, campanhas ficam em ordem cronológica (`order` ascendente).
 */
export function groupCampaignsByYear(campaigns: Campaign[]): YearBook[] {
  const years = Array.from(new Set(campaigns.map((c) => c.campaign_year))).sort((a, b) => a - b);

  return years.map((year) => ({
    year,
    campaigns: campaigns
      .filter((c) => c.campaign_year === year)
      .sort((a, b) => a.order - b.order),
  }));
}

/** Sessões de uma campanha, em ordem cronológica (`order` ascendente). */
export function sortedSessions(campaign: Campaign) {
  return [...campaign.sessions].sort((a, b) => a.order - b.order);
}
