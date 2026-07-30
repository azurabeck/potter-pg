# Plataforma

Página visual da mesa de RPG. `functions.ts` concentra tipos, constantes
e helpers (`Die`, `HistoryItem`, `NarrationMessage`, `EndSessionSummary`,
`DICE`, `TURN_ORDER`, `SCOREBOARD_ROWS`, `randomDieResult`,
`isAiPromptsEmpty`, `buildNarrationPrompt`, `buildClosingPrompt`).
`style.scss` mantém só o layout da página (`__header`/`__header-actions`/
`__session-button`, `__workspace`, `__story-grid`, `__response-row`/
`__response-box`, `__actions`) e a família compartilhada `.platform-modal`
(overlay/painel/close/heading/field/error/footer, mais a variante
`__panel--wide` — usada por `DiceRoller`, `SettingsModal`,
`ImageShareModal`, `ImagePreviewModal`, `EncounterModal` e
`EndSessionModal`).

## Início de sessão e narração por IA

O feed de narração começa vazio pedindo pra apertar o botão **Iniciar**
no header (`NarrationPanel`, estado vazio). `sessionActive` é um estado
à parte (não é mais derivado de `narrationMessages.length`, porque o
feed pode ter conteúdo — o resumo de encerramento — mesmo com a sessão
já encerrada; ver seção de encerramento abaixo). Os dois botões do
header (`.platform-page__session-button--play`/`--stop`) alternam com
base nele:

- **Iniciar** (`playSession`) só faz algo se não há sessão ativa nem
  chamada em andamento; zera o feed (descarta um resumo de encerramento
  anterior, se houver), marca `sessionActive` e chama `startSession()`,
  que pede uma cena de abertura via `callAi()`.
- **Encerrar** (`stopSession`) só faz algo se há sessão ativa e nada em
  andamento; chama `endSession()`, que pede pra IA gerar o resumo de
  encerramento — ver seção própria abaixo. Sem confirmação, é uma ação
  direta.

Com a sessão parada, a caixa de resposta fica desabilitada (placeholder
"Aperte iniciar pra começar a sessão...").

`callAi(historySoFar, apiMessages, promptKey)` é o ponto único que fala
com a IA — usado pra abrir a sessão, continuar a narração a cada
mensagem do jogador, e gerar o resumo de encerramento (`promptKey:
"narration" | "closing"`, default `"narration"`, escolhe qual campo de
`aiPrompts` vira o prompt de sistema). Busca `aiPrompts` e
`aiProviderConfig` do usuário (`actions/get/settings.ts` — este segundo
só pra checar se existe token e dar um aviso cedo, sem gastar uma
chamada) e chama `narrate()` (`actions/ai/narrate.ts`), que invoca a
Cloud Function `narrate` (ver seção "Backend" abaixo) — sem token
salvo, mostra um aviso e abre o `SettingsModal` em vez de tentar
chamar. Enquanto a chamada está em andamento, `narrating` desabilita a
caixa de resposta e os dois botões de sessão, e troca o ícone de
enviar por um spinner (`.platform-page__spinner`).

Depois que a sessão começou, cada mensagem normal do jogador
(`submitResponse`) também dispara `continueNarration`, que reenvia o
histórico inteiro de `narrationMessages` pra `callAi` — mapeando quem
falou "Narrador" pro papel `assistant` e todo o resto pro papel `user`.
Não há corte de histórico: sessões muito longas vão mandar (e pagar
por) uma conversa cada vez maior a cada rodada; isso ainda não tem
limite (vale igual pro resumo de encerramento, que manda esse mesmo
histórico inteiro pra IA processar de uma vez).

As chamadas de narração usam `buildNarrationPrompt(aiPrompts)`
(`functions.ts`) como regra de sistema: o ruleset padrão de
`services/ai_prompt_defaults.ts` (narração + batalha + duelo +
quadribol, sempre aplicado — não há "modo" na UI que troque entre eles,
a IA decide pelo que está acontecendo na cena) concatenado com
`aiPrompts.narration`/`.battle`/`.duel`/`.quidditch`, se o usuário tiver
escrito algo em Configurações (regra **adicional**, nunca substitui o
padrão). `aiPrompts.closing` segue separado: `buildClosingPrompt`
junta o padrão de encerramento com `aiPrompts.closing`, e é usado só no
encerramento, abaixo.

