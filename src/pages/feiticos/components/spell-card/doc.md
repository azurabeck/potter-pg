# SpellCard

Tile clicável na grade de `feiticos`, mostra só a imagem do feitiço
(sem nome, categoria ou stats — isso ficou pro `SpellDetailModal`).

- Imagem vem de `spellImageUrl` (`functions.ts`): desbloqueado sempre usa
  `attributes.card_image_url` (arte completa, colorida). Bloqueado usa
  `attributes.image_url`, com fallback pra `attributes.image` quando
  `image_url` não existir — e o card inteiro (`.spell-card--locked`)
  ganha `filter: grayscale(1)` (preto e branco total) além do overlay
  com cadeado. Só as cartas desbloqueadas ficam coloridas.
- `onClick` é chamado ao clicar no card; `pages/feiticos/index.tsx` usa
  isso pra abrir o `SpellDetailModal` com o feitiço clicado.

A lógica de categoria/duração/efeito/imagem é reaproveitada por
`SpellDetailModal`, exportada daqui (`CATEGORY_LABEL`, `normalizeCategory`,
`spellDuration`, `shortEffectLabel`, `spellImageUrl`) pra não duplicar
código entre os dois.
