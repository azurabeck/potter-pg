# SettingsModal

Configurações da sessão: tipo de narrador, quem mais participa (IA como
NPC ou outros jogadores da mesa), prompts da IA e cadastro de players.

## Tipo de narrador e "Quem mais participa?" — estado levantado pro pai

`narratorMode`/`companionMode`/`selectedAiCharacter`/`selectedParticipantIds`
**não** são estado local deste componente — são props controladas por
`pages/plataforma/index.tsx`, porque `playSession`/`submitResponse` lá
precisam saber disso pra decidir se chamam a IA ou esperam o narrador
digitar (ver `GroupSession`, `utils/types.ts`, e a doc do `plataforma`,
seção "Sessão em grupo narrada por humano"). Continuam sobrevivendo a um
fechar/abrir do modal do mesmo jeito de sempre — só que agora é o pai
quem nunca desmonta essa parte do estado, não este componente.

`companionMode` (só existe com `narratorMode === "human"`) é um dos três:
`"none"` (só o narrador, ninguém mais), `"ai"` (a IA joga um NPC — UI
funcional, `selectedAiCharacter` guardado, mas **não** wireado em lugar
nenhum ainda: escolher um NPC aqui não faz ele agir sozinho) ou
`"players"` (outros jogadores da mesa — esse sim totalmente funcional,
ver `startGroupSession` na doc do `plataforma`). Em `"players"`, a lista
de seleção (`onlineTableCharacters` = `tableCharacters` filtrado por
`isUserOnline(character.user_id)`, `context/character`) só mostra quem
está online **agora**; escolher ninguém e apertar Iniciar equivale a
`"none"` (ver `playSession` no pai).

## Dono da mesa: quem pode mudar o quê

`isTableOwner` (`useCharacter()`) — `true` quando esta sessão **não**
está sentada na mesa de outra pessoa (é a própria mesa). Só o dono pode:
- Mudar "Tipo de narrador" e "Quem mais participa?" (fieldsets
  `platform-settings__radios`/`platform-settings__radios--column`,
  `disabled={!isTableOwner}` — dimming em `style.scss`, `:disabled`; o
  select de NPC e cada checkbox de participante também levam
  `disabled={!isTableOwner}` individualmente, por estarem fora do
  fieldset).
- Adicionar players (form "Players da sessão" — input/botão desabilitados
  e `addPlayer` tem um early-return redundante pra quem não é dono).

Convidados continuam liberados pra tudo o resto do modal (provedor/token
de IA — cada um narra com o próprio, ver seção abaixo). Essa é uma
restrição só de UI: não existem regras de segurança do Firestore neste
repositório (ver seção "Persistência..." abaixo) impedindo um cliente
adulterado de chamar `createInvite`/`startGroupSession` diretamente —
pra valer de verdade contra isso, precisaria de regra no console do
Firebase checando `request.auth.uid == hostUserId`.

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