### Encerrar sessão (resumo pela IA, em modal)

`stopSession` não chama a IA direto: só abre o `EndSessionModal`
(`endSessionPhase = "confirm"`) perguntando o escopo — **só o meu
personagem** ou **a mesa inteira**. A resposta vira `chooseEndSessionScope
(scope)`, que monta o roster (`[activeCharacter]` ou
`[activeCharacter, ...tableCharacters]`, o roster do `CharacterContext`
— mesma lista que o `CharacterPanel` mostra) e gera **um resumo por
personagem**, cada um com sua própria chamada de IA:

- Pro próprio personagem, usa o `narrationMessages` já carregado em
  memória. Pros demais, busca a sessão salva de cada um
  (`getNarrationSessionOnce(characterId)`, busca única — mesma função
  que `mergeEncounter` usa pra ler o outro lado de um encontro).
- Sem nenhuma mensagem salva pra um personagem, ele nem chega a chamar a
  IA: entra no resultado como `{ text: null }`, que o `EndSessionModal`
  mostra como "**{nome}** não participou da sessão".
- Quem tem mensagens gera de verdade: `buildClosingPrompt(aiPrompts)`
  como prompt de sistema (o padrão de encerramento — eventos, XP por
  soma/média dos dados, evolução de feitiços/poções, inventário, NPCs
  criados, mistérios, evolução de atributos, mais a tabela de XP por
  maestria e as regras de ganho por atributo de `MASTERY_AND_ATTRIBUTES`
  — ver doc do `livraria`, livro do Flitwick — mais o que o usuário
  escreveu no campo "Regra adicional de Encerramento") + o contexto de
  campanha **daquele** personagem (`buildCampaignContext`, cada um com
  seus próprios `campaign_ids`/`mystery_ids`), mandando o histórico dele
  pro provedor de IA (sem streaming pro feed — só acumula o texto
  completo pra mostrar no modal depois).

Todo personagem que gerou resumo (`text !== null`) tem a sessão
realmente encerrada: `narration_sessions` apagado
(`clearNarrationSession`) pra cada um, em paralelo. Logo em seguida, se
o próprio usuário participou (`narrationMessages.length > 0`), roda o
**registro de sessão** (`runSessionRegistration`, ver seção própria
abaixo) — só pro personagem ativo, nunca pros demais da mesa.
`sessionActive` vira `false` só no final, depois de resumos e registro
prontos. `narrationMessages` (o feed visível) **não é tocado** — o
resumo em prosa não entra mais nele, só aparece no `EndSessionModal`
(`endSessionPhase = "results"`): o personagem do próprio usuário sempre
aberto primeiro, os demais em acordeão (fecha/abre por nome, ver doc do
`end-session-modal`). O resumo em prosa dos **outros** personagens da
mesa continua só texto mostrado no modal, perdido ao fechar — só a
ficha do próprio usuário é realmente atualizada no Firestore.

### Registro de sessão (livro "Registros Mágicos", Kingsley)

Depois do resumo em prosa, `runSessionRegistration` (`index.tsx`) gera
uma segunda resposta da IA, estruturada em JSON, que atualiza a ficha
de verdade — implementa o livro 7 da Livraria (`services/
ai_prompt_defaults.ts`, `MINISTRY_RECORDS`), com duas reduções de
escopo explícitas (ver `buildSessionRegistrationPrompt`,
`pages/plataforma/functions.ts`):

- **Evolução geral de XP e progressão de XP/HP (seções 6-7 do
  protocolo) ficam de fora** — a ficha ainda não tem campo de XP geral
  nem de progressão, só maestria por feitiço/poção. Fica pra uma rodada
  futura, quando esses campos existirem.
