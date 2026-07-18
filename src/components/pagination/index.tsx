// src/components/pagination/index.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageList } from "./functions";
import "./style.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        className="pagination__arrow"
        disabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <button
            key={page}
            className={`pagination__page${page === currentPage ? " pagination__page--active" : ""}`}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination__arrow"
        disabled={currentPage === totalPages}
        onClick={() => onChange(currentPage + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
