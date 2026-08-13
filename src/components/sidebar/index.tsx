import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";
import { logout } from "@/actions/auth/session";
import { NAV_ITEMS } from "@/services/routes";
import { useCharacter } from "@/context/character";
import { cx, initials } from "@/utils";
import { isActivePath, MOBILE_SIDEBAR_BREAKPOINT, readStoredCollapsed, SIDEBAR_COLLAPSED_STORAGE_KEY } from "./functions";
import "./style.scss";

/**
 * Abaixo de `MOBILE_SIDEBAR_BREAKPOINT` o sidebar deixa de ocupar espaço
 * fixo na tela (nem em modo "só ícones") — vira uma gaveta escondida por
 * padrão, destravada por uma navbar fixa no topo (`__mobile-topbar`, só
 * hambúrguer + marca) que existe só nesse breakpoint. Acima dele, continua
 * o comportamento de sempre: coluna fixa, alternando entre rótulos e só
 * ícones pelo botão de seta (`collapsed`, persistido).
 */
export default function Sidebar() {
  const { pathname } = useLocation();
  const { activeCharacter } = useCharacter();
  const name = activeCharacter?.name ?? "Tomas Black";
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [isNarrow, setIsNarrow] = useState(
    () => window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT}px)`).matches
  );
  // Gaveta mobile aberta/fechada — não persiste, cada carregamento da
  // página no celular começa fechada (sidebar fora da tela).
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Comunica a largura pro grid do .app-shell (App.scss) via CSS custom
  // property, já que a coluna do sidebar é definida lá fora, não aqui.
  // Abaixo do breakpoint mobile a largura reservada é sempre 0 — o
  // sidebar vira uma gaveta em `position: fixed` (ver style.scss), não
  // disputa coluna nenhuma do grid.
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT}px)`);

    function updateWidth() {
      const narrow = query.matches;
      setIsNarrow(narrow);
      document.documentElement.style.setProperty("--sidebar-width", narrow ? "0px" : collapsed ? "90px" : "240px");
    }

    updateWidth();
    query.addEventListener("change", updateWidth);
    return () => query.removeEventListener("change", updateWidth);
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, []);

  // Trocar de rota fecha a gaveta sozinha — sem isso, navegar por um link
  // deixava o menu aberto por cima da página seguinte até o jogador
  // lembrar de fechar manualmente.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const toggleLabel = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <>
      {isNarrow && (
        <div className="sidebar__mobile-topbar">
          <button
            type="button"
            className="sidebar__mobile-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="sidebar__mobile-topbar-brand">potter-pg</span>
        </div>
      )}

      {isNarrow && drawerOpen && (
        <div
          className="sidebar__mobile-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cx("sidebar", collapsed && "sidebar--collapsed", isNarrow && drawerOpen && "sidebar--mobile-open")}
      >
        {isNarrow && (
          <button
            type="button"
            className="sidebar__mobile-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <X size={16} />
          </button>
        )}

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
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        </div>
      </aside>
    </>
  );
}
