# HistoryPanel

Barra lateral com o histórico da sessão (rolagens de dado, imagens
disparadas, entradas de player) — coluna estreita ao lado do
`NarrationPanel` dentro de `platform-page__story-grid`.

Controlado pelo pai: recebe `items: HistoryItem[]` (o array vive em
`pages/plataforma/index.tsx`, escrito por `DiceRoller`, `ImageShareModal`
e `SettingsModal`) e `onPreview(url)`, chamado ao clicar na miniatura de
um item de imagem — o pai usa isso pra abrir o `ImagePreviewModal`.

Rola pro fim automaticamente sempre que `items` muda.
