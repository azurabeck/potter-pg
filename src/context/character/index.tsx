// src/context/character/index.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { getPlayerCharacters } from "@/actions/get/characters";
import type { Character } from "@/utils/types";

const ACTIVE_CHARACTER_STORAGE_KEY = "potter-pg:active-character-id";

interface CharacterContextValue {
  characters: Character[];
  activeCharacter: Character | null;
  loading: boolean;
  selectCharacter: (id: string) => void;
  sheetVisible: boolean;
  showSheet: () => void;
  hideSheet: () => void;
}

const CharacterContext = createContext<CharacterContextValue>({
  characters: [],
  activeCharacter: null,
  loading: false,
  selectCharacter: () => {},
  sheetVisible: true,
  showSheet: () => {},
  hideSheet: () => {},
});

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(true);

  useEffect(() => {
    if (!user) {
      setCharacters([]);
      setActiveId(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getPlayerCharacters(user.uid)
      .then((data) => {
        if (cancelled) return;
        setCharacters(data);
        const storedId = localStorage.getItem(ACTIVE_CHARACTER_STORAGE_KEY);
        const restored = data.find((c) => c.id === storedId);
        setActiveId(restored?.id ?? data[0]?.id ?? null);
      })
      .catch((err) => {
        console.error("Erro ao carregar personagens:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  function selectCharacter(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, id);
  }

  const activeCharacter = characters.find((c) => c.id === activeId) ?? null;

  return (
    <CharacterContext.Provider
      value={{
        characters,
        activeCharacter,
        loading,
        selectCharacter,
        sheetVisible,
        showSheet: () => setSheetVisible(true),
        hideSheet: () => setSheetVisible(false),
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  return useContext(CharacterContext);
}
