# TurnOrder

Carrossel da ordem da rodada na página `Plataforma`. Totalmente
autônomo — guarda `activeTurn` como estado local (não é lido por
nenhum outro componente da página) e lê a lista fixa `TURN_ORDER`
(`../../functions.ts`).

Mostra o personagem da rodada anterior/atual/próxima; as setas
(`ChevronLeft`/`ChevronRight`) e os cards laterais avançam/retrocedem
`activeTurn` em ciclo.
