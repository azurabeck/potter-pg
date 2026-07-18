// src/components/navbar/index.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/services/routes";
import { APP_NAME, CURRENT_CHARACTER_STUB } from "@/services/genene_settings";
import { logout } from "@/actions/auth/session";
import { useCharacter } from "@/context/character";
import { NAV_ICONS, isActivePath } from "./functions";
import griffFlag from "@/assets/images/griff_flag.png";
import "./style.scss";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { characters, activeCharacter, loading, selectCharacter, showSheet } = useCharacter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = activeCharacter?.name ?? CURRENT_CHARACTER_STUB.nome;
  const displayCasa = activeCharacter?.casa ?? CURRENT_CHARACTER_STUB.casa;
  const displayAno = activeCharacter?.ano ?? CURRENT_CHARACTER_STUB.ano;
  const displayImage = activeCharacter?.image_url;

  return (
    <header className="navbar">
      <img src={griffFlag} alt="" className="navbar__brand-icon" />
      <Link to="/" className="navbar__brand">
        <span>{APP_NAME}</span>
      </Link>

      <div className="navbar__user" ref={containerRef}>
        <button
          type="button"
          className="navbar__user-toggle"
          onClick={() => {
            setOpen((v) => !v);
            showSheet();
          }}
          aria-expanded={open}
        >
          <ChevronDown size={16} className="navbar__user-caret" />
          {displayImage ? (
            <img src={displayImage} alt={displayName} className="navbar__user-avatar" />
          ) : (
            <div className="navbar__user-avatar">{initials(displayName)}</div>
          )}
          <div className="navbar__user-info">
            <strong>{displayName.toUpperCase()}</strong>
            <span>
              {displayCasa} • {displayAno}º Ano
            </span>
          </div>
        </button>

        {open && (
          <div className="navbar__user-dropdown">
            {loading && <p className="navbar__user-dropdown-empty">Carregando personagens...</p>}
            {!loading && characters.length === 0 && (
              <p className="navbar__user-dropdown-empty">Nenhum personagem encontrado.</p>
            )}
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`navbar__character-item${
                  c.id === activeCharacter?.id ? " navbar__character-item--active" : ""
                }`}
                onClick={() => {
                  selectCharacter(c.id);
                  setOpen(false);
                }}
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="navbar__character-avatar" />
                ) : (
                  <div className="navbar__character-avatar navbar__character-avatar--fallback">
                    {initials(c.name)}
                  </div>
                )}
                <div className="navbar__character-info">
                  <strong>{c.name}</strong>
                  <span>
                    {c.casa} • {c.ano}º Ano
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <button className="navbar__menu-btn" aria-label="Sair" onClick={() => logout()}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