- **Sem o fluxo de "pedir rolagem e esperar"** — o protocolo original
  tem duas etapas (`"waiting_for_rolls"` → aguarda o usuário rolar dados
  → resposta final), mas isso só existe pra alimentar justamente a
  evolução de XP/HP geral (seção 6-7), que está fora do escopo agora.
  Sem essa seção, não sobra nenhuma rolagem nova pra pedir: maestria de
  feitiço/poção usa os dados **já rolados durante a sessão**
  (`history`, filtrado por `type === "dice"`), não uma rolagem nova.
  Por isso a resposta sempre sai completa numa única chamada — o
  fluxo de duas etapas continua sendo o certo pra seguir, só entra em
  cena quando a evolução de XP/HP for implementada de verdade.

O que a IA pode devolver (`SessionRegistration`, `functions.ts`):
maestria de feitiço/poção (`spell_mastery_updates`/
`potion_mastery_updates`, aplicados em `habilidades[id].xp`/
`pocoes[id].xp`), inventário (`inventory_updates` — add/update/remove,
gera `crypto.randomUUID()` pra item novo), dinheiro (`money_update`,
sempre escrito no campo `dinheiro` principal, mesmo que o personagem
ainda usasse só o legado — ver `resolveCharacterMoney` em `@/utils`),
histórico de campanha (`session_history`, anexado à campanha do ano
letivo atual via `appendSessionToCampaign`,
`actions/sets/campaigns.ts`) e sugestões de mistério
(`mystery_suggestions` — nunca aplicadas sozinhas, ver abaixo).

Tudo isso (exceto mistério) é aplicado **direto**, sem confirmação:
`updateCharacterAfterSession` (`actions/sets/characters.ts`, primeira
escrita de personagem além da criação pelo wizard) grava
`habilidades`/`pocoes`/`inventario`/`dinheiro` de uma vez. Só o
**personagem ativo** (dono da sessão que clicou Encerrar) é
atualizado — mesmo com escopo "mesa inteira", os outros personagens só
recebem o resumo em prosa, nunca uma escrita na ficha deles a partir da
sessão de outra pessoa (isso é uma fronteira de segurança/permissão:
cada um só deveria poder escrever a própria ficha).

