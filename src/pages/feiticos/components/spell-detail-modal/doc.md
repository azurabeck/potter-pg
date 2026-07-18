# SpellDetailModal

Modal com os detalhes completos de um feitiço, aberto ao clicar em um
`SpellCard` na grade de `pages/feiticos`. Fecha ao clicar no overlay, no
X ou pressionar Esc.

- Layout em duas colunas: `__image-wrap` ocupa a altura inteira do painel
  (`height: 100%`) com a imagem do feitiço (`spellImageUrl` — mesma regra
  do `SpellCard`); bloqueado ganha `filter: grayscale(1)`
  (`__image-wrap--locked`), só as cartas desbloqueadas ficam coloridas.
  `__content` tem nome, categoria, meta (ano/categoria/alcance/duração),
  descrição e o rodapé de estatísticas (dano ou dificuldade/efeito,
  igual ao antigo `SpellCard` completo).
- Reaproveita `CATEGORY_LABEL`/`normalizeCategory`/`spellDuration`/
  `shortEffectLabel`/`spellImageUrl` de `../spell-card/functions.ts` —
  a lógica de categoria/duração/efeito/imagem é a mesma, só mudou de
  componente.
- Abaixo de 640px de largura, empilha verticalmente (imagem em cima,
  conteúdo embaixo) em vez de lado a lado.

`pages/feiticos/index.tsx` controla qual feitiço está selecionado
(`selectedSpell`) e só renderiza este componente quando há um.
