# CharacterProvider / useCharacter

Contexto React que carrega os personagens de tipo `player` do usuário
logado (`actions/get/characters.ts`, coleção `characters` do Firestore,
filtrando `user_id == user.uid` e `character_type == "player"`) e mantém
qual deles está "ativo". Personagens do tipo `npc` são buscados à parte,
por `getNpcCharacters()` (mesmo arquivo), usado só pela página
`Plataforma` — não passam por este contexto.

- Refaz a busca sempre que `useAuth().user` muda (login/logout).
- `selectCharacter(id)` troca o personagem ativo e grava o id em
  `localStorage` (`potter-pg:active-character-id`), então a seleção
  sobrevive a um refresh — desde que o personagem ainda esteja na lista
  do usuário logado.
- Sem personagem salvo/válido, cai no primeiro da lista; sem nenhum
  personagem, `activeCharacter` fica `null`.
- `sheetVisible`/`showSheet()`/`hideSheet()` controlam a gaveta mobile do
  `CharacterPanel` (abaixo de 1050px, onde o painel some do grid do
  `App.tsx` e vira um drawer fixo). Em telas largas o `CharacterPanel`
  ignora esse estado e fica sempre visível — só o botão flutuante, o
  backdrop e o botão de fechar (visíveis só via media query) dependem
  dele. Começa `false` (gaveta fechada por padrão).

Hoje `Sidebar` (retrato/nome do personagem ativo) e `CharacterPanel`
(ficha completa) consomem `characters`/`activeCharacter`/
`selectCharacter`. O bloqueio de feitiços em `pages/feiticos` continua
usando `CURRENT_CHARACTER_STUB` (`services/genene_settings.ts`) porque
hp/mp/xp/nivel_geral/meta_atual ainda não existem nos documentos reais
de `characters`.
