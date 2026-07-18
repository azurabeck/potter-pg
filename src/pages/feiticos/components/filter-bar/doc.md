# FilterBar

Busca por nome + dropdowns (Ano, Nível, Atributo, Categoria, Status).
As opções de cada dropdown são derivadas dos próprios feitiços
carregados (`buildFilterOptions`), exceto "Status", que é fixo
(`desbloqueado` / `bloqueado`).

É controlado pelo pai (`pages/feiticos/index.tsx`), que guarda o estado
`SpellFilters` e re-filtra a lista com `applyFilters`.
