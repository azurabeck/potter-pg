# Página: Feitiços

Lista os feitiços cadastrados na coleção `spells` do Firestore em forma
de grade de cartas, com busca, filtros e paginação.

## Fluxo de dados

1. `getSpells()` (`actions/get/spells.ts`) busca todos os documentos da
   coleção `spells`, ordenados por `attributes.ano_letivo`.
2. `FilterBar` filtra a lista em memória (`applyFilters`), a partir dos
   filtros de busca/ano/nível/atributo/categoria/status.
3. `paginateSpells` fatia o resultado filtrado em páginas de tamanho
   dinâmico (`pageSize`, ver seção "Grade de tamanho dinâmico" abaixo).
4. Slots da página sem feitiço correspondente são preenchidos com
   `LockedSlot` (placeholder vazio, só o ícone de cadeado).
5. Clicar em um `SpellCard` guarda o feitiço em `selectedSpell` (estado
   local da página) e abre `SpellDetailModal` com os detalhes completos;
   fechar o modal limpa `selectedSpell`.

## Grade de tamanho dinâmico

Em vez de uma quantidade fixa de cards por página, `feiticos-page__grid`
ocupa a altura restante da tela (`flex: 1` dentro de um `.feiticos-page`
em coluna com `height: 100%`) e um `ResizeObserver` mede suas dimensões
reais pra calcular quantas colunas e linhas completas cabem sem cortar
nenhum card (`calculateGridMetrics`, em `functions.ts`) — usa o mesmo
`CARD_TARGET_WIDTH`/`CARD_ASPECT_RATIO`/`GRID_GAP` que o `spell-card`
usa (`aspect-ratio: 100/139`). O número de colunas vira o
`grid-template-columns` inline do grid (`repeat(${columns}, minmax(0, 1fr))`);
colunas × linhas vira `pageSize`, usado por `paginateSpells`/
`totalPages`/`emptySlotsCount` (que agora recebe `columns`, não
`pageSize`, pra saber quantos `LockedSlot` faltam pra fechar a última
linha). Ao redimensionar a janela (ou mudar os filtros), tudo é
recalculado e a página volta pra 1.

`SPELLS_PAGE_SIZE_FALLBACK` (`services/genene_settings.ts`) é só o valor
inicial usado antes do primeiro `ResizeObserver` medir o espaço real.

## Bloqueado vs. desbloqueado

`isSpellLocked` (em `utils/index.ts`) calcula `locked`, usado tanto pelo
`SpellCard` quanto pelo `SpellDetailModal`: desbloqueado quando o
personagem ativo (`useCharacter().activeCharacter`) tem uma entrada em
`habilidades` cuja chave é o id do feitiço (mesmo id do documento na
coleção `spells` — é assim que o Firestore registra quais feitiços o
personagem já aprendeu). Sem personagem ativo, cai na regra antiga
(`attributes.required` vs `CURRENT_CHARACTER_STUB.nivel_geral`). Quando
bloqueado, a imagem usada é `attributes.image_url`; quando desbloqueado,
`attributes.card_image_url`.

## Estrutura de arquivos

```
feiticos/
├── index.tsx        // página (fetch + estado + composição + ResizeObserver)
├── functions.ts      // paginação + calculateGridMetrics
├── style.scss
├── doc.md
└── components/
    ├── filter-bar/         // busca + dropdowns
    ├── spell-card/          // tile só com a imagem (bloqueada/desbloqueada)
    ├── spell-detail-modal/  // modal com os detalhes completos, aberto ao clicar num spell-card
    └── locked-slot/         // placeholder de slot vazio
```
