# SettingsModal

Configurações da sessão: tipo de narrador, IA como jogador (com busca de
NPCs via `getNpcCharacters`), prompts da IA e cadastro de players.

Diferente dos outros modais da `Plataforma`, este é sempre montado pelo
pai (`isOpen` só controla se o JSX visível aparece, via `if (!isOpen)
return null` **depois** dos hooks) — os campos preenchidos (prompts,
players adicionados, NPC selecionado) precisam sobreviver a um
fechar/abrir, exatamente como aconteciam quando isso era um bloco de
JSX condicional dentro de um componente que nunca desmontava.

`onAddPlayer` deixa quem escreve no histórico (`history`) por conta do
pai, já que esse estado é compartilhado com `HistoryPanel`.

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
`checkedInitialPrompts`, um `ref`) se os prompts carregados vierem
vazios (`isAiPromptsEmpty`, `../../functions.ts`) **ou** se não houver
token salvo — o pai (`pages/plataforma/index.tsx`) usa isso pra abrir o
modal sozinho assim que a página carrega, pedindo pra configurar antes
de narrar.

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
