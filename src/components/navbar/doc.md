# Navbar

> ⚠️ **Não é renderizado em lugar nenhum no momento.** `App.tsx` monta
> `Sidebar`, o conteúdo da rota e `CharacterPanel`, mas não `<Navbar />`.
> O componente continua aqui, completo e funcional, só falta decidir se
> ele volta a ser usado ou se pode ser removido — não montei ele de
> volta sozinho porque isso mudaria o layout atual da aplicação.

Cabeçalho com a marca "Potter-PG" e uma tira com o retrato de cada
personagem de tipo `player` do usuário logado
(`useCharacter().characters`).

Clicar em um retrato chama `selectCharacter(id)` (troca o personagem
ativo em todo o app) e `showSheet()` (mostraria o `CharacterPanel` de
novo, caso ele tivesse um jeito de ser escondido — ver observação no
`doc.md` do `context/character`). Cada retrato ocupa a altura cheia do
`Navbar`. Personagens não-ativos ficam dessaturados/escurecidos
(`filter: grayscale/brightness`); o ativo aparece em cor cheia com
borda vermelha. Hover clareia e levanta a imagem.

Não recebe props.
