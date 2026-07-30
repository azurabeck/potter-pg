# Página: Sessões

Histórico de campanhas do personagem ativo, em forma de estante — um
"livro" por ano letivo, cada um listando as campanhas daquele ano e as
sessões de cada campanha, em ordem cronológica. **Só leitura**: sem
criar, editar ou colar JSON de sessão nova — isso é um próximo passo
(quem vai escrever aqui é a IA, ao encerrar uma sessão, mesma ressalva
de `pages/misterios`).

O modelo de dados (coleção `campaigns`, campos, o que é
`campaign_year` vs. `year`) foi conferido contra um projeto irmão
(`potter-spells`, aba "Sessions") que já tem a leitura/escrita
funcionando — a boa notícia é que os tipos que este projeto já tinha
(`Campaign`/`CampaignSessionEvent`, `utils/types.ts`) já batiam
exatamente, então não precisou mudar nada ali.

## Fluxo de dados

1. `getAllCampaigns(characterId)` (`actions/get/campaigns.ts` — nova,
   ao lado de `getRecentCampaigns`, que só busca as N mais recentes pro
   contexto da IA) busca **todas** as campanhas do personagem ativo,
   ordenadas por `order`.
2. `groupCampaignsByYear` (`functions.ts`) agrupa por `campaign_year`
   (o ano **letivo** em que a campanha aconteceu — não confundir com
   `year`, o ano **cronológico** do mundo, tipo 2026) — um `YearBook`
   por ano, na ordem em que aparecem na estante; dentro de cada ano, as
   campanhas já saem ordenadas por `order`.
3. `index.tsx` renderiza um "livro" por `YearBook`, com a capa de
   `yearCoverImage(year)` (índice em `YEAR_CARD_BG`, clampado — 8
   capas, uma por ano letivo 1º-7º + adulto) e um resumo (quantas
   campanhas/sessões aquele ano tem).
4. Clicar abre `YearDetailModal`: lista as campanhas daquele ano, cada
   uma um acordeão (só uma aberta por vez, a primeira já vem aberta) —
   abrir mostra as sessões da campanha em ordem cronológica
   (`sortedSessions`, por `session.order`), cada uma com evento, data,
   local e personagens presentes.

## Estrutura de arquivos

```
sessoes/
├── index.tsx        // página (fetch + agrupamento por ano + estante)
├── functions.ts      // YEAR_CARD_BG, groupCampaignsByYear, sortedSessions
├── style.scss
├── doc.md
└── components/
    └── year-detail-modal/  // modal com as campanhas/sessões de um ano, aberto ao clicar num livro
```
