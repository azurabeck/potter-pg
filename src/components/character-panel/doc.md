# CharacterPanel

Painel vertical fixo à direita de todo o conteúdo (renderizado em
`App.tsx`, dentro do `.app-shell`, como último item da linha —
Sidebar / conteúdo da rota / CharacterPanel). Substituiu a antiga
`StatsBar` (barra horizontal abaixo do Navbar).

- Retrato (`activeCharacter.image_url`, com fallback pras iniciais em
  círculo), HP/MP/XP, os 6 primeiros atributos de
  `activeCharacter.atributos` (mapa dinâmico — ordem de inserção, 2
  colunas preenchidas por coluna: `Magia/Ataque/Controle` à esquerda,
  os 3 seguintes à direita), casa (com o brasão
  `assets/images/griff_flag.png`), meta atual e os 3 primeiros itens de
  `activeCharacter.inventario.itens` como "inventário rápido".
- Sem personagem ativo, cai no `CURRENT_CHARACTER_STUB`
  (`services/genene_settings.ts`) — mesma regra que a StatsBar usava:
  HP/MP/XP, casa e meta atual sempre vêm do stub (ainda não existem nos
  documentos reais de `characters`); atributos caem no
  `FALLBACK_ATTRIBUTES` (nomes normalizados pro mesmo formato title-case
  dos personagens reais).
- O X fecha o painel inteiro (`hideSheet()`, `context/character`);
  reabre ao clicar no avatar/nome no `Navbar` (`showSheet()`).
- "Ver Ficha Completa" e o "+" do inventário rápido linkam pras rotas
  `PERSONAGENS`/`INVENTARIO` (`services/routes.ts`) — ainda sem página
  própria, então caem no redirect padrão pra Feitiços (mesmo
  comportamento de qualquer rota não implementada no app).
