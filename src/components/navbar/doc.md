# Navbar

Cabeçalho fixo no topo do conteúdo (renderizado dentro de
`.app-shell__content`, em `App.tsx`, acima do `<Routes>`). Mostra a
marca "Potter-PG" e, à direita, uma tira com o retrato de cada
personagem de tipo `player` do usuário logado
(`useCharacter().characters`).

Clicar em um retrato chama `selectCharacter(id)` (troca o personagem
ativo em todo o app) e `showSheet()` (reabre o `CharacterPanel`, caso
tenha sido fechado pelo X). Cada retrato ocupa a altura cheia do
`Navbar` (chain de `height: 100%` de `__user` até `__character-avatar`).
Personagens não-ativos ficam dessaturados/escurecidos
(`filter: grayscale/brightness`); o ativo aparece em cor cheia com uma
linha dourada brilhante embaixo (`navbar__character-item--active::after`).
Hover clareia um pouco e levanta a imagem 1px.

Logo/marca, links de navegação e logout não ficam mais aqui — o brasão
e os links (ícone + rótulo) moraram pro `Sidebar`
(`components/sidebar`), assim como o botão de sair.

Não recebe props.
