// src/pages/livraria/index.tsx
import { useState, type CSSProperties } from "react";
import { BOOKS, type Book } from "./functions";
import BookDetailModal from "./components/book-detail-modal";
import "./style.scss";

export default function Livraria() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  return (
    <div className="livraria-page">
      <div className="livraria-page__heading">
        <h1>Floreios e Borrões</h1>
        <p>As regras da mesa, encadernadas — cada livro é a regra que a IA já segue pra narrar.</p>
      </div>

      <div className="livraria-page__shelf">
        {BOOKS.map((book) => {
          const Icon = book.icon;

          return (
            <button
              key={book.id}
              type="button"
              className="livraria-page__book"
              style={{ "--book-accent-rgb": book.accent } as CSSProperties}
              onClick={() => setSelectedBook(book)}
            >
              <span className="livraria-page__book-icon">
                <Icon size={26} strokeWidth={1.6} />
              </span>
              <span className="livraria-page__book-title">{book.title}</span>
              <span className="livraria-page__book-author">por {book.author}</span>
            </button>
          );
        })}
      </div>

      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
}
