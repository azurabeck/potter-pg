// src/components/pagination/functions.ts

/**
 * Gera a lista de "botões" a exibir na paginação, incluindo reticências
 * quando há muitas páginas. Ex.: totalPages=10, current=1 -> [1,2,3,"...",10]
 */
export function buildPageList(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, 2, 3, totalPages]);
  if (current > 1 && current < totalPages) pages.add(current);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];

  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("...");
    result.push(page);
  });

  return result;
}
