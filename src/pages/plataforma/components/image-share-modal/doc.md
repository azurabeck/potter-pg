# ImageShareModal

Formulário "cole o link da imagem" da página `Plataforma`. Totalmente
controlado pelo pai (`pages/plataforma/index.tsx`) — `isOpen`,
`urlValue` e `error` vivem lá, porque a imagem de preview pode falhar
ao carregar e precisa reabrir este formulário com uma mensagem de erro
(ver `ImagePreviewModal`), e porque o Esc global da página fecha este
form junto com os outros overlays.

`onSubmit` valida a URL (precisa começar com `http://`/`https://`),
adiciona o item em `history` e abre o `ImagePreviewModal` — tudo isso
acontece em `handleImageSubmit`, no pai.
