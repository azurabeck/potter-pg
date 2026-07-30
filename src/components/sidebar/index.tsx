import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { logout } from "@/actions/auth/session";
import { NAV_ITEMS } from "@/services/routes";
import { useCharacter } from "@/context/character";
import { cx, initials } from "@/utils";
import { isActivePath, readStoredCollapsed, SIDEBAR_COLLAPSED_STORAGE_KEY } from "./functions";
import "./style.scss";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { activeCharacter } = useCharacter();
  const name = activeCharacter?.name ?? "Tomas Black";
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  // Comunica a largura pro grid do .app-shell (App.scss) via CSS custom
  // property, já que a coluna do sidebar é definida lá fora, não aqui.
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "90px" : "240px");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  return (
    <aside className={cx("sidebar", collapsed && "sidebar--collapsed")}>
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
        {/* <strong>{name}</strong>
        <span>{"personagem ativo"}</span> */}
      </div>

      <nav className="sidebar__items">
        {NAV_ITEMS.map(({ key, label, path, icon: Icon }) => (
          <Link
            key={key}
            to={path}
            className={cx("sidebar__item", isActivePath(pathname, path) && "sidebar__item--active")}
            title={label}
          >
            <Icon className="sidebar__item-icon" aria-hidden="true" />
            <span className="sidebar__item-label">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <button className="sidebar__logout" onClick={() => logout()}>Sair</button>
        <button
          type="button"
          className="sidebar__collapse-toggle"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>
    </aside>
  );
}
