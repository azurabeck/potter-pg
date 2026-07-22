# Plataforma

Página visual da mesa de RPG. `functions.ts` concentra tipos, constantes
e helpers (`Die`, `HistoryItem`, `NarrationMessage`, `DICE`, `TURN_ORDER`,
`SCOREBOARD_ROWS`, `randomDieResult`, `isAiPromptsEmpty`). `style.scss`
mantém só o layout da página (`__header`/`__header-actions`/
`__session-button`, `__workspace`, `__story-grid`, `__response-row`/
`__response-box`, `__actions`) e a família compartilhada `.platform-modal`
(overlay/painel/close/heading/field/error/footer — usada por
`DiceRoller`, `SettingsModal`, `ImageShareModal` e `ImagePreviewModal`).

## Início de sessão e narração por IA

O feed de narração começa vazio pedindo pra apertar o botão **Iniciar**
no header (`NarrationPanel`, estado vazio). `sessionActive` é derivado
de `narrationMessages.length > 0` — não é um estado à parte. Os dois
botões do header (`.platform-page__session-button--play`/`--stop`)
alternam com base nele:

- **Iniciar** (`playSession`) só faz algo se não há sessão ativa nem
  chamada em andamento; chama `startSession()`, que pede uma cena de
  abertura via `callAi()`.
- **Encerrar** (`stopSession`) só faz algo se há sessão ativa e nada em
  andamento; limpa `narrationMessages` na hora e apaga o documento
  salvo (`clearNarrationSession`, ver seção de retomar sessão abaixo) —
  sem confirmação, é uma ação direta.

Com a sessão parada, a caixa de resposta fica desabilitada (placeholder
"Aperte iniciar pra começar a sessão...").

`callAi(historySoFar, apiMessages)` é o ponto único que fala com a IA:
busca `aiPrompts` e `aiProviderConfig` do usuário (`actions/get/
settings.ts` — este segundo só pra checar se existe token e dar um
aviso cedo, sem gastar uma chamada) e chama `narrate()` (`actions/ai/
narrate.ts`), que invoca a Cloud Function `narrate` (ver seção
"Backend" abaixo) — sem token salvo, mostra um aviso e abre o
`SettingsModal` em vez de tentar chamar. Enquanto a chamada está em
andamento, `narrating` desabilita a caixa de resposta e os dois botões
de sessão, e troca o ícone de enviar por um spinner
(`.platform-page__spinner`).

Depois que a sessão começou, cada mensagem normal do jogador
(`submitResponse`) também dispara `continueNarration`, que reenvia o
histórico inteiro de `narrationMessages` pra `callAi` — mapeando quem
falou "Narrador" pro papel `assistant` e todo o resto pro papel `user`.
Não há corte de histórico: sessões muito longas vão mandar (e pagar
por) uma conversa cada vez maior a cada rodada; isso ainda não tem
limite.

Todas as chamadas usam sempre `aiPrompts.narration` como regra de
sistema — os prompts de batalha/duelo/quadribol/encerramento existem
em Configurações mas ainda não têm nenhum gatilho que troque pra eles
(ex. detectar que a cena virou um duelo). Isso é um próximo passo.

### Retomar sessão (pausa automática) e encerrar (botão stop)

Enquanto a sessão está ativa, o feed inteiro (`narrationMessages`) fica
salvo na coleção `narration_sessions` do Firestore, um documento por
personagem (id do documento == `character.id`). Isso funciona como uma
"pausa automática": toda vez que a IA termina de responder, `callAi`
(`index.tsx`) chama `saveNarrationSession` (`actions/sets/
narration-session.ts`) com o feed atualizado; ao entrar na página (ou
trocar de personagem ativo), um `useEffect` chama `getNarrationSession`
(`actions/get/narration-session.ts`) e, se houver algo salvo, substitui
o feed vazio por ele — dando pra fechar o navegador (ou abrir de outro
aparelho, bastando logar com a mesma conta e ter o personagem
selecionado) e continuar de onde parou.

O botão **Encerrar** do header (`stopSession`) apaga esse documento
(`clearNarrationSession`, mesmo arquivo de `saveNarrationSession`) e
zera `narrationMessages` na hora — depois disso `sessionActive` vira
`false`, o feed volta ao estado vazio e o botão troca de volta pra
**Iniciar**. Como é por personagem e não por navegador/cookie, não há
isolamento por aparelho: só existe uma sessão por personagem por vez, e
ela é sobrescrita inteira a cada resposta da IA (`setDoc` sem merge) até
ser encerrada. Ainda não há nada automático que sugira encerrar (ex.
sessões muito longas) — decidir o que fazer com isso, junto do aviso de
não ter corte de histórico em `continueNarration` logo abaixo, é um
próximo passo.

### Contexto da campanha

Junto do prompt de sistema, `callAi` também manda o resultado de
`buildCampaignContext(activeCharacter)` (`actions/ai/context.ts`) —
sem personagem ativo, esse bloco fica vazio e a IA narra só com o
prompt configurado. Esse contexto junta três coisas, cada uma buscada
por sua própria action:

- **Ficha do personagem** — nome/casa/ano, `atributos` e `habilidades`
  (feitiços e maestria; os ids de feitiço são resolvidos pra nome via
  `getSpells()`, a mesma busca usada em `pages/feiticos`).
- **NPCs** — todo mundo com `character_type: "npc"`
  (`getNpcCharacters()`, já existia). Não há um campo de relação
  direta entre personagem e NPC no Firestore hoje, então manda todos.
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
  prompts de IA no Firestore e chama `onRequireSetup` (o pai abre o
  modal) se eles vierem vazios ao entrar na página.
- **`image-share-modal/`** — formulário "cole o link da imagem".
  Totalmente controlado pelo pai.
- **`image-preview-modal/`** — visualização em tela cheia de uma imagem.
  Controlado pelo pai via `src` (vazio = fechado).
- **`scoreboard/`** — placar de status dos personagens (já existia antes
  desta reorganização).
