// src/components/navbar/index.tsx
import { Link } from "react-router-dom";
import { APP_NAME } from "@/services/genene_settings";
import { useCharacter } from "@/context/character";
import { initials } from "@/utils";
import "./style.scss";

export default function Navbar() {
  const { characters, activeCharacter, selectCharacter, showSheet } = useCharacter();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span>{APP_NAME}</span>
      </Link>

      <div className="navbar__user">
        <div className="navbar__user-toggle">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.name}
              className={`navbar__character-item${
                c.id === activeCharacter?.id ? " navbar__character-item--active" : ""
              }`}
              onClick={() => {
                selectCharacter(c.id);
                showSheet();
              }}
            >
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="navbar__character-avatar" />
              ) : (
                <div className="navbar__character-avatar navbar__character-avatar--fallback">
                  {initials(c.name)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
