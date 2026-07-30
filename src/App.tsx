import type { ComponentType } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import CharacterPanel from "@/components/character-panel";
import InviteBanner from "@/components/invite-banner";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import Login from "@/pages/login";
import CharacterWizard from "@/pages/character-wizard";
import { NAV_ITEMS, ROUTES } from "@/services/routes";
import "./App.scss";

interface ImplementedNavItem {
  key: string;
  path: string;
  element: ComponentType;
}

function hasElement(item: (typeof NAV_ITEMS)[number]): item is (typeof NAV_ITEMS)[number] & ImplementedNavItem {
  return Boolean(item.element);
}

export default function App() {
  const { user, loading } = useAuth();
  const { characters, loading: charactersLoading } = useCharacter();
  const implementedRoutes = NAV_ITEMS.filter(hasElement);
  const location = useLocation();
  // A ficha de personagens já é a própria "folha" do personagem ativo —
  // o painel global (avatar flutuante + sheet) é redundante e sobra por
  // cima do layout full-bleed dessa página, por isso some só aqui.
  const showCharacterPanel = location.pathname !== ROUTES.PERSONAGENS;

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <>
      {/* Por conta, não por personagem — aparece tanto no wizard quanto
          no app normal. `.app-shell`/`.character-wizard-page` usam
          `100vh`, então um convite pendente empurra a página inteira e
          sobra um scroll vertical pequeno — cosmético, não quebra nada. */}
      <InviteBanner />
      {charactersLoading ? null : characters.length === 0 ? (
        // Sem nenhuma ficha de personagem "player" ainda: bloqueia o
        // resto do app até terminar o wizard de criação (cobre tanto
        // quem acabou de se cadastrar quanto um player convidado que
        // loga pela primeira vez).
        <CharacterWizard />
      ) : (
        <div className={showCharacterPanel ? "app-shell" : "app-shell app-shell--no-panel"}>
          <Sidebar />
          <main className="app-shell__content">
            <Routes>
              <Route path="/" element={<Navigate to={ROUTES.FEITICOS} replace />} />
              {implementedRoutes.map(({ key, path, element: Page }) => (
                <Route key={key} path={path} element={<Page />} />
              ))}
              <Route path="*" element={<Navigate to={ROUTES.FEITICOS} replace />} />
            </Routes>
          </main>
          {showCharacterPanel && <CharacterPanel />}
        </div>
      )}
    </>
  );
}
