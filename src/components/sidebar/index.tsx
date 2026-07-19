import { Link, useLocation } from "react-router-dom";
import { logout } from "@/actions/auth/session";
import { NAV_ITEMS } from "@/services/routes";
import { useCharacter } from "@/context/character";
import { initials } from "@/utils";
import { isActivePath } from "./functions";
import "./style.scss";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { activeCharacter } = useCharacter();
  const name = activeCharacter?.name ?? "Tomas Black";

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <strong>potter-pg</strong>
        <span>beta</span>
      </div>

      <div className="sidebar__profile">
        {activeCharacter?.image_url ? (
          <img src={activeCharacter.image_url} alt={name} />
        ) : (
          <div className="sidebar__avatar-fallback">{initials(name)}</div>
        )}
        <strong>{name}</strong>
        <span>{"personagem ativo"}</span>
      </div>

      <nav className="sidebar__items">
        {NAV_ITEMS.map(({ key, label, path }) => (
          <Link
            key={key}
            to={path}
            className={`sidebar__item${isActivePath(pathname, path) ? " sidebar__item--active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <button className="sidebar__logout" onClick={() => logout()}>Sair</button>
    </aside>
  );
}
