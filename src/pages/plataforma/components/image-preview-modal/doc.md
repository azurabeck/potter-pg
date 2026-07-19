# ImagePreviewModal

Visualização em tela cheia de uma imagem. Controlado pelo pai
(`pages/plataforma/index.tsx`) via `src` (vazio = fechado, mesma regra
do `previewImage` original) — aberto tanto depois de disparar uma
imagem pelo `ImageShareModal` quanto ao clicar numa miniatura no
`HistoryPanel`.

`onError` (imagem não carrega) é responsabilidade do pai: ele fecha
este modal, marca um erro e reabre o `ImageShareModal` com essa
mensagem — por isso não é um estado interno deste componente.
