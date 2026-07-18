// src/components/sidebar/index.tsx
import { Link, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { SIDEBAR_ITEMS } from "./functions";
import "./style.scss";

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__items">
        {SIDEBAR_ITEMS.map(({ key, icon: Icon, path, label }) => (
          <Link
            key={key}
            to={path}
            title={label}
            className={`sidebar__item${pathname.startsWith(path) ? " sidebar__item--active" : ""}`}
          >
            <Icon size={16} />
          </Link>
        ))}
      </div>

      <button className="sidebar__settings" title="Configurações" aria-label="Configurações">
        <Settings size={20} />
      </button>
    </aside>
  );
}
