# Sidebar

Barra vertical fixa à esquerda de toda a aplicação (fora do `<Routes>`,
dentro do `.app-shell` em `App.tsx`, ao lado do conteúdo da rota atual e
do `CharacterPanel`). Lê `NAV_ITEMS` (`services/routes.ts` — fonte única
das rotas/rótulos) e mostra ícone + rótulo pra cada item
(`NAV_ICONS`/`isActivePath` em `functions.ts`); o item da rota atual
recebe destaque em ouro (fundo, borda esquerda e texto). Configurações
fica fixo no rodapé, separado do resto pela lista (`margin-top: auto`).

## Recolher/expandir

`collapsed` é estado local (`useState`), **default `true`** — a sidebar
abre só com os ícones. O botão `sidebar__toggle` no topo alterna entre
`sidebar--collapsed` (64px, só ícone, rótulo vira `title` pra tooltip) e
a largura cheia (200px, ícone + rótulo). Não persiste entre reloads —
sempre volta a recolhida.
