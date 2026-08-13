// src/context/character/index.tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { getCharacterById, getPlayerCharacters } from "@/actions/get/characters";
import { getActiveTableSeat, subscribeToHostInvites } from "@/actions/get/invites";
import { subscribeToUserPresence } from "@/actions/get/presence";
import { PRESENCE_HEARTBEAT_INTERVAL_MS, sendPresenceHeartbeat } from "@/actions/sets/presence";
import type { Character, TableInvite } from "@/utils/types";

const ACTIVE_CHARACTER_STORAGE_KEY = "potter-pg:active-character-id";
// TEMP DEBUG — remover junto com `debugOwnerOverride`/`setDebugOwnerOverride`
// abaixo e o seletor em `CharacterPanel` quando não precisar mais testar as
// permissões de dono da mesa sem uma segunda conta de verdade.
const DEBUG_OWNER_OVERRIDE_STORAGE_KEY = "potter-pg:debug-owner-override";

interface CharacterContextValue {
  characters: Character[];
  activeCharacter: Character | null;
  loading: boolean;
  selectCharacter: (id: string) => void;
  refreshCharacters: () => Promise<void>;
  sheetVisible: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  guestSeat: TableInvite | null;
  guestSeatLoading: boolean;
  tableCharacters: Character[];
  hostUserId: string | null;
  isTableOwner: boolean;
  debugOwnerOverride: string | null;
  setDebugOwnerOverride: (userId: string | null) => void;
  encounterTarget: Character | null;
  setEncounterTarget: (character: Character | null) => void;
  isUserOnline: (userId: string | undefined) => boolean;
}

