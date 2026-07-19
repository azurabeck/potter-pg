# Sidebar

Barra vertical fixa à esquerda de toda a aplicação (dentro do
`.app-shell` em `App.tsx`, ao lado do conteúdo da rota atual e do
`CharacterPanel`).

- `__brand`: nome do app + badge "beta".
- `__profile`: retrato do personagem ativo
  (`useCharacter().activeCharacter`, com fallback pras iniciais em
  círculo quando não há `image_url`) e o nome.
- `__items`: lê `NAV_ITEMS` (`services/routes.ts` — fonte única das
  rotas/rótulos/ícones) e mostra ícone + rótulo por item; cada `icon` é
  um componente (mistura `lucide-react` e `@heroicons/react/24/outline`,
  a que fizer mais sentido pra rota). O item da rota atual
  (`isActivePath`, em `functions.ts`) recebe destaque em vermelho com
  uma marca à direita.
- `__bottom`: linha fixa no rodapé (`margin-top: auto`) com `__logout`
  (chama `logout()`, `actions/auth/session.ts`) e `__collapse-toggle`
  (chevron que alterna o sidebar entre expandido/só-ícones).

## Recolher/expandir manualmente

`collapsed` é estado local, inicializado de `readStoredCollapsed()`
(`functions.ts`, lê `localStorage["potter-pg:sidebar-collapsed"]`) e
persistido a cada mudança. Como a largura da coluna do sidebar é
definida em `App.scss` (grid de `.app-shell`), não aqui, o componente
comunica a largura escrevendo a custom property `--sidebar-width` em
`document.documentElement` — `App.scss` lê essa variável com fallback
pro valor normal (192px, ou 170px abaixo de 1050px). Ao desmontar,
remove a property.

A aparência "só ícones" (`.sidebar--collapsed`) usa o mixin
`sidebar-icon-only` (`style.scss`) — o mesmo mixin também é aplicado
automaticamente abaixo de 720px, então nessa faixa de largura o sidebar
fica compacto independente do toggle.
