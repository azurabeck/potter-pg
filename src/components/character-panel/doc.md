# CharacterPanel

Painel vertical fixo à direita de todo o conteúdo (renderizado em
`App.tsx`, dentro do `.app-shell`, como último item da linha —
Sidebar / conteúdo da rota / CharacterPanel).

## Estrutura

- `__portrait-card`: retrato do personagem ativo (`activeCharacter.image_url`,
  com fallback pra `image_url_ano_1`), ou iniciais em bloco quando não
  há nenhuma imagem. Quando há mais gente na mesa (`tableCharacters`,
  `context/character` — anfitrião + convidados que já registraram
  personagem, ver doc do `plataforma`), a área vira `__roster`: uma
  grade com o próprio personagem primeiro e os demais depois, cada um
  com retrato, nome, uma bolinha de status (`__roster-status`,
  `--online` quando `isUserOnline(character.user_id)` do contexto —
  presença de verdade, ver seção "Presença" abaixo) e, pros outros
  (não pro próprio), dois botões: `__roster-remove` (ainda só visual,
  sem ação — tirar alguém da mesa não está implementado) e
  `__roster-goto`, que chama `setEncounterTarget` do contexto pra abrir
  o pedido de encontro na Plataforma (mesmo fluxo que o antigo botão
  "Encontrar"). Como o convite aceito vale pra sempre (ver doc do
  `plataforma`), essa lista funciona como uma lista de amigos: quem
  entra na mesa fica até alguém implementar o `remove`.
- `__sheet-card`:
  - `__identity`: nome do personagem — vira um `<select>` quando o
    usuário tem mais de um personagem (`characters.length > 1`),
    trocando o ativo via `selectCharacter(id)`; com um só personagem,
    mostra o nome fixo. Abaixo, casa + ano.
  - `__money`: galeões/sicles/nuques — vem de `activeCharacter.dinheiro`,
    com fallback pra `activeCharacter.inventario` (`goldens`/`sicles`/
    `nuquens`, nomenclatura antiga usada em parte dos personagens) e por
    fim pro `CURRENT_CHARACTER_STUB`.
  - `__progress-list`: barras de HP e XP (`progressValue`/
    `progressPercent`, `functions.ts` — aceita tanto um número solto
    quanto `{atual, max}` vindo do personagem, com fallback pro stub).
  - `__attributes`: os 6 primeiros atributos de `activeCharacter.atributos`
    (fallback pro stub), com ícone (`getAttributeIcon`) e rótulo
    normalizado (`formatAttributeLabel` — cobre variações de acentuação
    tipo `precisao`/`precisão`).
  - "ver todos os atributos" abre `__attributes-popover` com a lista
    completa. Pode ser fixado (`Pin`/`PinOff`) — quando fixo, vira
    `position: fixed` e vira arrastável pelo header
    (`onPointerDown`/`pointermove`/`pointerup` na janela, classe
    `is-dragging-attributes-panel` no `<body>` durante o arraste).

Sem personagem ativo, tudo cai no `CURRENT_CHARACTER_STUB`
(`services/genene_settings.ts`).

## Responsivo (abaixo de 1050px)

Abaixo de 1050px o `App.tsx` para de reservar a 3ª coluna do grid pro
painel (ver `App.scss`) e o `CharacterPanel` vira uma gaveta fixa que
desliza da direita, controlada por `sheetVisible`/`showSheet`/
`hideSheet` (`context/character`):

- `__mobile-trigger`: botão flutuante (avatar do personagem ativo, ou
  ícone genérico sem foto) fixo no canto inferior direito — só existe
  visualmente nessa faixa de largura. Chama `showSheet()`.
- `__backdrop`: camada escura atrás da gaveta quando aberta; clicar
  nela chama `hideSheet()`.
- `__close`: botão "X" dentro do próprio painel, só visível na mesma
  media query, também chama `hideSheet()`.
- Abaixo de 480px a gaveta ocupa 100% da largura da tela.

Em telas largas (≥1050px) nada disso aparece — o painel volta a ser a
coluna fixa de sempre, independente de `sheetVisible`.
