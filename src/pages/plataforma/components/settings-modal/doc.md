# SettingsModal

Configurações da sessão: tipo de narrador, IA como jogador (com busca de
NPCs via `getNpcs`, coleção `npcs`), prompts da IA e cadastro de players.

Diferente dos outros modais da `Plataforma`, este é sempre montado pelo
pai (`isOpen` só controla se o JSX visível aparece, via `if (!isOpen)
return null` **depois** dos hooks) — os campos preenchidos (prompts,
players adicionados, NPC selecionado) precisam sobreviver a um
fechar/abrir, exatamente como aconteciam quando isso era um bloco de
JSX condicional dentro de um componente que nunca desmontava.

`onAddPlayer` deixa quem escreve no histórico (`history`) por conta do
pai, já que esse estado é compartilhado com `HistoryPanel`.

## Players da sessão: nome vs. convite de verdade

`addPlayer` decide pelo formato do valor digitado (`EMAIL_PATTERN`,
regex simples): sem `@`, é só um nome — entra na lista visual local
(`players`) e no histórico via `onAddPlayer`, exatamente como sempre
funcionou, sem tocar no Firestore. Com `@`, chama `createInvite`
(`actions/sets/invites.ts`) usando `user.uid` e `activeCharacter`
(`useCharacter()`) como anfitrião — sem personagem ativo (não deveria
acontecer, a Plataforma já exige um), mostra `inviteError` em vez de
tentar. Ver a doc do `plataforma`, seção "Mesa compartilhada", pra como
esse convite vira o convidado entrando na mesa depois — o convidado
narra com a própria configuração de IA (precisa preencher os campos
desta seção também), não a de quem convidou.

## Persistência dos prompts e do provedor/token de IA

`aiPrompts` e `aiProviderConfig` (provedor escolhido + token do usuário
naquele provedor) são as partes deste modal que persistem no Firestore
— coleção `settings` (`services/genene_settings.ts`), um documento por
usuário (id do documento == `uid`). Ao montar, um único efeito busca os
dois em paralelo (`getAiPrompts` + `getAiProviderConfig`,
`actions/get/settings.ts`); "Salvar configurações" (`saveAndClose`)
grava os dois em paralelo (`saveAiPrompts` + `saveAiProviderConfig`,
`actions/sets/settings.ts`, `setDoc(..., {merge:true})` — cria o
documento na primeira vez, atualiza nas seguintes).

`onRequireSetup` é chamado uma única vez (controlado por
`checkedInitialPrompts`, um `ref`) se não houver token salvo — o pai
(`pages/plataforma/index.tsx`) usa isso pra abrir o modal sozinho assim
que a página carrega, pedindo pra configurar antes de narrar. Os
prompts em si **não** entram nessa checagem: cada campo já parte de um
ruleset padrão embutido (`services/ai_prompt_defaults.ts`, sempre
aplicado por `buildNarrationPrompt`/`buildClosingPrompt` em
`../../functions.ts`) — o que fica salvo em `aiPrompts` aqui é só regra
**adicional**, opcional, por cima desse padrão.

**Token fica em texto puro no Firestore.** Isso só é seguro se as regras
de segurança do Firestore restringirem a coleção `settings` pra cada
documento só poder ser lido/escrito pelo próprio dono
(`request.auth.uid == resource.id` ou equivalente); essas regras vivem
no console do Firebase, fora deste repositório.

Este modal ainda busca o token client-side (`getAiProviderConfig`), mas
só pra checar `apiKey` antes de deixar narrar (evita uma chamada
frustrada e mostra um aviso claro). A chamada de IA em si não usa mais
esse valor: a Cloud Function `narrate` (`functions/src/index.ts`) lê o
token direto do Firestore com o Admin SDK, server-side — o token não
viaja mais pra fora do navegador a cada narração. Ver a doc do
`plataforma` (seção "Backend") pra como isso funciona.
