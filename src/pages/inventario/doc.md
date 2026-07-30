# Página: Inventário

Layout copiado de um projeto irmão (`potter-spells`, aba "Inventory") —
lista de itens agrupada por categoria à esquerda, busca/filtro/moedas
numa barra lateral à direita. **Só leitura**: sem adicionar, editar ou
excluir item, sem editar moedas — essa aba lá tinha tudo isso, aqui não
tem nada (mesma ressalva de `pages/misterios`/`pages/sessoes`: quem vai
escrever essas mudanças é a IA, ao encerrar uma sessão, ainda não
implementado).

Diferente das outras páginas novas, **não existe nenhuma collection ou
action nova aqui** — os itens e as moedas já vêm de dentro do
personagem carregado (`useCharacter().activeCharacter`), e o tipo
`CharacterItem` (`utils/types.ts`) já batia campo a campo com o item do
projeto de referência, sem precisar de ajuste.

## Fluxo de dados

- Itens: `activeCharacter.inventario.itens` (`CharacterItem[]`),
  filtrados em memória por busca/categoria (`filterItems`,
  `functions.ts`) e agrupados por `categoria` (`groupItemsByCategory`).
- Moedas: `resolveCharacterMoney(activeCharacter)` (`@/utils`,
  compartilhada com `components/character-panel` — mesma tela onde esse
  fallback já existia). **Não é um `??` simples**: o wizard de criação
  grava `dinheiro` já zerado (`{galeoes:0,sicles:0,nuques:0}`) em todo
  personagem novo, e `0` é um valor válido pro `??` — então um fallback
  ingênuo pro legado (`inventario.{goldens,sicles,nuquens}`) nunca
  disparava quando `dinheiro` estava "zerado de propósito" por nunca ter
  sido usado (bug real, visto primeiro em `pages/atributos`, mesma
  causa). `resolveCharacterMoney` decide pelo total de cada lado: só usa
  `dinheiro` se ele tiver algum valor de verdade; senão usa o legado;
  zero nos dois é zero mesmo.

## Componentes

- **`index.tsx`** — layout de duas colunas
  (`grid-template-columns: 1.3fr 320px`, empilha em telas menores):
  lista agrupada + barra lateral (busca, `<select>` de categoria,
  moedas). Clicar num item guarda em `selectedItem` e abre
  `ItemDetailModal`.
- **`components/item-detail-modal/`** — mesmo padrão dos outros modais
  de detalhe do app (overlay-clica-fora-fecha + Escape): nome, categoria,
  quantidade, atributo, valor do atributo, onde encontrou e detalhes —
  os mesmos campos que o `ItemDetailsModal` do projeto de referência
  mostra, só sem o botão "Editar item".
