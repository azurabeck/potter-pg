# Plataforma

Página visual da mesa de RPG. `functions.ts` concentra tipos, constantes
e helpers (`Die`, `HistoryItem`, `NarrationMessage`, `DICE`, `TURN_ORDER`,
`SCOREBOARD_ROWS`, `randomDieResult`). `style.scss` mantém só o layout da
página (`__header`, `__workspace`, `__story-grid`, `__response-row`/
`__response-box`, `__actions`) e a família compartilhada `.platform-modal`
(overlay/painel/close/heading/field/error/footer — usada por
`DiceRoller`, `SettingsModal`, `ImageShareModal` e `ImagePreviewModal`).

`index.tsx` só guarda o estado que precisa ser compartilhado entre
componentes ou que o Escape global precisa alcançar diretamente
(`rolledDie`, `isImageFormOpen`, `previewImage`, `imageError`,
`isSettingsOpen`, `history`, `narrationMessages`, estado do placar) — o
resto vive dentro de cada componente de `components/`.

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
  digitados sobrevivam a um fechar/abrir do modal.
- **`image-share-modal/`** — formulário "cole o link da imagem".
  Totalmente controlado pelo pai.
- **`image-preview-modal/`** — visualização em tela cheia de uma imagem.
  Controlado pelo pai via `src` (vazio = fechado).
- **`scoreboard/`** — placar de status dos personagens (já existia antes
  desta reorganização).
