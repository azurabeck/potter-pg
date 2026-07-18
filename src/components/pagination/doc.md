# Pagination

Paginação numérica reutilizável (ex.: grade de feitiços, futuramente
inventário, adversários, etc).

## Props

| prop          | tipo                     | descrição                        |
| ------------- | ------------------------ | --------------------------------- |
| `currentPage` | `number`                 | página atual (1-indexed)          |
| `totalPages`  | `number`                 | total de páginas                  |
| `onChange`    | `(page: number) => void` | chamado ao trocar de página       |
