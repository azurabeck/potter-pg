# Navbar

Cabeçalho fixo no topo da aplicação. Mostra a marca "Potter-PG" (brasão
`assets/images/griff_flag.png`), os links de navegação (ícone + rótulo,
lidos de `services/routes.ts` — `NAV_ITEMS`/`NAV_ICONS` em
`functions.ts`, destacados em dourado quando `isActivePath` bate com a
rota atual) e as informações do personagem ativo
(`useCharacter().activeCharacter`, do `context/character`); sem
personagem real selecionado, cai no stub `CURRENT_CHARACTER_STUB`
(`services/genene_settings.ts`).

Esses mesmos links também aparecem, só com ícone, na barra vertical do
`Sidebar` (`components/sidebar`) — a navegação é intencionalmente
duplicada entre as duas barras, fiel ao layout de referência.

## Dropdown de personagens

Clicar na área do avatar/nome (`navbar__user-toggle`) abre um dropdown
com os personagens de tipo `player` do usuário logado
(`useCharacter().characters`). Clicar em um item chama
`selectCharacter(id)`, que troca o personagem ativo em todo o app e
fecha o dropdown. Fecha também ao clicar fora (`mousedown` fora do
`navbar__user`).

O botão à direita (ícone de saída) chama `logout()`
(`actions/auth/session.ts`). Isso limpa a sessão do Firebase e
`App.tsx` volta a mostrar `pages/login` automaticamente (via
`useAuth()`).

Não recebe props — é renderizado uma única vez no `App.tsx`, fora do
`<Routes>`, para persistir entre as páginas.
