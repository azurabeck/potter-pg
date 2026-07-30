// src/pages/livraria/components/book-detail-modal/index.tsx
import { useEffect, type CSSProperties } from "react";
import { X } from "lucide-react";
import { cx } from "@/utils";
import { promptBlocksFor, stripCodeFences, type Book } from "../../functions";
import "./style.scss";

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const Icon = book.icon;
  const isRaw = book.format === "raw";
  const blocks = isRaw ? [] : promptBlocksFor(book);

  return (
    <div className="book-detail-modal" onClick={onClose}>
      <div
        className={cx("book-detail-modal__panel", isRaw && "book-detail-modal__panel--raw")}
        onClick={(event) => event.stopPropagation()}
        style={{ "--book-accent-rgb": book.accent } as CSSProperties}
      >
        <button type="button" className="book-detail-modal__close" aria-label="Fechar" onClick={onClose}>
          <X size={18} />
        </button>

        <header className="book-detail-modal__header">
          <span className="book-detail-modal__icon">
            <Icon size={24} strokeWidth={1.6} />
          </span>
          <div>
            <h2>{book.title}</h2>
            <p>por {book.author}</p>
          </div>
        </header>

        <div className="book-detail-modal__body">
          {isRaw ? (
            <pre className="book-detail-modal__raw">{stripCodeFences(book.content)}</pre>
          ) : (
            blocks.map((block, index) => (
              <section key={index} className="book-detail-modal__block">
                <h3>{block.heading}</h3>
                {block.parts.map((part, partIndex) => {
                  if (part.kind === "list") {
                    return (
                      <ul key={partIndex}>
                        {part.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    );
                  }

                  if (part.kind === "table") {
                    return (
                      <div key={partIndex} className="book-detail-modal__table-wrap">
                        <table>
                          <thead>
                            <tr>
                              {part.headers.map((header, headerIndex) => (
                                <th key={headerIndex}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {part.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  return <p key={partIndex}>{part.value}</p>;
                })}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
