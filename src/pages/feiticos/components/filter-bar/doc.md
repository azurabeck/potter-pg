# FilterBar

Busca por nome sempre visível + botão de filtro (ícone `Filter`) que
abre/fecha (`open`, estado local) um painel com os dropdowns (Ano,
Nível, Atributo, Categoria, Status). As opções de cada dropdown são
derivadas dos próprios feitiços carregados (`buildFilterOptions`),
exceto "Status", que é fixo (`desbloqueado` / `bloqueado`).

É controlado pelo pai (`pages/feiticos/index.tsx`), que guarda o estado
`SpellFilters` e re-filtra a lista com `applyFilters`.
