# CharacterProvider / useCharacter

Contexto React que carrega os personagens de tipo `player` do usuário
logado (`actions/get/characters.ts`, coleção `characters` do Firestore,
filtrando `user_id == user.uid` e `character_type == "player"`) e mantém
qual deles está "ativo".

- Refaz a busca sempre que `useAuth().user` muda (login/logout).
- `selectCharacter(id)` troca o personagem ativo e grava o id em
  `localStorage` (`potter-pg:active-character-id`), então a seleção
  sobrevive a um refresh — desde que o personagem ainda esteja na lista
  do usuário logado.
- Sem personagem salvo/válido, cai no primeiro da lista; sem nenhum
  personagem, `activeCharacter` fica `null`.
- `sheetVisible` controla se o `CharacterPanel` (a "ficha" do
  personagem, painel fixo à direita) está visível. `hideSheet()` é
  chamado pelo X dentro do próprio `CharacterPanel`; `showSheet()` é
  chamado pelo `Navbar` sempre que o avatar/nome é clicado, então a
  ficha volta a aparecer mesmo se tiver sido fechada.

Hoje `Navbar` (dropdown do avatar, nome/casa/ano/avatar exibidos) e
`CharacterPanel` (retrato, atributos, inventário rápido, visibilidade da
ficha) consomem isso. O bloqueio de feitiços em `pages/feiticos` continua
usando
`CURRENT_CHARACTER_STUB` (`services/genene_settings.ts`) porque
hp/mp/xp/nivel_geral/meta_atual ainda não existem nos documentos reais de
`characters`.
