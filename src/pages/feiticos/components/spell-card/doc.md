# SpellCard

Tile clicável na grade de `feiticos`, mostra a imagem do feitiço com o
nome numa faixa preta translúcida no rodapé (categoria e stats
continuam só no `SpellDetailModal`).

- Imagem vem de `spellImageUrl` (`functions.ts`): desbloqueado sempre usa
  `attributes.card_image_url` (arte completa, colorida), sem padding,
  borda ou opacidade — ocupa o card inteiro, ponta a ponta. Bloqueado
  usa `attributes.image_url`, com fallback pra `attributes.image` quando
  `image_url` não existir — só o card bloqueado (`.spell-card--locked`)
  ganha a moldura tracejada, padding, `opacity: .52` na imagem e
  `filter: grayscale(.8) brightness(.68)`, além do overlay com cadeado.
  Só as cartas desbloqueadas ficam coloridas e sem esses efeitos.
- `onClick` é chamado ao clicar no card; `pages/feiticos/index.tsx` usa
  isso pra abrir o `SpellDetailModal` com o feitiço clicado.

A lógica de categoria/duração/efeito/imagem é reaproveitada por
`SpellDetailModal`, exportada daqui (`CATEGORY_LABEL`, `normalizeCategory`,
`spellDuration`, `shortEffectLabel`, `spellImageUrl`) pra não duplicar
código entre os dois.