**Sugestões de mistério exigem aprovação manual** — seguindo a regra
explícita do próprio protocolo do Kingsley ("a IA nunca atualiza a
coleção de mistérios sozinha"), cada sugestão aparece no
`EndSessionModal` com um botão "Aprovar" por item; só ao clicar,
`approveMysterySuggestion` chama `applyMysterySuggestion`
(`actions/sets/mysteries.ts`, primeira escrita na coleção `mysteries`
além da leitura), que cria um mistério novo (`suggested_action:
"create"`) ou atualiza um existente (`"update"` — marca `status:
"resolvido"` quando a classificação indicar resolução completa).

Erros nessa etapa (IA fora do ar, JSON malformado, chamada rejeitada)
não derrubam o resumo em prosa (já mostrado antes) — só aparecem como
uma mensagem de erro própria no modal (`registrationError`), sem nada
escrito na ficha.

**Registro de NPCs (3 casos)** — junto do payload, `runSessionRegistration`
manda `known_npcs` (NPCs da coleção `npcs` já relacionados a este
personagem) e `other_npcs` (existem, mas ainda não relacionados a ele —
`splitKnownNpcs`, `functions.ts`, mesma normalização de `relacionado`
array-ou-string de `pages/relacoes/functions.ts`, duplicada aqui). Pra
cada NPC que apareceu na sessão, a IA decide entre 3 casos (instrução
"REGISTRO DE NPCs" em `buildSessionRegistrationPrompt`):

1. Já está em `known_npcs` → não faz nada.
2. Não está em `known_npcs` mas está em `other_npcs` → devolve em
   `npc_links` (`{npc_id, npc_name}`) — vinculado **direto, sem
   aprovação** (`linkNpcToCharacter`, `arrayUnion` em `relacionado`),
   junto das outras escritas automáticas desta etapa.
3. Não existe em nenhuma das duas → devolve em
   `npc_creation_suggestions`, com a ficha completa (mesmo formato de
   `pages/relacoes`, incluindo os 18 atributos) — **precisa de
   aprovação**, igual mistério: cada sugestão aparece no
   `EndSessionModal` com um botão "Aprovar"; só ao clicar,
   `approveNpcSuggestion` chama `createNpcFromSuggestion`
   (`actions/sets/npcs.ts`) — cria o documento na coleção `npcs`, já
   nascendo com `relacionado: [characterId]` e `user_id` do personagem
   que aprovou.

**Registro de adversários** — alimenta `pages/adversarios` (ver doc
própria). O payload também manda `all_enemies` (coleção `enemies`
inteira, id+nome) e `known_adversaries` (nomes já resolvidos de
`activeCharacter.adversarios_conhecidos`, pra IA não repetir quem já
está lá). Adversário aqui é **criatura (`enemies`) ou NPC hostil** — os
dois contam, por isso o payload reaproveita `known_npcs`/`other_npcs`
já montados pro registro de NPCs em vez de mandar uma terceira lista.
Sempre que um adversário aparecer de forma relevante (luta, confronto,
ameaça direta — não só citado), a IA devolve em `adversary_encounters`
(`{id, tipo, name}`) — **sem aprovação**, igual `npc_links`: é só um
registro de "o personagem já viu/enfrentou isso", nunca cria um
documento novo. `applyAdversaryEncounters` (`functions.ts`) deduplica
por `tipo:id` e o resultado vai direto no mesmo
`updateCharacterAfterSession` das outras atualizações automáticas desta
etapa (`adversarios_conhecidos`, `actions/sets/characters.ts`).

### Refazer a última resposta

O botão "Refazer última resposta" (`NarrationPanel`, ver doc própria)
chama `regenerateLastMessage()` — só aparece/funciona quando há sessão
ativa, a última mensagem do feed é do "Narrador" e nada está em
andamento (o resumo de encerramento não entra mais no feed, então não
há mais o caso de "refazer o resumo" — ver seção acima). Ele descarta
essa última mensagem do feed (`narrationMessages.slice(0, -1)`) e repete
a chamada que a gerou:

- `historySoFar` vazio → a última fala era a cena de abertura (a única
  mensagem da sessão) → chama `startSession()` de novo.
- Qualquer outro caso → é uma rodada normal → chama
  `continueNarration(historySoFar)`, igual a uma rodada nova (o próprio
  `historySoFar` já termina na fala do jogador que gerou a resposta
  descartada, do mesmo jeito que `submitResponse` monta esse array).

Como passa pelo mesmo `callAi`, uma rodada normal refeita também
re-salva a sessão no Firestore (`saveNarrationSession`) com o novo
texto no lugar do antigo — não fica um resumo velho salvo por engano.

### Retomar sessão e mesa ao vivo (Firestore em tempo real)

O feed inteiro (`narrationMessages`) fica salvo na coleção
`narration_sessions` do Firestore, um documento por personagem (id do
documento == `character.id`). Toda vez que a IA termina de responder
numa rodada de narração normal, `callAi` (`index.tsx`) chama
`saveNarrationSession` (`actions/sets/narration-session.ts`) com o feed
atualizado. Do outro lado, `subscribeToNarrationSession` (mesmo
arquivo, `actions/get/`) é um listener em tempo real (Firestore
`onSnapshot`, não busca única) — ao entrar na página (ou trocar de
personagem/mesa), um `useEffect` assina esse documento; qualquer
mudança nele (de qualquer participante) atualiza `narrationMessages` e
`sessionActive` na hora, em todo mundo que estiver com essa sessão
aberta. Isso serve dois papéis ao mesmo tempo:

- **Pausa automática**: fechar o navegador (ou abrir de outro
  aparelho, bastando logar e ter o personagem certo) e continuar de
  onde parou, porque o listener recebe o estado salvo assim que
  conecta.
- **Mesa compartilhada ao vivo**: anfitrião e convidados (ver seção
  abaixo) escutam o **mesmo documento** — quando um deles manda uma
  ação ou a IA responde, todo mundo vê o feed atualizar sozinho, sem
  precisar recarregar a página. É assim que "jogam o mesmo jogo".
  Ressalva: o streaming chunk a chunk (`callAi`) só é local pra quem
  disparou a chamada — os outros participantes só veem a fala aparecer
  **pronta**, de uma vez, quando ela é salva no Firestore ao final do
  streaming (o documento só muda nesse momento).

Trocar de personagem/mesa sempre zera o feed local antes de assinar a
sessão nova, pra não misturar as duas. Como é por personagem e não por
navegador/cookie, não há isolamento por aparelho: só existe uma sessão
por personagem por vez, e ela é sobrescrita inteira a cada resposta da
IA (`setDoc` sem merge) até ser encerrada.

### Mesa compartilhada (convites)

Um usuário pode convidar outro pra entrar na mesa dele — `SettingsModal`
("Players da sessão") cria um convite de verdade quando o campo recebe
um e-mail (nome sem `@` continua só entrando na lista visual de sempre,
sem criar nada no Firestore). `createInvite` (`actions/sets/invites.ts`)
grava um documento na coleção `invites` com `hostUserId`/
`hostCharacterId` (uid e personagem ativo de quem está convidando),
`hostName` (nome do personagem do anfitrião, ou o e-mail dele se não
tiver nome) e `toEmail`, com `status: "pending"`.

`InviteBanner` (`components/invite-banner`, montado em `App.tsx` acima
de tudo — aparece tanto no wizard de criação quanto no app normal,
porque é por conta, não por personagem) escuta em tempo real
(`subscribeToPendingInvites`, `onSnapshot`) os convites pendentes pro
e-mail do usuário logado — um convite novo aparece assim que é criado,
sem reload. Aceitar/rejeitar chama `respondToInvite`
(`actions/sets/invites.ts`), que só troca o `status` do documento;
aceitar também navega direto pra `/plataforma` (`useNavigate`) — mesmo
sem ficha ainda, a URL já fica certa e o app cai lá assim que o wizard
terminar.

No `SettingsModal`, cada convite por e-mail entra no histórico
(`HistoryPanel`) com `inviteId` + `inviteStatus: "pending"` — mostra a
tag "(usuário convidado)". Na Plataforma, `subscribeToHostInvites`
(`actions/get/invites.ts`, também `onSnapshot`) escuta todos os
convites que o usuário logado criou como anfitrião; qualquer mudança de
status atualiza a tag do `HistoryPanel` pra "(convidado aceito)" na
hora, sem polling.

Ao entrar na Plataforma, um `useEffect` busca (busca única, não
listener — aceitar já navega direto pra cá, então não precisa reagir a
mudanças depois de montado) o convite **aceito** mais recente pro
e-mail do usuário (`getActiveTableSeat` — simplificação: só uma mesa
aceita conta por vez, a mais recente, mesmo que existam várias) e
guarda em `guestSeat`. Enquanto isso carrega, `guestSeatLoading` trava
o efeito de assinar a sessão, pra não escutar o documento errado por
uma fração de segundo.

**Cada player usa a própria configuração de IA** — `guestSeat` não
substitui `user.uid` em nada relacionado a `getAiPrompts`/
`getAiProviderConfig` (`callAi`, `chooseEndSessionScope`,
`mergeEncounter`). Sentar na mesa de alguém não empresta token nem
prompts do anfitrião: cada convidado precisa configurar o próprio
provedor/token em Configurações antes de narrar. Isso é assim porque as
histórias já são independentes por padrão (cada personagem narra
sozinho, na própria sessão — `effectiveCharacterId` só passa a
compartilhar feed com outro personagem específico depois de um
**Encontro** aceito, seção abaixo) — não fazia sentido só as
configurações continuarem centralizadas no anfitrião. `guestSeat`
continua existindo, mas só pra: mostrar "Sentado na mesa de {hostName}"
no header, decidir quem entra em `tableCharacters` (roster da mesa, ver
`context/character`) e registrar o personagem do convidado no convite
(`recordGuestCharacter`, abaixo). **Iniciar**, **Encerrar** e
**Configurações** ficam liberados pra qualquer um sentado na mesa, sem
depender de ser o anfitrião.

Não implementado ainda: um jeito de sair da mesa (o convite aceito fica
valendo pra sempre, não há botão de "sair").

### Encontros (feeds convergindo)

Personagens na mesma mesa narram cada um a própria história até se
encontrarem de propósito. Quem mais está na mesa (anfitrião + convidados
que já registraram personagem, ver `recordGuestCharacter` acima) mora
em `tableCharacters`, no `CharacterContext` (não mais local desta
página — assim o roster fica disponível pro `CharacterPanel`, global,
mesmo fora da Plataforma) e aparece na área de retrato dele com um
botão "ir até" por personagem; clicar chama `setEncounterTarget`
(também do contexto), que esta página observa pra abrir `EncounterModal`
e digitar onde o encontro deve acontecer — `submitEncounterRequest` cria
o pedido (`createEncounter`, `actions/sets/encounters.ts`).

O pedido aparece pro outro lado como um aviso acima do feed
(`pendingEncounters`, `subscribeToPendingEncounters` — tempo real) com
Aceitar/Rejeitar. **Só quem aceita** roda `mergeEncounter`: busca o
próprio feed local e o feed do outro personagem
(`getNarrationSessionOnce`, busca única — não precisa escutar, só olhar
o estado no momento do encontro), monta uma instrução pedindo pra IA
"narrar o momento em que os dois se encontram em {local}, unindo as
duas histórias", e salva o resultado como a primeira fala da sessão
**compartilhada**: `sharedCharacterId` (calculado em `createEncounter`
como os dois characterIds ordenados e unidos por `__` — determinístico,
os dois lados chegam nele sem combinar nada).

Quem **pediu** o encontro não faz nada além de esperar: assim que o
status vira `"accepted"`, o próprio `subscribeToMyEncounter` dele (que
escuta os dois lados, `fromCharacterId` e `toCharacterId`) atualiza
`myEncounter`, `effectiveCharacterId` muda pra `sharedCharacterId`, e o
`subscribeToNarrationSession` (mesmo de sempre) pega a cena de
convergência assim que ela é salva.

Simplificações conhecidas:
- A "jornada até o encontro" é **uma única cena gerada pela IA**, não
  uma sequência de turnos simulados narrando o caminho até lá — o
  pedido é aceito e a convergência já acontece na resposta seguinte.
- Sem jeito de **desfazer** um encontro (voltar a narrar separado) — o
  encontro aceito vale pra sempre, igual ao convite de mesa.
- Ao aceitar, `effectiveCharacterId` muda quase imediatamente (assim
  que `myEncounter` resolve), mas a cena de convergência ainda está
  sendo gerada — quem aceitou pode ver o próprio feed esvaziar por um
  instante até a IA responder e salvar a primeira fala da sessão
  compartilhada.
- **Risco não verificado**: como `sharedCharacterId` não é um id de
  personagem de verdade (é uma concatenação), se as regras de segurança
  do Firestore validarem acesso a `narration_sessions/{id}` conferindo
  se `id` existe como documento em `characters` (um padrão comum), a
  leitura/escrita da sessão compartilhada pode falhar com
  permission-denied pros dois lados — não tenho acesso ao console pra
  conferir as regras reais deste projeto. Mesma ressalva vale pra
  `getCharacterById` ler a ficha de um personagem de **outro** usuário
  (pro roster de `tableCharacters` no `CharacterContext`) — se as regras
  de `characters` só permitirem o próprio dono ler, isso também quebra.

### Contexto da campanha

Junto do prompt de sistema, `callAi` também manda o resultado de
`buildCampaignContext(activeCharacter)` (`actions/ai/context.ts`) —
sem personagem ativo, esse bloco fica vazio e a IA narra só com o
prompt configurado. Esse contexto junta três coisas, cada uma buscada
por sua própria action:

- **Ficha do personagem** — nome/casa/ano, `atributos` e `habilidades`
  (feitiços e maestria; os ids de feitiço são resolvidos pra nome via
  `getSpells()`, a mesma busca usada em `pages/feiticos`).
- **NPCs** — todo mundo da coleção `npcs` (`getNpcs()`,
  `actions/get/npcs.ts`, separada de `characters`). O contexto manda
  todos (só o nome, `describeNpcs` em `actions/ai/context.ts`) — não
  filtra por `relacionado` como `pages/relacoes` faz, porque aqui é só
  "quem existe no mundo", não "quem esse personagem conhece".
- **Sessões recentes** — as 5 campanhas mais recentes do personagem
  (`getRecentCampaigns`, `actions/get/campaigns.ts`), da mais antiga
  pra mais nova, com os eventos de cada uma. Escolhido em vez de
  mandar o histórico inteiro (um personagem já tem quase 60 campanhas)
  porque explodiria custo/latência de cada chamada.

`getRecentCampaigns` faz `where("character_id", ...) + orderBy("order", ...)`,
que exige um índice composto no Firestore — definido em
`firestore.indexes.json` (raiz do repo, referenciado em `firebase.json`)
pra não depender de clicar num link toda vez que o projeto for
recriado. Se o índice ainda não existir no projeto de verdade, a
primeira chamada falha e o erro (que aparece na mensagem do "Narrador"
no feed, e no console) traz um link direto do Firebase pra criar ele —
ou `npx firebase-tools deploy --only firestore:indexes` (dentro de
`functions/`, ou na raiz apontando `--project potterpg`) aplica o que
está em `firestore.indexes.json` direto, sem precisar do link.

### Backend (Cloud Function `narrate`) — streaming

`src/actions/ai/narrate.ts` não fala mais direto com a Anthropic/OpenAI/
Gemini — ele chama a Cloud Function `narrate` (`functions/src/index.ts`,
projeto separado em `functions/`, com seu próprio `package.json` e
`tsconfig.json`). Ela é um endpoint HTTP puro (`onRequest`), não
`httpsCallable`: o SDK client do Firebase instalado (`firebase` 10.x)
ainda não suporta streaming callable, e a resposta precisa chegar aos
pedaços pro texto do narrador aparecer sendo "digitado" em vez de surgir
tudo de uma vez. Por isso a autenticação é manual (`Authorization:
Bearer <idToken>`, pego com `user.getIdToken()`) em vez do Firebase Auth
anexar sozinho como fazia o `httpsCallable`. A function:

1. Lê o `Authorization` header e valida o ID token com
   `getAuth().verifyIdToken()` (Admin SDK) — sem token válido, rejeita.
2. Lê `settings/{uid}.aiProvider` direto no Firestore com o Admin SDK
   (`functions/src/index.ts`) — que ignora as regras de segurança do
   client, então funciona mesmo que a coleção `settings` esteja
   travada só pro dono.
3. Chama o provedor certo em modo streaming (`functions/src/providers.ts`
   — `stream: true`/`alt=sse` em cada API, sem o header
   `anthropic-dangerous-direct-browser-access`, que só existia pra
   liberar chamada direta do navegador) e vai escrevendo cada pedaço de
   texto direto na resposta HTTP (`res.write`) conforme chega, em vez de
   esperar o texto inteiro pra devolver de uma vez.

`narrate()` (client) lê essa resposta com `fetch` + `response.body.
getReader()`, chamando `onDelta(chunk)` a cada pedaço; `callAi`
(`index.tsx`) usa esse callback pra criar a mensagem do narrador no
primeiro pedaço e ir concatenando texto nela a cada pedaço seguinte —
por isso a resposta "monta" na tela em vez de aparecer inteira no fim.

O token nunca mais viaja do navegador até um provedor de IA a cada
narração — só na hora de salvar em Configurações, que é inevitável (o
usuário precisa digitar ele em algum lugar). Isso também resolve o
bloqueio de CORS que a OpenAI provavelmente daria numa chamada direta
do navegador (a function usa `{ cors: true }` pro app poder chamar ela
direto).

### Rodando local (emulador, sem deploy nem Blaze)

Dois terminais:

1. Dentro de `functions/`: `npm run serve` — builda e sobe o emulador
   local da function em `127.0.0.1:5001` (usa `npx firebase-tools`, já
   instalado como devDependency ali, não precisa de instalação global).
2. Na raiz do projeto: `npm run dev`, como sempre.

`src/actions/ai/narrate.ts` monta a URL da function direto
(`http://127.0.0.1:5001/potterpg/us-central1/narrate` quando
`import.meta.env.DEV`, senão a URL de produção
`https://us-central1-potterpg.cloudfunctions.net/narrate`) — não tem
mais `connectFunctionsEmulator` porque não é mais `httpsCallable`.

O emulador não está autenticado numa conta Google local (sem
`firebase login`), então `settingsDoc` dentro da function vai tentar
ler o Firestore de produção mesmo — funciona pra leitura normal, mas
sem `firebase login` prévio pode falhar por falta de credenciais.
Rodar `npx firebase-tools login` uma vez (dentro de `functions/`)
resolve isso.

### Deploy em produção

Isso não dá pra fazer por aqui:

- O plano **Blaze** (pago por uso) precisa estar habilitado no projeto
  Firebase (`potterpg`) — só no console do Firebase/Google Cloud.
- `npx firebase-tools login` (fluxo interativo no navegador, dentro de
  `functions/` ou na raiz) e depois `npm run deploy` (dentro de
  `functions/`).
- Conferir as regras do Firestore pra `settings/{uid}` (ver doc do
  `settings-modal`) — a function não depende delas, mas o app ainda lê
  o token direto do client pra checar se está configurado.

Ver a doc do `settings-modal` pra mais detalhes de como o token é
guardado.

`index.tsx` só guarda o estado que precisa ser compartilhado entre
componentes ou que o Escape global precisa alcançar diretamente
(`rolledDie`, `isImageFormOpen`, `previewImage`, `imageError`,
`isSettingsOpen`, `history`, `narrationMessages`, `narrating`, estado
do placar) — o resto vive dentro de cada componente de `components/`.

## components/

- **`turn-order/`** — carrossel da ordem da rodada. Autônomo, sem props.
- **`narration-panel/`** — feed de narração. Recebe `messages`, cuida do
  próprio auto-scroll.
- **`history-panel/`** — histórico de rolagens/imagens/entradas. Recebe
  `items` e `onPreview` (abre o `ImagePreviewModal` no pai).
- **`dice-roller/`** — fileira de dados + modal de resultado. `rolledDie`
  é controlado pelo pai por causa do Escape global.
- **`settings-modal/`** — configurações da sessão. Sempre montado pelo
  pai (só o JSX visível é condicional) para que prompts/players
  digitados sobrevivam a um fechar/abrir do modal. Carrega/salva os
  prompts de IA (regras **adicionais** ao padrão embutido, ver
  `services/ai_prompt_defaults.ts`) no Firestore e chama
  `onRequireSetup` (o pai abre o modal) se não houver token de IA salvo
  ao entrar na página — os campos de prompt em si são opcionais, então
  não entram nessa checagem.
- **`image-share-modal/`** — formulário "cole o link da imagem".
  Totalmente controlado pelo pai.
- **`image-preview-modal/`** — visualização em tela cheia de uma imagem.
  Controlado pelo pai via `src` (vazio = fechado).
- **`end-session-modal/`** — pergunta o escopo do encerramento (só o
  personagem ativo ou a mesa inteira, `phase: "confirm"`), mostra um
  spinner enquanto os resumos são gerados (`"loading"`) e por fim a
  lista de resumos por personagem (`"results"`, `summaries`) — o
  primeiro item (o personagem do próprio usuário) sempre aberto, os
  demais em acordeão local (`expandedIds`, resetado a cada nova rodada
  de resultados). Logo abaixo da lista, se houver `registration` (ver
  "Registro de sessão" acima), mostra o que foi atualizado na ficha
  (maestria, inventário, dinheiro, NPCs vinculados automaticamente,
  adversários registrados) e um
  cartão por sugestão — de mistério (`onApproveMysterySuggestion`,
  `appliedMysterySuggestions`/`applyingMysteryIndex`) ou de NPC novo
  (`onApproveNpcSuggestion`, `appliedNpcSuggestions`/`applyingNpcIndex`)
  — cada um com botão "Aprovar" que desabilita/mostra check depois de
  aplicado; `registrationError`, se houver, aparece como aviso separado,
  sem esconder os resumos em prosa. Totalmente
  controlado pelo pai: não chama IA nem Firestore, só repassa escolha
  e aprovação via `onChooseScope`/`onApproveMysterySuggestion`. Ver
  seção "Encerrar sessão" acima pra como o pai gera os resumos e o
  registro.
- **`scoreboard/`** — placar de status dos personagens (já existia antes
  desta reorganização).
