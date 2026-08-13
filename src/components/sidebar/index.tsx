import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
import { logout } from "@/actions/auth/session";
import { NAV_ITEMS } from "@/services/routes";
import { useCharacter } from "@/context/character";
import { cx, initials } from "@/utils";
import { isActivePath, MOBILE_SIDEBAR_BREAKPOINT, readStoredCollapsed, SIDEBAR_COLLAPSED_STORAGE_KEY } from "./functions";
import "./style.scss";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { activeCharacter } = useCharacter();
  const name = activeCharacter?.name ?? "Tomas Black";
  // `collapsed` (ícones só vs. rótulos, persistido) só faz diferença
  // visual acima de `MOBILE_SIDEBAR_BREAKPOINT` — abaixo disso o menu já
  // é sempre "só ícones" (ver style.scss), então o mesmo botão de seta
  // passa a controlar `mobileHidden` (o menu inteiro escondido, virando
  // só o botão de hambúrguer flutuante) em vez de expandir rótulos, que
  // não caberiam mesmo. Não persiste — cada carregamento da página no
  // celular começa com o menu visível.
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileHidden, setMobileHidden] = useState(false);
  const [isNarrow, setIsNarrow] = useState(
    () => window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT}px)`).matches
  );

  // Comunica a largura pro grid do .app-shell (App.scss) via CSS custom
  // property, já que a coluna do sidebar é definida lá fora, não aqui.
  // Reage tanto às mudanças de estado quanto ao redimensionamento da
  // janela (cruzar o breakpoint sem clicar em nada precisa recalcular a
  // largura certa também).
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT}px)`);

    function updateWidth() {
      const narrow = query.matches;
      setIsNarrow(narrow);
      const width = narrow ? (mobileHidden ? "0px" : "90px") : collapsed ? "90px" : "240px";
      document.documentElement.style.setProperty("--sidebar-width", width);
    }

    updateWidth();
    query.addEventListener("change", updateWidth);
    return () => query.removeEventListener("change", updateWidth);
  }, [collapsed, mobileHidden]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, []);

  // Mesmo botão (seta/hambúrguer) controla coisas diferentes conforme a
  // largura: no desktop, ícones-só vs. rótulos (`collapsed`); no celular,
  // onde já é sempre ícones-só, esconde o menu inteiro (`mobileHidden`).
  function toggleSidebar() {
    if (isNarrow) setMobileHidden((current) => !current);
    else setCollapsed((current) => !current);
  }

  const mobileMenuHidden = isNarrow && mobileHidden;
  const toggleLabel = isNarrow ? (mobileHidden ? "Abrir menu" : "Fechar menu") : collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <aside className={cx("sidebar", collapsed && "sidebar--collapsed", mobileMenuHidden && "sidebar--mobile-hidden")}>
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
          onClick={toggleSidebar}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {mobileMenuHidden ? (
            <Menu size={18} />
          ) : collapsed ? (
            <ChevronsRight size={15} />
          ) : (
            <ChevronsLeft size={15} />
          )}
        </button>
      </div>
    </aside>
  );
}
