import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import CharacterPanel from "@/components/character-panel";
import { useAuth } from "@/context/auth";
import Login from "@/pages/login";
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
  const implementedRoutes = NAV_ITEMS.filter(hasElement);

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <div className="app-shell">
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
      <CharacterPanel />
    </div>
  );
}