const CharacterContext = createContext<CharacterContextValue>({
  characters: [],
  activeCharacter: null,
  loading: false,
  selectCharacter: () => {},
  refreshCharacters: async () => {},
  sheetVisible: false,
  showSheet: () => {},
  hideSheet: () => {},
  guestSeat: null,
  guestSeatLoading: false,
  tableCharacters: [],
  hostUserId: null,
  isTableOwner: false,
  debugOwnerOverride: null,
  setDebugOwnerOverride: () => {},
  encounterTarget: null,
  setEncounterTarget: () => {},
  isUserOnline: () => false,
});

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Comeca `true` (em vez de `false`) pra App.tsx nao enxergar, por um
  // instante antes do efeito abaixo rodar, `loading: false` com
  // `characters: []` — o que pareceria "usuario sem nenhuma ficha" e
  // piscaria o wizard de criacao a toa antes da busca real terminar.
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [guestSeat, setGuestSeat] = useState<TableInvite | null>(null);
  const [guestSeatLoading, setGuestSeatLoading] = useState(true);
  const [tableCharacters, setTableCharacters] = useState<Character[]>([]);
  const [encounterTarget, setEncounterTarget] = useState<Character | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  // TEMP DEBUG — ver comentário em DEBUG_OWNER_OVERRIDE_STORAGE_KEY, acima.
  const [debugOwnerOverride, setDebugOwnerOverrideState] = useState<string | null>(() =>
    localStorage.getItem(DEBUG_OWNER_OVERRIDE_STORAGE_KEY)
  );

  function setDebugOwnerOverride(userId: string | null) {
    setDebugOwnerOverrideState(userId);
    if (userId) localStorage.setItem(DEBUG_OWNER_OVERRIDE_STORAGE_KEY, userId);
    else localStorage.removeItem(DEBUG_OWNER_OVERRIDE_STORAGE_KEY);
  }

  // Heartbeat de presença: só existe pra dizer "estou com o app aberto e
  // logado agora" — não tem relação com qual personagem está ativo, por
  // isso depende só de `user` (ver actions/sets/presence.ts pro porquê do
  // intervalo e do porquê de não existir um "avisar que desconectei").
  useEffect(() => {
    if (!user) return;

    sendPresenceHeartbeat(user.uid).catch((error) => console.error("Erro ao enviar heartbeat de presença:", error));
    const interval = setInterval(() => {
      sendPresenceHeartbeat(user.uid).catch((error) => console.error("Erro ao enviar heartbeat de presença:", error));
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCharacters([]);
      setActiveId(null);
      setLoading(false);
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

  // Recarrega a lista sem esperar o efeito acima — usado pelo wizard de
  // criacao de ficha (`pages/character-wizard`) depois de criar a
  // primeira ficha do usuario, pra `characters` deixar de estar vazio e
  // `App.tsx` trocar o wizard pelo resto do app.
  async function refreshCharacters() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getPlayerCharacters(user.uid);
      setCharacters(data);
      const storedId = localStorage.getItem(ACTIVE_CHARACTER_STORAGE_KEY);
      const restored = data.find((c) => c.id === storedId);
      setActiveId((current) => (data.some((c) => c.id === current) ? current : restored?.id ?? data[0]?.id ?? null));
    } catch (err) {
      console.error("Erro ao recarregar personagens:", err);
    } finally {
      setLoading(false);
    }
  }

  function selectCharacter(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, id);
  }

  const activeCharacter = characters.find((c) => c.id === activeId) ?? null;

  // Dono da mesa em que esta sessao esta sentada — o proprio usuario
  // quando anfitriao, ou `guestSeat.hostUserId` quando convidado. Mesmo
  // calculo usado no efeito de `tableCharacters` abaixo; exposto aqui
  // tambem pra quem precisa chamar `syncTableMembers` (botao de
  // atualizar em `CharacterPanel`) sem duplicar a logica.
  const hostUserId = guestSeat?.hostUserId ?? user?.uid ?? null;

  // Dono de verdade é quem NÃO está sentado na mesa de outra pessoa
  // (`!guestSeat`) — só ele pode adicionar players/mudar tipo de
  // narrador (`SettingsModal`). `debugOwnerOverride` (TEMP, ver acima)
  // permite forçar esse valor pra testar as duas visões sem precisar de
  // uma segunda conta logada; `null` (padrão) usa o valor real.
  const isTableOwner = debugOwnerOverride !== null ? debugOwnerOverride === user?.uid : !guestSeat;

  // Convite aceito mais recente pro e-mail do usuario logado, se houver —
  // decide se essa sessao esta "sentada" na mesa de outra pessoa (ver
  // `pages/plataforma`). Fica aqui (em vez de local na Plataforma) pra
  // `tableCharacters`, abaixo, ficar disponivel pro CharacterPanel global
  // mesmo fora daquela pagina.
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setGuestSeat(null);
      setGuestSeatLoading(false);
      return;
    }

    let cancelled = false;
    setGuestSeatLoading(true);
    getActiveTableSeat(email)
      .then((seat) => {
        if (!cancelled) setGuestSeat(seat);
      })
      .catch((error) => {
        console.error("Erro ao verificar convite aceito:", error);
      })
      .finally(() => {
        if (!cancelled) setGuestSeatLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // Quem mais esta na mesma mesa (anfitriao + convidados que ja
  // registraram personagem) — a "lista de amigos" persistente que o
  // CharacterPanel mostra na area do retrato. Escuta os convites do
  // anfitriao (a propria mesa, se for o anfitriao, ou a do `guestSeat`,
  // se for convidado).
  useEffect(() => {
    const hostUid = guestSeat?.hostUserId ?? user?.uid;
    const hostCharacterId = guestSeat?.hostCharacterId ?? activeCharacter?.id;
    if (!hostUid) {
      setTableCharacters([]);
      return;
    }

    return subscribeToHostInvites(hostUid, (invites) => {
      const guestCharacterIds = invites
        .filter((invite) => invite.status === "accepted" && invite.guestCharacterId)
        .map((invite) => invite.guestCharacterId as string);

      const allIds = Array.from(new Set([...(hostCharacterId ? [hostCharacterId] : []), ...guestCharacterIds])).filter(
        (id) => id !== activeCharacter?.id
      );

      if (allIds.length === 0) {
        setTableCharacters([]);
        return;
      }

      Promise.all(allIds.map((id) => getCharacterById(id)))
        .then((data) => {
          setTableCharacters(data.filter((character): character is Character => character !== null));
        })
        .catch((error) => console.error("Erro ao buscar personagens da mesa:", error));
    });
  }, [guestSeat?.hostUserId, guestSeat?.hostCharacterId, user?.uid, activeCharacter?.id]);

  // Um listener de presença por dono de personagem visível (o próprio +
  // quem está na mesa) — string estável (ordenada e sem duplicata) como
  // dependência pra não reassinar tudo a cada nova referência de array
  // que `tableCharacters` recebe (o snapshot de convites acima recria o
  // array mesmo quando o conteúdo não muda de verdade).
  const rosterUserIdsKey = useMemo(() => {
    const ids = [activeCharacter?.user_id, ...tableCharacters.map((character) => character.user_id)].filter(
      (id): id is string => Boolean(id)
    );
    return Array.from(new Set(ids)).sort().join(",");
  }, [activeCharacter?.user_id, tableCharacters]);

  useEffect(() => {
    const userIds = rosterUserIdsKey ? rosterUserIdsKey.split(",") : [];
    if (userIds.length === 0) {
      setOnlineUsers({});
      return;
    }

    const unsubscribes = userIds.map((userId) =>
      subscribeToUserPresence(userId, (online) => {
        setOnlineUsers((current) => ({ ...current, [userId]: online }));
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [rosterUserIdsKey]);

  function isUserOnline(userId: string | undefined): boolean {
    return userId ? (onlineUsers[userId] ?? false) : false;
  }

  return (
    <CharacterContext.Provider
      value={{
        characters,
        activeCharacter,
        loading,
        selectCharacter,
        refreshCharacters,
        sheetVisible,
        showSheet: () => setSheetVisible(true),
        hideSheet: () => setSheetVisible(false),
        guestSeat,
        guestSeatLoading,
        tableCharacters,
        hostUserId,
        isTableOwner,
        debugOwnerOverride,
        setDebugOwnerOverride,
        encounterTarget,
        setEncounterTarget,
        isUserOnline,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  return useContext(CharacterContext);
}
