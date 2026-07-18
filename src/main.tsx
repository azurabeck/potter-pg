// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/auth";
import { CharacterProvider } from "@/context/character";
import App from "./App";
import "@/assets/styles/global.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CharacterProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CharacterProvider>
    </AuthProvider>
  </StrictMode>
);
