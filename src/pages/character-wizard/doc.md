# CharacterWizard

Wizard de 4 steps pra criar a primeira ficha de personagem "player" do
usuário logado. Não é uma rota comum — é renderizado direto pelo
`App.tsx` no lugar de `Sidebar`/`Routes`/`CharacterPanel` sempre que
`useCharacter().characters.length === 0` (depois de `loading` de auth e
de personagens resolverem), bloqueando o resto do app até a ficha
existir. Cobre dois casos com o mesmo fluxo: quem acabou de criar conta,
e um player convidado pra uma sessão (`SettingsModal`, "Players da
sessão") que loga pela primeira vez sem ficha nenhuma ainda.

## Steps

Estado do formulário inteiro (`WizardState`, `functions.ts`) vive em
`index.tsx`; cada step recebe `state` + `onChange` (o próprio
`setState`, `Dispatch<SetStateAction<WizardState>>`) e edita só a fatia
que lhe interessa. Avançar/voltar é controlado por `step` (índice
0-3); `canAdvance` (calculado a cada render a partir de
`isIdentityStepValid`/`isAttributesStepValid`/`isFinalStepValid`/
`isHouseStepValid`) desabilita o botão até o step atual estar completo.

1. **Identidade** (`components/step-identity`) — nome, HP inicial,
   personalidade, características físicas, história. Não tem seleção de
   ano: todo personagem entra no 1º ano (`STARTING_YEAR`, fixo, sem UI —
   `buildCharacterPayload` usa direto). No lugar do ano, o jogador rola
   1d20 (`rollHp`) pra descobrir o HP inicial; `effectiveHp` aplica o
   piso `HP_MINIMUM` (14) por cima do valor bruto — rolou abaixo disso,
   o texto mostra "tirou X, mínimo 14" mas o HP salvo já vem com o piso
   aplicado. Só vale a primeira rolagem — o botão desabilita assim que
   `state.hpRoll` deixa de ser `null`, sem opção de rolar de novo (senão
   não tem graça). Só nome e ter rolado o HP (`isIdentityStepValid`) são
   obrigatórios pra avançar.

   Ao lado de "Características físicas" tem o painel de imagem do
   personagem: botão **"Gerar imagem do personagem"** (desabilitado até
   preencher características físicas) chama `generateCharacterImage`
   (`actions/ai/generate-character-image.ts` → Cloud Function
   `generateCharacterImage`, mesma `GEMINI_KEY` do teste de seleção) com
   um prompt montado por `buildCharacterImagePrompt` — junta
   características físicas e personalidade (se preenchida) com uma
   instrução fixa ("11 anos, mundo bruxo de Hogwarts, pixar art, plano
   3/4"). Diferente do resto do wizard, essa chamada **não é streaming**:
   a function gera a imagem (base64), sobe pro Storage do próprio projeto
   (bucket default, path `character-images/{uid}/...`) e devolve
   `{ imageUrl }` já como URL pública, pronta pra salvar em `image_url` na
   ficha. Só gera uma vez —
   `state.imageGenerated` trava o botão depois do primeiro sucesso, sem
   opção de regenerar. Colar uma URL manualmente (campo abaixo do botão,
   com a mesma validação de protocolo http/https do `ImageShareModal` da
   Plataforma) é sempre permitido, mesmo depois de já ter gerado — só a
   geração por IA em si é limitada a uma vez, não o campo de imagem
   como um todo.
2. **Atributos e talento** (`components/step-attributes`) — distribui
   `ATTRIBUTE_POINTS_TO_DISTRIBUTE` (5) pontos entre os 19 atributos do
   jogo (`ATTRIBUTE_KEYS`/`ATTRIBUTE_LABELS`, lista completa em
   `functions.ts` — as mesmas chaves que as cartas de varinha/núcleo/
   animal usam nos bônus que concedem, ver seção "Salvando a ficha"),
   cada um começando em `ATTRIBUTE_BASELINE` (0) — só esses 5 pontos
   valem no total, sem piso além de zero; dá pra concentrar tudo num só
   atributo. `pointsRemaining` trava o botão de + quando os 5 pontos
   acabam e o de − quando o atributo jáSORTING_STORY_SYSTEM_PROMPT está no baseline (0). Escolhe
   também 1 dos 5 talentos naturais fixos em `NATURAL_TALENTS` (Voo,
   Mestre das Poções, Criador de Criaturas, O Duelista, Investigador
   Nato) — os bônus contextuais descritos no texto de cada um **não são
   calculados pelo app**, só ficam guardados como `descricao`/`vantagem`
   do talento na ficha (igual à maestria de feitiços/poções: referência
   pro jogador e pra IA narrar em cima, não uma regra mecânica
   automática). A regra "todo d4 de talento tem limite de 3 usos por
   sessão" é só texto de aviso na UI — o app não tem contador de sessão
   pra isso ainda.
3. **Núcleo, varinha e animal** (`components/step-final`) — 3 grupos de
   cartas selecionáveis (`CardGroup`, extraído pra
   `components/card-group` porque step-house também usa), todos
   obrigatórios pra concluir (`isFinalStepValid`). Núcleo
   (`CORE_OPTIONS`, 8 opções) e varinha (`WAND_OPTIONS`, 6 opções) dão
   +1 fixo cada num atributo, cada carta já com `imageUrl` real — as
   duas escolhas juntas viram `Character.varinha` (`{madeira, miolo,
   atributo}`; `atributo` guarda os dois bônus como texto, ex. "+1 de
   Ataque / +1 de Astúcia", já que o tipo só tem um campo `atributo`
   string). Animal (sapo/coruja/gato) também dá +1 fixo, mas ainda sem
   `imageUrl` — cai no fallback de ícone
   (`wizard-step__option-fallback-icon`) até ter uma imagem.
4. **Casa** (`components/step-house`) — dois caminhos, escolhidos num
   menu inicial (`mode`, estado local do componente — só a casa final
   entra em `WizardState`):
   - **Escolher direto**: grid de cartas (`CardGroup` de novo) com as 4
     casas em `HOUSE_OPTIONS` (`functions.ts`), cada uma usando a
     bandeira de `assets/images/*_flag.png` como imagem
     (`HOUSE_FLAGS`).
   - **Fazer teste de seleção**: `components/sorting-story`, uma
     história curta narrada pela IA (não mais perguntas fixas — ver
     seção própria abaixo). Termina mostrando a bandeira da casa
     sugerida — o jogador pode **aceitar** (grava em `state.casa`) ou
     **escolher outra casa** (cai na tela de escolha direta). Nada da
     história em si é salvo na ficha, só a casa final.

### Teste de seleção (história narrada pela IA)

`SortingStory` (`components/sorting-story`) conduz uma história curta
no Beco Diagonal pra decidir a casa, sem perguntas de múltipla escolha
— o jogador digita livremente o que faz a cada cena, e a IA reage e
puxa a próxima cena, igual a uma narração de sessão normal (mesma ideia
de `pages/plataforma`, só que aqui é uma IA fixa do projeto, não a
configurada pelo usuário — ver por quê logo abaixo).

- **Prompt** (`buildSortingStorySystemPrompt`, `functions.ts`): monta o
  texto que instrui a IA a narrar no idioma do local do usuário uma cena
  de iniciação no Beco Diagonal, sempre terminando cada trecho numa
  situação que força uma ação do jogador; deixa explícito que o jogador
  ainda não sabe feitiços (ações só podem ser humanas — conversar,
  ajudar, fugir, mentir etc. — mesmo já tendo varinha); fixa a história
  entre `SORTING_STORY_MIN_TURNS` (7) e `SORTING_STORY_MAX_TURNS` (10)
  ações do jogador; e pede pra IA prestar atenção em **como** o jogador
  reage (não no que ele diz que quer) pra decidir a casa no final. Vira
  função (em vez de string fixa) porque recebe `wandWood`/`wandCore` —
  ver "Consistência da varinha" abaixo.
- **Dados**: uma linha de botões `d4`–`d20` (`DICE`/`randomDieResult`,
  reaproveitados de `pages/plataforma/functions.ts`) acima do campo de
  ação — rolar um não dispara turno nenhum sozinho, só encaixa o
  resultado no início do texto que o jogador está prestes a mandar
  (`rollDie` em `sorting-story/index.tsx`, ex.: "(Rolei 1d20 e tirei 14)
  tento acalmar o coruja"), editável antes de enviar. O prompt instrui a
  IA a usar esse número pra decidir o desfecho da ação, sem virar um
  sistema de regras separado — mesmo espírito dos dados soltos da
  Plataforma (`rollDie` lá também só registra, quem interpreta o
  resultado é sempre quem está narrando).
- **Consistência da varinha**: a varinha (madeira + núcleo) já foi
  escolhida no step anterior (obrigatória pra chegar até aqui, ver
  `isFinalStepValid`) — `step-house/index.tsx` resolve `state.wandId`/
  `state.coreId` contra `WAND_OPTIONS`/`CORE_OPTIONS` e passa os nomes
  pra `SortingStory` (`wandWood`/`wandCore` props), que embute isso no
  prompt: se a história do jogador o levar até a Olivaras e ele sair de
  lá com uma varinha na cena, o prompt exige que seja exatamente essa
  mesma — a IA nunca deve inventar uma varinha diferente da já escolhida
  mecanicamente.
- **Sinal de fim**: a regra mais importante do prompt é que, ao encerrar
  a história (só depois de pelo menos 7 ações), a IA escreva como
  última linha da resposta, sozinha, exatamente `CASA_SUGERIDA: <Nome
  da Casa>`. `extractSuggestedHouse` (`functions.ts`) procura essa linha
  no texto acumulado assim que o streaming de uma resposta termina — se
  achar, tira a linha do texto exibido (o jogador nunca vê o marcador
  cru) e devolve a casa encontrada, que vira o estado `suggested` do
  componente e troca a tela pra aceitar/trocar. Antes disso, é só mais
  uma fala do narrador no feed.
- **Rede de segurança**: se o jogador já completou
  `SORTING_STORY_MAX_TURNS` ações e a IA ainda não encerrou (não seguiu
  a regra), `submitAction` anexa uma instrução extra pedindo o
  encerramento explícito na próxima chamada — não impede a IA de
  ignorar de novo, só aumenta a chance de terminar no prazo.
- **Backend próprio**: `actions/ai/sorting-narrate.ts` chama a Cloud
  Function `sortingNarrate` (`functions/src/index.ts`) — mesmo
  protocolo HTTP + streaming de `narrate`/`actions/ai/narrate.ts` (ver
  doc do `plataforma`, seção "Backend"), mas **sem** ler token de
  provedor do Firestore por usuário: usa direto a `GEMINI_KEY` do
  ambiente da function (`process.env.GEMINI_KEY`, carregada de
  `functions/.env` — não o `.env` da raiz, que é só pro Vite/client;
  precisa copiar o valor pros dois arquivos separadamente, ver
  `functions/.env.example`). Faz sentido porque, nesse ponto do fluxo,
  o usuário ainda nem tem personagem — não daria pra depender de um
  provedor configurado em Configurações (que também só existe depois de
  ter personagem).

## Salvando a ficha

`buildCharacterPayload` (`functions.ts`) monta o objeto pronto pra
`createPlayerCharacter` (`actions/sets/characters.ts`, novo — só cria,
ainda não tem update): soma os bônus de varinha, núcleo e animal
escolhidos em cima dos atributos distribuídos (`atributos[card.atributo]
+= card.bonus` pra cada um — os bônus das cartas usam as mesmas 19
chaves de `ATTRIBUTE_KEYS`, então sempre caem num atributo que já existe
na lista distribuída no step 2, sem precisar de nenhum tratamento
especial), guarda o talento escolhido em `talentos`, e zera o resto da
ficha (`dinheiro`,
`habilidades`, `inventario.itens`, `pocoes`, `titulos`,
`campaign_ids`, `mystery_ids`) — tudo isso se preenche jogando depois,
não faz parte da criação.

Ao concluir (`submit` em `index.tsx`): chama `createPlayerCharacter`
com `user.uid`, dispara `registerFirstSession` (ver seção própria
abaixo, sem `await` — não trava a conclusão), depois
`refreshCharacters()` (novo em `context/character`) — que recarrega
`characters` do Firestore sem esperar o próximo mount. Isso faz
`App.tsx` enxergar `characters.length > 0` no próximo render e trocar o
wizard pelo app normal automaticamente, sem precisar de navegação
manual nem reload de página.

## Primeira sessão automática (`registerFirstSession`, `index.tsx`)

Quando a casa veio do teste de seleção (`state.sortingStoryTranscript`
preenchido — ver seção "Teste de seleção" acima), essa história vira a
PRIMEIRA SESSÃO registrada do personagem, sozinha, sem nenhum modal nem
clique do jogador: mesmo protocolo de registro de sessão que a
Plataforma usa ao clicar em "Encerrar" (`buildSessionRegistrationPrompt`/
`parseSessionRegistration` e os `apply*` de
`pages/plataforma/functions.ts`, reaproveitados direto — cross-page
import, mesmo padrão de `pages/personagens/functions.ts`), só que
chamado via `sortingNarrate` (a IA fixa do projeto) em vez do
`narrate`/provedor configurado pelo usuário, que nesse ponto do fluxo
ainda nem existe. Escolher a casa direto no card (sem teste) deixa
`sortingStoryTranscript` em `null` — `registerFirstSession` não faz
nada nesse caso, não existe "sessão" nenhuma pra registrar.

Aplica automaticamente o que o fluxo normal já aplica sem aprovação:
maestria de feitiço/poção (tende a ficar vazio — personagem novo não
sabe feitiço nenhum ainda), inventário, dinheiro, adversários
encontrados (`updateCharacterAfterSession`), pontos de casa
(`addHousePoints`, usando o `hostUserId` de `useCharacter()` — o próprio
usuário quando não é convidado de mesa alheia), o evento na campanha do
1º ano (`appendSessionToCampaign`, cria a campanha na hora já que é a
primeira sessão) e vínculo a NPCs já existentes (`linkNpcToCharacter`).
Deixa de fora, de propósito, `mystery_suggestions` e
`npc_creation_suggestions` — no fluxo normal exigem um clique de
aprovação em `EndSessionModal`; sem modal nenhum aqui, ninguém aprovaria
nada, então nunca são criados. Qualquer erro é só `console.error` — a
ficha já foi criada com sucesso antes disso rodar, então nada aqui pode
travar o wizard nem aparecer como falha pro jogador.

## Próximos passos (fora do escopo desta versão)

- Preencher `imageUrl` das cartas de animal em `functions.ts` (varinha e
  núcleo já têm imagem).
- Ligar isso ao status do player na sessão (convidado → criando ficha →
  conectado, mencionado no doc do `plataforma`/`settings-modal`) — hoje
  o wizard não sabe nada sobre convites de sessão, só resolve "logou sem
  ficha, cria uma".
- Editar uma ficha já existente (não só criar a primeira).
