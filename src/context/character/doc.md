# CharacterProvider / useCharacter

Contexto React que carrega os personagens de tipo `player` do usuário
logado (`actions/get/characters.ts`, coleção `characters` do Firestore,
filtrando `user_id == user.uid` e `character_type == "player"`) e mantém
qual deles está "ativo". NPCs moram numa coleção separada, `npcs`
(`getNpcs()`, `actions/get/npcs.ts`), usados pela Plataforma (contexto
da IA, seletor "Quem é a IA?") e por `pages/relacoes` — não passam por
este contexto.

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

Também mora aqui (mesmo não sendo estritamente "personagem", mas
consumido globalmente pelo `CharacterPanel`, que é onde tudo isso
aparece): `guestSeat`/`guestSeatLoading` (convite aceito, se a sessão
está "sentada" na mesa de outra pessoa — ver doc do `plataforma`,
"Mesa compartilhada"), `tableCharacters` (roster da mesa, ver doc do
`CharacterPanel`) e `encounterTarget`/`setEncounterTarget` (alvo do
pedido de encontro, que a `Plataforma` observa pra abrir o
`EncounterModal`).

## Presença (`isUserOnline`)

Cada usuário logado manda um heartbeat periódico
(`sendPresenceHeartbeat`, `actions/sets/presence.ts` — grava
`lastSeenAt: serverTimestamp()` em `presence/{uid}` a cada
`PRESENCE_HEARTBEAT_INTERVAL_MS`, 20s) enquanto tiver o app aberto e
logado — o efeito só depende de `user`, não de ter personagem ativo
nem de estar em nenhuma mesa específica.

Pra saber se OUTRO usuário está online, o contexto assina
`subscribeToUserPresence` (`actions/get/presence.ts`) pra cada
`user_id` visível no roster (o próprio + `tableCharacters`) e expõe
`isUserOnline(userId)`. Como o Firestore não tem um equivalente ao
`onDisconnect()` do Realtime Database, "offline" nunca é detectado na
hora — é sempre inferido pela ausência de heartbeat recente
(`PRESENCE_ONLINE_THRESHOLD_MS`, 45s, sempre maior que o intervalo do
heartbeat pra tolerar 1 batimento perdido sem piscar offline à toa).
Por isso `subscribeToUserPresence` também reavalia num intervalo
próprio (5s), não só quando o documento muda — sem isso, quem fechasse
a aba ficaria "online" pra sempre aos olhos de quem já estava com a
página aberta antes (nenhum snapshot novo dispararia pra avisar que o
tempo passou).
