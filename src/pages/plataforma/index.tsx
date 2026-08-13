import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Footprints, ImagePlus, Loader2, PanelTop, Play, Send, Settings, Square, Users, X } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { getAiPrompts, getAiProviderConfig } from "@/actions/get/settings";
import { getNarrationSessionOnce, subscribeToNarrationSession } from "@/actions/get/narration-session";
import { subscribeToHostInvites } from "@/actions/get/invites";
import { subscribeToMyEncounter, subscribeToPendingEncounters } from "@/actions/get/encounters";
import { subscribeToGroupSession } from "@/actions/get/group-session";
import { getCharacterMysteries } from "@/actions/get/mysteries";
import { getSpells } from "@/actions/get/spells";
import { getPotions } from "@/actions/get/potions";
import { getNpcs } from "@/actions/get/npcs";
import { getEnemies } from "@/actions/get/enemies";
import { clearNarrationSession, saveNarrationSession } from "@/actions/sets/narration-session";
import { recordGuestCharacter } from "@/actions/sets/invites";
import { createEncounter, respondToEncounter } from "@/actions/sets/encounters";
import { endGroupSession, startGroupSession } from "@/actions/sets/group-session";
import { updateCharacterAfterSession } from "@/actions/sets/characters";
import { addHousePoints } from "@/actions/sets/table";
import { appendSessionToCampaign } from "@/actions/sets/campaigns";
import { applyMysterySuggestion } from "@/actions/sets/mysteries";
import { createNpcFromSuggestion, linkNpcToCharacter } from "@/actions/sets/npcs";
import { narrate, type NarrateMessage } from "@/actions/ai/narrate";
import { buildCampaignContext } from "@/actions/ai/context";
import type { Character, Encounter, GroupSession } from "@/utils/types";
import ScoreboardPanel from "./components/scoreboard";
import TurnOrder from "./components/turn-order";
import NarrationPanel from "./components/narration-panel";
import HistoryPanel from "./components/history-panel";
import DiceRoller from "./components/dice-roller";
import SettingsModal, { type CompanionMode } from "./components/settings-modal";
import ImageShareModal from "./components/image-share-modal";
import ImagePreviewModal from "./components/image-preview-modal";
import EncounterModal from "./components/encounter-modal";
import EndSessionModal, { type EndSessionPhase } from "./components/end-session-modal";
import {
  applyAdversaryEncounters,
  applyInventoryUpdates,
  applyMoneyUpdate,
  applyPotionMasteryUpdates,
  applySpellMasteryUpdates,
  buildClosingPrompt,
  buildNarrationPrompt,
  buildSessionRegistrationPrompt,
  buildTranscriptText,
  parseSessionRegistration,
  randomDieResult,
  splitKnownNpcs,
} from "./functions";
import type { Die, EndSessionSummary, HistoryItem, NarrationMessage, RolledDie, SessionRegistration } from "./functions";
import "./style.scss";

export default function Plataforma() {
  const { user } = useAuth();
  const {
    activeCharacter,
    tableCharacters,
    guestSeat,
    guestSeatLoading,
    hostUserId,
    encounterTarget,
    setEncounterTarget,
  } = useCharacter();
  const playerName = activeCharacter?.name?.trim() || "Tomas Black";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [narrating, setNarrating] = useState(false);
  // Narração humana (SettingsModal, "Tipo de narrador") — levantado pra cá
  // porque `playSession`/`submitResponse` precisam saber disso pra decidir
  // se chamam a IA ou esperam o narrador digitar. Ver GroupSession abaixo
  // pro caso "outros jogadores da mesa".
  const [narratorMode, setNarratorMode] = useState<"ai" | "human">("ai");
  const [companionMode, setCompanionMode] = useState<CompanionMode>("none");
  const [selectedAiCharacter, setSelectedAiCharacter] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null);
  const [rolledDie, setRolledDie] = useState<RolledDie | null>(null);
  const [isImageFormOpen, setIsImageFormOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [responseText, setResponseText] = useState("");
  const [narrationMessages, setNarrationMessages] = useState<NarrationMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isScoreboardPinned, setIsScoreboardPinned] = useState(false);
  const [scoreboardPosition, setScoreboardPosition] = useState({ x: 0, y: 0 });
  const scoreboardDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const [myEncounter, setMyEncounter] = useState<Encounter | null>(null);
  const [pendingEncounters, setPendingEncounters] = useState<Encounter[]>([]);
  const [encounterLocation, setEncounterLocation] = useState("");
  const [encounterError, setEncounterError] = useState("");
  const [encounterSubmitting, setEncounterSubmitting] = useState(false);
  const [respondingEncounterId, setRespondingEncounterId] = useState<string | null>(null);

  // Clicar em "Encerrar" com um rascunho não enviado na caixa de resposta
  // não deve descartar essa última fala — fica `true` enquanto `stopSession`
  // manda o rascunho (esperando a IA responder, se for o caso) antes de
  // efetivamente abrir o fluxo de encerramento. Ver `sendResponseText`.
  const [pendingEndSession, setPendingEndSession] = useState(false);
  const [endSessionPhase, setEndSessionPhase] = useState<EndSessionPhase>(null);
  const [endSessionSummaries, setEndSessionSummaries] = useState<EndSessionSummary[]>([]);
  const [endSessionError, setEndSessionError] = useState<string | null>(null);
  // `true` quando a fase "error" é especificamente "não tem token de IA
  // configurado" (`chooseEndSessionScope`/`endGroupSessionAsNarrator`/
  // `closeMyGroupSessionParticipation`, abaixo) — troca o botão "Tentar
  // novamente" do EndSessionModal por "Abrir Configurações". Antes esse
  // caso fechava o modal na hora e só avisava com uma fala no feed da
  // narração — fácil de passar despercebido (parecia que o modal "sumia
  // sem mostrar nada"), então agora fica explícito dentro do próprio
  // modal, sem fechar sozinho.
  const [endSessionNeedsSetup, setEndSessionNeedsSetup] = useState(false);
  // Guarda a última tentativa de encerramento (`chooseEndSessionScope`,
  // `endGroupSessionAsNarrator` ou `closeMyGroupSessionParticipation`, já
  // fechadas sobre os próprios argumentos) — é o que o botão "Tentar
  // novamente" da fase "error" chama. `() => fn` (em vez de `fn` direto)
  // porque `useState` trata um valor função como updater; precisa da
  // função-que-devolve-a-função pra guardar a função em si como estado.
  const [retryEndSession, setRetryEndSession] = useState<(() => void) | null>(null);
  const [registration, setRegistration] = useState<SessionRegistration | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  // Transcript usado na tentativa de registro mais recente — permite o
  // botão "Tentar novamente" ao lado de `registrationError` (dentro dos
  // resultados já mostrados) repetir só `runSessionRegistration`, sem
  // precisar gerar o resumo em prosa de novo.
  const lastRegistrationMessagesRef = useRef<NarrationMessage[]>([]);
  const [appliedMysterySuggestions, setAppliedMysterySuggestions] = useState<Set<number>>(new Set());
  const [applyingMysteryIndex, setApplyingMysteryIndex] = useState<number | null>(null);
  const [appliedNpcSuggestions, setAppliedNpcSuggestions] = useState<Set<number>>(new Set());
  const [applyingNpcIndex, setApplyingNpcIndex] = useState<number | null>(null);

  // O pedido de encontro (botão "ir até" do CharacterPanel) só define o
  // alvo no contexto global — zera o formulário do EncounterModal aqui
  // toda vez que o alvo mudar.
  useEffect(() => {
    setEncounterLocation("");
    setEncounterError("");
  }, [encounterTarget]);

  // Sessão em grupo ativa nesta mesa (narrada por um humano, ver
  // GroupSession em utils/types.ts) — mesmo `hostUserId` de
  // `tableCharacters`/`subscribeToTable` (o próprio, ou o de quem
  // convidou). `null` quando não há nenhuma (documento apagado ao
  // encerrar).
  useEffect(() => {
    if (!hostUserId) {
      setGroupSession(null);
      return;
    }
    return subscribeToGroupSession(hostUserId, setGroupSession);
  }, [hostUserId]);

  // Este personagem faz parte da sessão em grupo ativa (é o narrador ou
  // foi selecionado como participante)? Decide `effectiveCharacterId`
  // abaixo e se esta sessão é "narrada por humano" pro resto da página.
  const isGroupParticipant =
    !!groupSession &&
    (groupSession.narratorCharacterId === activeCharacter?.id ||
      groupSession.participantCharacterIds.includes(activeCharacter?.id ?? ""));

  // Sou eu quem narra a sessão em grupo ativa? Sem sessão em grupo,
  // "narrador" é sempre o próprio dono da sessão que está narrando (não
  // tem outro lado pra comparar) — só passa a ser `false` quando outra
  // pessoa é o narrador de uma sessão em grupo da qual eu participo.
  const isNarratorOfActiveSession = !isGroupParticipant || groupSession?.narratorUserId === user?.uid;

  // Esta sessão é narrada por um humano de verdade — nunca chama IA
  // durante a rodada (`submitResponse`/`regenerateLastMessage` abaixo)?
  // `narratorMode` sozinho não basta: é estado local de CADA cliente
  // (`SettingsModal`), então o valor de quem está participando (não
  // narrando) continua no padrão "ai" mesmo estando numa sessão em grupo
  // alheia — só `narratorMode === "human"` reflete a escolha de quem
  // narra. `isGroupParticipant`, em compensação, só existe quando
  // alguém (o dono da mesa) de fato criou uma sessão em grupo humana —
  // então basta estar nela, seja como narrador ou participante, pra já
  // valer "sem IA durante o jogo" independente do que este cliente tem
  // marcado em Configurações.
  const isHumanNarratedSession = isGroupParticipant || narratorMode === "human";

  // Cada player usa a própria configuração de IA (token/prompts) — sentar
  // na mesa de alguém não empresta as configurações do anfitrião. As
  // histórias já são independentes por padrão (cada um vive a própria)
  // e só convergem quando um pedido de encontro é aceito (trocando
  // `effectiveCharacterId` pra `myEncounter.sharedCharacterId`, ver seção
  // "Encontros" abaixo) ou quando o dono da mesa inicia uma sessão em
  // grupo da qual este personagem participa (`groupSession.sharedSessionId`)
  // — nenhum dos dois afeta de quem são as configurações.
  const effectiveCharacterId =
    myEncounter?.sharedCharacterId ??
    (isGroupParticipant ? groupSession?.sharedSessionId : null) ??
    activeCharacter?.id ??
    null;

  // Escuta em tempo real o feed de narração do personagem "efetivo"
  // (a sessão compartilhada de um encontro aceito ou de uma sessão em
  // grupo, ou a do próprio personagem, por padrão): um documento por
  // personagem no Firestore — qualquer um que salvar uma resposta nova
  // (`saveNarrationSession`) atualiza o feed de todo mundo que estiver
  // escutando o mesmo id, sem reload (ver `subscribeToNarrationSession`).
  // Streaming chunk a chunk continua só local pra quem disparou a
  // chamada — os outros só veem a resposta pronta, quando ela é salva no
  // final. Troca de personagem/encontro sempre zera o feed local antes de
  // escutar a sessão nova, pra não misturar sessões.
  useEffect(() => {
    setNarrationMessages([]);
    setSessionActive(false);
    if (guestSeatLoading || !effectiveCharacterId) return;

    return subscribeToNarrationSession(effectiveCharacterId, (messages) => {
      setNarrationMessages(messages);
      if (messages.length > 0) setSessionActive(true);
    });
  }, [effectiveCharacterId, guestSeatLoading]);

  // Sessão em grupo: fica "ativa" assim que o narrador cria o documento
  // (ou assim que um participante detecta que entrou nela), mesmo com o
  // feed ainda vazio — diferente do modo IA, aqui não existe uma "cena de
  // abertura" automática, quem escreve a primeira fala é o narrador. Só
  // LIGA `sessionActive`, nunca desliga (isso é papel do efeito acima, ao
  // trocar de `effectiveCharacterId`, e de `stopSession`/`endGroupSession`
  // ao encerrar de propósito).
  useEffect(() => {
    if (isGroupParticipant) setSessionActive(true);
  }, [isGroupParticipant]);

  // Espelha `narrationMessages` num ref, sempre — serve só de "última
  // foto" pro efeito logo abaixo, porque no momento em que ele roda (a
  // sessão em grupo acabou de ser apagada) o feed já pode ter voltado a
  // apontar pra sessão individual (vazia) deste personagem, e nesse ponto
  // o `narrationMessages` (estado) já não teria mais o transcript real.
  const lastNarrationMessagesRef = useRef<NarrationMessage[]>([]);
  useEffect(() => {
    lastNarrationMessagesRef.current = narrationMessages;
  }, [narrationMessages]);

  // Detecta "eu participava (não como narrador) de uma sessão em grupo, e
  // ela acabou de ser encerrada pelo narrador" — dispara o registro DESTE
  // personagem, sozinho, no próprio cliente (ver
  // `closeMyGroupSessionParticipation` acima da declaração de
  // `chooseEndSessionScope`, mais abaixo no arquivo). Guardado num ref (em
  // vez de dependência do efeito) porque só precisamos do valor "de
  // antes" no instante em que `groupSession` muda — não deve disparar de
  // novo por conta própria.
  const previousGroupSessionRef = useRef<GroupSession | null>(null);
  useEffect(() => {
    const previous = previousGroupSessionRef.current;
    previousGroupSessionRef.current = groupSession;

    const wasParticipantNotNarrator =
      previous &&
      activeCharacter &&
      previous.narratorCharacterId !== activeCharacter.id &&
      previous.participantCharacterIds.includes(activeCharacter.id);

    if (wasParticipantNotNarrator && !groupSession) {
      closeMyGroupSessionParticipation(lastNarrationMessagesRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSession]);

  // Convite aceito sem personagem registrado ainda (ex: aceitou durante
  // o wizard de criação) — assim que a ficha existir, grava
  // guestUserId/guestCharacterId no convite, pra aparecer na lista de
  // "Na mesa" de todo mundo (roster do CharacterPanel).
  useEffect(() => {
    if (!guestSeat || !user || !activeCharacter || guestSeat.guestCharacterId === activeCharacter.id) return;
    recordGuestCharacter(guestSeat.id, guestSeat.hostUserId, user.uid, activeCharacter.id, playerName).catch((error) => {
      console.error("Erro ao registrar personagem na mesa:", error);
    });
  }, [guestSeat, user, activeCharacter, playerName]);

  // Encontro aceito envolvendo o próprio personagem (de qualquer um dos
  // dois lados) — é o que decide `effectiveCharacterId` acima.
  useEffect(() => {
    if (!activeCharacter?.id) {
      setMyEncounter(null);
      return;
    }
    return subscribeToMyEncounter(activeCharacter.id, setMyEncounter);
  }, [activeCharacter?.id]);

  // Pedidos de encontro pendentes endereçados a este usuário — mostrados
  // como um pequeno aviso acima do feed (ver JSX).
  useEffect(() => {
    if (!user?.uid) {
      setPendingEncounters([]);
      return;
    }
    return subscribeToPendingEncounters(user.uid, setPendingEncounters);
  }, [user?.uid]);

  // Escuta em tempo real os convites que este usuário criou como
  // anfitrião — mantém a tag "(usuário convidado)"/"(convidado aceito)"
  // de cada item "join" do HistoryPanel atualizada assim que o
  // convidado responder, sem polling.
  useEffect(() => {
    if (!user?.uid) return;

    return subscribeToHostInvites(user.uid, (invites) => {
      setHistory((current) =>
        current.map((item) => {
          if (item.type !== "join" || !item.inviteId) return item;
          const match = invites.find((invite) => invite.id === item.inviteId);
          return match && match.status !== item.inviteStatus ? { ...item, inviteStatus: match.status } : item;
        })
      );
    });
  }, [user?.uid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setRolledDie(null);
      setIsImageFormOpen(false);
      setPreviewImage("");
      setImageError("");
      setIsSettingsOpen(false);
      if (!isScoreboardPinned) setIsScoreboardOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isScoreboardPinned]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!scoreboardDragRef.current || !isScoreboardPinned) return;

      // `panelWidth`/`panelHeight` são só uma estimativa (o painel tem
      // altura fluida, e a largura real vem de `min(375px, 100vw - 30px)`
      // no CSS pra caber em telas estreitas, ver style.scss) — o
      // `Math.max(15, ...)` no limite direito/inferior é o que garante o
      // clamp de verdade: em telas menores que o painel (mobile), o
      // limite "innerWidth - panelWidth - 15" fica negativo, e sem esse
      // piso o `Math.min` escolheria esse valor negativo, jogando o
      // painel pra fora da tela pela esquerda/topo ao arrastar.
      const panelWidth = 375;
      const panelHeight = 320;
      const maxX = Math.max(15, window.innerWidth - panelWidth - 15);
      const maxY = Math.max(15, window.innerHeight - panelHeight - 15);
      const x = Math.min(Math.max(15, event.clientX - scoreboardDragRef.current.offsetX), maxX);
      const y = Math.min(Math.max(15, event.clientY - scoreboardDragRef.current.offsetY), maxY);
      setScoreboardPosition({ x, y });
    }

    function handlePointerUp() {
      scoreboardDragRef.current = null;
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isScoreboardPinned]);

  function toggleScoreboardPin() {
    setIsScoreboardPinned((current) => {
      const next = !current;
      if (next) {
        // Mesma estimativa de tamanho do clamp de arrastar, acima — em
        // telas estreitas (mobile), `window.innerWidth - width` fica
        // negativo, e o `Math.max(15, ...)` garante que a posição inicial
        // nunca comece fora da tela pela esquerda. `y` ganha o mesmo
        // cuidado (antes sempre 112.5, fixo, podendo empurrar o painel
        // pra baixo da tela numa viewport baixa).
        const width = 375;
        const height = 320;
        setScoreboardPosition({
          x: Math.max(15, window.innerWidth - width - 42.5),
          y: Math.max(15, Math.min(112.5, window.innerHeight - height - 15)),
        });
      }
      return next;
    });
  }

  function startScoreboardDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isScoreboardPinned) return;
    scoreboardDragRef.current = {
      offsetX: event.clientX - scoreboardPosition.x,
      offsetY: event.clientY - scoreboardPosition.y,
    };
    document.body.style.userSelect = "none";
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function rollDie(sides: Die["sides"]) {
    const result = randomDieResult(sides);
    setRolledDie({ sides, result });
    setHistory((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "dice", user: playerName, sides, result },
    ]);
  }

  // Narração humana (`isHumanNarratedSession`, solo ou em grupo): nunca
  // chama IA — só anexa a fala e salva. Quem está narrando de verdade
  // entra como "Narrador" (mesmo sentinela que o resto do app já usa pra
  // reconhecer a fala do narrador, ver `NarrationMessage`); os demais
  // participantes entram com o próprio nome, exatamente como uma rodada
  // normal apareceria — a diferença é só que ninguém aqui dispara a IA.
  // Extraído do handler de submit do formulário (`submitResponse`, abaixo)
  // pra ser reaproveitado por `stopSession`: clicar em "Encerrar" com um
  // rascunho não enviado na caixa de resposta manda essa última fala
  // primeiro (esperando a IA responder, se for o caso) antes de abrir o
  // encerramento de verdade — ver `pendingEndSession`.
  async function sendResponseText(text: string): Promise<void> {
    if (isHumanNarratedSession) {
      const authorName = isNarratorOfActiveSession ? "Narrador" : playerName;
      const message: NarrationMessage = { id: crypto.randomUUID(), user: authorName, text };
      const nextMessages = [...narrationMessages, message];
      setNarrationMessages(nextMessages);
      if (effectiveCharacterId) {
        try {
          await saveNarrationSession(effectiveCharacterId, nextMessages);
        } catch (error) {
          console.error("Erro ao salvar a sessão:", error);
        }
      }
      return;
    }

    const playerMessage: NarrationMessage = { id: crypto.randomUUID(), user: playerName, text };
    const nextMessages = [...narrationMessages, playerMessage];
    setNarrationMessages(nextMessages);
    await continueNarration(nextMessages);
  }

  function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (narrating || !sessionActive || pendingEndSession) return;
    const text = responseText.trim();
    if (!text) return;
    setResponseText("");
    sendResponseText(text);
  }

  // Narrador IA: pede a cena de abertura (`startSession`, chama a IA).
  // Narrador humano: não chama IA nenhuma — o narrador escreve a primeira
  // fala manualmente (`submitResponse`, acima). Com "outros jogadores da
  // mesa" selecionados, cria a sessão em grupo primeiro
  // (`startGroupSession`) — os participantes entram sozinhos assim que
  // detectam `isGroupParticipant` (ver efeito acima), sem precisar aceitar
  // nada (já são gente conhecida, online, escolhida a dedo pelo narrador).
  async function playSession() {
    if (narrating || sessionActive || !activeCharacter || !user) return;
    setNarrationMessages([]);

    if (narratorMode === "human") {
      setSessionActive(true);
      if (companionMode === "players" && selectedParticipantIds.length > 0 && hostUserId) {
        try {
          await startGroupSession(hostUserId, user.uid, activeCharacter.id, selectedParticipantIds);
        } catch (error) {
          console.error("Erro ao iniciar a sessão em grupo:", error);
        }
      }
      return;
    }

    setSessionActive(true);
    startSession();
  }

  // Sessão em grupo: sem pergunta de escopo (o transcript já é um só,
  // compartilhado) — encerra direto (`endGroupSessionAsNarrator`). Sessão
  // normal: só abre a pergunta de escopo (só eu / mesa inteira) — a
  // chamada de IA em si só acontece depois que o usuário escolhe, em
  // `chooseEndSessionScope`. Numa sessão em grupo, só o narrador pode
  // encerrar (os demais não têm como decidir isso pelo resto da mesa).
  function stopSession() {
    if (narrating || !sessionActive || pendingEndSession) return;
    if (isGroupParticipant && !isNarratorOfActiveSession) return;

    // Tem rascunho não enviado na caixa de resposta: manda essa última fala
    // primeiro (esperando a IA responder, se a sessão for narrada por IA —
    // `sendResponseText` só resolve depois disso) e só então segue pro
    // encerramento de verdade, pra não descartar o que o usuário escreveu.
    const draft = responseText.trim();
    if (draft) {
      setResponseText("");
      setPendingEndSession(true);
      sendResponseText(draft).finally(() => {
        setPendingEndSession(false);
        proceedToStopSession();
      });
      return;
    }

    proceedToStopSession();
  }

  function proceedToStopSession() {
    if (isGroupParticipant) {
      endGroupSessionAsNarrator();
      return;
    }
    setEndSessionPhase("confirm");
  }

  // Refaz a última fala do Narrador: descarta ela do feed e repete a
  // mesma chamada que a gerou (abertura ou rodada normal — o resumo de
  // encerramento não entra mais no feed, ver EndSessionModal). Não existe
  // pra sessão narrada por humano — não tem o que "regenerar", o narrador
  // já escreveu a fala do próprio jeito.
  function regenerateLastMessage() {
    if (narrating || !sessionActive || isHumanNarratedSession) return;
    const lastMessage = narrationMessages[narrationMessages.length - 1];
    if (!lastMessage || lastMessage.user !== "Narrador") return;

    const historySoFar = narrationMessages.slice(0, -1);
    setNarrationMessages(historySoFar);

    if (historySoFar.length === 0) {
      startSession();
    } else {
      continueNarration(historySoFar);
    }
  }

  function addNarratorMessage(text: string) {
    setNarrationMessages((current) => [...current, { id: crypto.randomUUID(), user: "Narrador", text }]);
  }

  // Busca o prompt/token de IA e chama narrate() — usado pra abrir a sessão
  // e continuar a narração a cada mensagem do jogador (o resumo de
  // encerramento tem seu próprio fluxo, `chooseEndSessionScope`, abaixo,
  // porque cobre vários personagens de uma vez). `historySoFar` é o feed
  // visível *antes* dessa resposta (sem a fala do Narrador que vai ser
  // gerada agora) — serve só pra montar o que vai ser salvo em
  // `narration_sessions` quando a IA terminar; `apiMessages` é o que de
  // fato vai pro provedor de IA.
  async function callAi(historySoFar: NarrationMessage[], apiMessages: NarrateMessage[]) {
    if (!user) return;

    setNarrating(true);
    try {
      const [prompts, providerConfig] = await Promise.all([
        getAiPrompts(user.uid),
        getAiProviderConfig(user.uid),
      ]);

      if (!providerConfig.apiKey) {
        addNarratorMessage(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra narrar."
        );
        setIsSettingsOpen(true);
        return;
      }

      const basePrompt = buildNarrationPrompt(prompts);
      const campaignContext = activeCharacter ? await buildCampaignContext(activeCharacter) : "";
      const systemPrompt = [basePrompt, campaignContext].filter(Boolean).join("\n\n");

      const narratorMessageId = crypto.randomUUID();
      let hasReceivedText = false;
      let fullText = "";

      await narrate({ systemPrompt, messages: apiMessages }, (chunk) => {
        fullText += chunk;
        if (!hasReceivedText) {
          hasReceivedText = true;
          setNarrationMessages((current) => [
            ...current,
            { id: narratorMessageId, user: "Narrador", text: chunk },
          ]);
        } else {
          setNarrationMessages((current) =>
            current.map((message) =>
              message.id === narratorMessageId ? { ...message, text: message.text + chunk } : message
            )
          );
        }
      });

      if (!hasReceivedText) {
        addNarratorMessage("A IA respondeu vazio.");
      } else if (effectiveCharacterId) {
        // Pausa o jogo: salva o feed no Firestore assim que a IA termina de
        // responder, pra dar pra retomar a sessão de qualquer aparelho.
        const narratorMessage: NarrationMessage = { id: narratorMessageId, user: "Narrador", text: fullText };
        saveNarrationSession(effectiveCharacterId, [...historySoFar, narratorMessage]).catch((error) => {
          console.error("Erro ao salvar a sessão:", error);
        });
      }
    } catch (error) {
      addNarratorMessage(`A IA não conseguiu responder: ${(error as Error).message}`);
    } finally {
      setNarrating(false);
    }
  }

  function startSession() {
    return callAi([], [
      { role: "user", content: `Inicie a sessão para ${playerName} com uma cena de abertura envolvente.` },
    ]);
  }

  // Manda o histórico inteiro da conversa a cada rodada, mapeando "Narrador"
  // pro papel assistant e todo o resto pro papel user — em sessões muito
  // longas isso cresce o custo/tamanho da chamada; não há corte por enquanto.
  function continueNarration(messagesSoFar: NarrationMessage[]) {
    return callAi(
      messagesSoFar,
      messagesSoFar.map((message) => ({
        role: message.user === "Narrador" ? "assistant" : "user",
        content: message.text,
      }))
    );
  }

  function closeEndSessionModal() {
    setEndSessionPhase(null);
    setEndSessionSummaries([]);
    setEndSessionError(null);
    setEndSessionNeedsSetup(false);
    setRetryEndSession(null);
    setRegistration(null);
    setRegistrationError(null);
    setAppliedMysterySuggestions(new Set());
    setAppliedNpcSuggestions(new Set());
  }

  // Botão "Abrir Configurações" da fase "error" quando `endSessionNeedsSetup`
  // — fecha o modal de encerramento (não faz sentido os dois abertos ao
  // mesmo tempo) e abre Configurações no lugar dele.
  function openSettingsFromEndSession() {
    closeEndSessionModal();
    setIsSettingsOpen(true);
  }

  // Gera a atualização estruturada (maestria de feitiço/poção, inventário,
  // dinheiro, histórico de campanha, NPCs vinculados, sugestões de
  // mistério/NPC novo) e já aplica tudo na ficha, EXCETO mistérios e NPCs
  // novos (só depois de aprovado, ver `approveMysterySuggestion`/
  // `approveNpcSuggestion`) — vincular um NPC já existente é automático
  // (ver REGISTRO DE NPCs em buildSessionRegistrationPrompt), criar um
  // NPC do zero não. Tudo isso só pro próprio personagem, nunca pros
  // outros da mesa: escrever na ficha de outra pessoa a partir da própria
  // sessão não é algo que a mesa deveria permitir — fronteira de
  // segurança/permissão que vale inclusive pra sessão em grupo (ver
  // `closeMyGroupSessionParticipation` abaixo: cada participante roda essa
  // função no PRÓPRIO cliente, nunca o narrador rodando ela pelos outros).
  // `sessionMessages` por padrão é o feed carregado agora (`narrationMessages`),
  // mas aceita um snapshot explícito — necessário pro caso de grupo, onde o
  // feed pode já ter sido trocado/zerado por outro efeito no instante em
  // que isso roda (ver comentário no efeito de auto-encerramento).
  async function runSessionRegistration(sessionMessages: NarrationMessage[] = narrationMessages): Promise<void> {
    if (!activeCharacter || !user) return;
    lastRegistrationMessagesRef.current = sessionMessages;
    setRegistrationError(null);

    try {
      const [prompts, providerConfig, knownSpells, knownPotions, existingMysteries, allNpcs, allEnemies] =
        await Promise.all([
          getAiPrompts(user.uid),
          getAiProviderConfig(user.uid),
          getSpells(),
          getPotions(),
          getCharacterMysteries(activeCharacter.id),
          getNpcs(),
          getEnemies(),
        ]);

      if (!providerConfig.apiKey) return;

      const systemPrompt = [buildSessionRegistrationPrompt(), prompts.closing.trim()].filter(Boolean).join("\n\n");

      const diceRolls = history
        .filter((item): item is Extract<HistoryItem, { type: "dice" }> => item.type === "dice")
        .map((item) => ({ sides: item.sides, result: item.result }));

      const { known: knownNpcs, other: otherNpcs } = splitKnownNpcs(allNpcs, activeCharacter.id);

      const npcNameById = new Map(allNpcs.map((npc) => [npc.id, npc.name]));
      const enemyNameById = new Map(allEnemies.map((enemy) => [enemy.id, enemy.name]));
      const knownAdversaryNames = (activeCharacter.adversarios_conhecidos ?? [])
        .map((adversary) =>
          adversary.tipo === "enemy" ? enemyNameById.get(adversary.id) : npcNameById.get(adversary.id)
        )
        .filter((name): name is string => Boolean(name));

      const payload = {
        character: activeCharacter,
        session_messages: sessionMessages,
        dice_rolls: diceRolls,
        spells: knownSpells.filter((spell) => spell.attributes.ano_letivo <= activeCharacter.ano),
        potions: knownPotions.filter((potion) => potion.ano <= activeCharacter.ano),
        existing_mysteries: existingMysteries,
        known_npcs: knownNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
        other_npcs: otherNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
        all_enemies: allEnemies.map((enemy) => ({ id: enemy.id, name: enemy.name })),
        known_adversaries: knownAdversaryNames,
      };

      let fullText = "";
      await narrate(
        {
          systemPrompt,
          messages: [
            {
              role: "user",
              content: `Dados da sessão encerrada, em JSON:\n${JSON.stringify(payload)}\n\nAnalise e retorne a atualização no formato pedido.`,
            },
          ],
        },
        (chunk) => {
          fullText += chunk;
        }
      );

      const parsed = parseSessionRegistration(fullText);
      setRegistration(parsed);

      await updateCharacterAfterSession(activeCharacter.id, {
        habilidades: applySpellMasteryUpdates(activeCharacter.habilidades, parsed.spell_mastery_updates),
        pocoes: applyPotionMasteryUpdates(activeCharacter.pocoes, parsed.potion_mastery_updates),
        inventario: {
          ...activeCharacter.inventario,
          itens: applyInventoryUpdates(activeCharacter.inventario.itens, parsed.inventory_updates),
        },
        dinheiro: applyMoneyUpdate(activeCharacter.dinheiro, parsed.money_update),
        adversarios_conhecidos: applyAdversaryEncounters(
          activeCharacter.adversarios_conhecidos ?? [],
          parsed.adversary_encounters
        ),
      });

      // Cada escrita daqui pra baixo é independente e não deveria travar
      // as outras — antes, um erro em `appendSessionToCampaign` (ex.: bug
      // de referência de documento) derrubava o `try` inteiro ANTES de
      // chegar nos pontos de casa, então uma sessão com "professor deu 20
      // pontos" narrado ficava sem nenhum ponto somado na mesa, sem nem
      // aparecer erro nenhum sobre isso — só sobre a campanha. Pontos de
      // casa também sobem primeiro, de propósito: é o dado mais "central"
      // do app (Taça das Casas), então tem menos chance de ficar bloqueado
      // por um bug em outro lugar.
      const stepErrors: string[] = [];

      if (parsed.house_points_earned !== 0) {
        try {
          const resolvedHostUserId = guestSeat?.hostUserId ?? user.uid;
          await addHousePoints(resolvedHostUserId, activeCharacter.id, activeCharacter.casa, parsed.house_points_earned);
        } catch (error) {
          stepErrors.push(`pontos de casa: ${(error as Error).message}`);
        }
      }

      if (parsed.session_history.length > 0) {
        try {
          await appendSessionToCampaign(activeCharacter, parsed.session_history);
        } catch (error) {
          stepErrors.push(`histórico de campanha: ${(error as Error).message}`);
        }
      }

      if (parsed.npc_links.length > 0) {
        try {
          await Promise.all(parsed.npc_links.map((link) => linkNpcToCharacter(link.npc_id, activeCharacter.id)));
        } catch (error) {
          stepErrors.push(`vínculo de NPC: ${(error as Error).message}`);
        }
      }

      if (stepErrors.length > 0) setRegistrationError(stepErrors.join(" · "));
    } catch (error) {
      console.error("Erro ao registrar a sessão:", error);
      setRegistrationError((error as Error).message);
    }
  }

  // Botão "Tentar novamente" ao lado de `registrationError`, dentro dos
  // resultados já mostrados (o resumo em prosa já gerou com sucesso, só o
  // registro estruturado falhou) — repete só `runSessionRegistration`,
  // com o mesmo transcript de antes (`lastRegistrationMessagesRef`), sem
  // precisar gerar o resumo de novo nem fechar o modal.
  // Risco conhecido: a IA roda de novo do zero (novo `parsed`), então se
  // ALGUM passo já tinha funcionado na tentativa anterior (ex.: pontos de
  // casa somaram certo, só a campanha falhou), tentar de novo pode somar
  // os pontos uma segunda vez — o registro não é transacional/idempotente
  // entre tentativas. Sem solução fácil sem guardar o que já foi
  // aplicado por sessão; por ora, prefira só clicar em "Tentar novamente"
  // quando o erro mostrado for realmente sobre um passo que não rodou.
  function retryRegistration() {
    runSessionRegistration(lastRegistrationMessagesRef.current);
  }

  async function approveMysterySuggestion(index: number) {
    if (!activeCharacter || !registration) return;
    const suggestion = registration.mystery_suggestions[index];
    if (!suggestion) return;

    setApplyingMysteryIndex(index);
    try {
      await applyMysterySuggestion(activeCharacter, suggestion);
      setAppliedMysterySuggestions((current) => new Set(current).add(index));
    } catch (error) {
      console.error("Erro ao aplicar sugestão de mistério:", error);
    } finally {
      setApplyingMysteryIndex(null);
    }
  }

  async function approveNpcSuggestion(index: number) {
    if (!activeCharacter || !registration) return;
    const suggestion = registration.npc_creation_suggestions[index];
    if (!suggestion) return;

    setApplyingNpcIndex(index);
    try {
      await createNpcFromSuggestion(activeCharacter, suggestion);
      setAppliedNpcSuggestions((current) => new Set(current).add(index));
    } catch (error) {
      console.error("Erro ao criar NPC sugerido:", error);
    } finally {
      setApplyingNpcIndex(null);
    }
  }

  // Gera o resumo em prosa de encerramento de UM personagem — extraído
  // pra ser reaproveitado tanto pelo fluxo normal (`chooseEndSessionScope`,
  // um resumo por integrante do roster) quanto pelo encerramento de uma
  // sessão em grupo (`endGroupSessionAsNarrator`/
  // `closeMyGroupSessionParticipation`, abaixo — cada participante gera o
  // PRÓPRIO resumo, no próprio cliente).
  async function generateClosingSummary(
    character: Character,
    messages: NarrationMessage[],
    basePrompt: string
  ): Promise<string> {
    const campaignContext = await buildCampaignContext(character);
    const systemPrompt = [basePrompt, campaignContext].filter(Boolean).join("\n\n");
    const apiMessages: NarrateMessage[] = [
      ...messages.map((message) => ({
        role: message.user === "Narrador" ? ("assistant" as const) : ("user" as const),
        content: message.text,
      })),
      { role: "user" as const, content: "A sessão foi encerrada. Gere o resumo de encerramento agora." },
    ];

    let fullText = "";
    await narrate({ systemPrompt, messages: apiMessages }, (chunk) => {
      fullText += chunk;
    });
    return fullText || "A IA não gerou um resumo de encerramento.";
  }

  // Escolhido o escopo (só o próprio personagem, ou a mesa inteira), gera
  // um resumo de encerramento SEPARADO por personagem — cada um com sua
  // própria sessão de narração salva (`narration_sessions`, um documento
  // por personagem) e seu próprio contexto de campanha. Quem não tem
  // sessão salva nem chega a chamar a IA: vira `text: null`
  // ("não participou", ver EndSessionModal). Quem participou só tem a
  // sessão encerrada de verdade (Firestore limpo) se a IA conseguiu gerar
  // o resumo — se falhar (`failed: true`), a história continua salva e a
  // sessão do PRÓPRIO personagem (quem clicou em Encerrar) segue ativa,
  // pra dar pra tentar de novo sem perder nada.
  async function chooseEndSessionScope(scope: "self" | "all") {
    if (!activeCharacter || !user) return;
    setEndSessionPhase("loading");

    const roster: Character[] = scope === "all" ? [activeCharacter, ...tableCharacters] : [activeCharacter];

    try {
      const [prompts, providerConfig] = await Promise.all([
        getAiPrompts(user.uid),
        getAiProviderConfig(user.uid),
      ]);

      if (!providerConfig.apiKey) {
        setEndSessionPhase("error");
        setEndSessionError(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra gerar o resumo."
        );
        setEndSessionNeedsSetup(true);
        return;
      }

      const basePrompt = buildClosingPrompt(prompts);

      const summaries = await Promise.all(
        roster.map(async (character): Promise<EndSessionSummary> => {
          const isSelf = character.id === activeCharacter.id;
          const messages = isSelf ? narrationMessages : await getNarrationSessionOnce(character.id);

          if (messages.length === 0) {
            return { characterId: character.id, characterName: character.name, text: null };
          }

          try {
            const text = await generateClosingSummary(character, messages, basePrompt);
            return { characterId: character.id, characterName: character.name, text };
          } catch (error) {
            return {
              characterId: character.id,
              characterName: character.name,
              text: `A IA não conseguiu responder: ${(error as Error).message}`,
              failed: true,
            };
          }
        })
      );

      // Só apaga a sessão de quem teve resumo gerado com sucesso — se a IA
      // falhou pra algum personagem (`failed`), a história narrada dele
      // continua salva no Firestore, senão um erro passageiro da IA
      // custaria a sessão inteira sem nem deixar um resumo de verdade no
      // lugar.
      await Promise.all(
        summaries
          .filter((summary) => summary.text !== null && !summary.failed)
          .map((summary) =>
            clearNarrationSession(summary.characterId).catch((error) => {
              console.error("Erro ao encerrar a sessão:", error);
            })
          )
      );

      const ownSummary = summaries.find((summary) => summary.characterId === activeCharacter.id);
      const ownSummaryFailed = ownSummary?.failed ?? false;

      // Registro estruturado (livro do Kingsley) só roda pro próprio
      // personagem — quem clicou em Encerrar — e só se ele participou de
      // fato da sessão E o resumo dele deu certo (senão arrisca aplicar o
      // registro em cima de uma sessão que, do ponto de vista do
      // Firestore, nem foi encerrada — ver acima).
      if (narrationMessages.length > 0 && !ownSummaryFailed) {
        await runSessionRegistration();
      }

      // Se o resumo do PRÓPRIO personagem falhou, a sessão dele continua
      // ativa (a história não foi pra lugar nenhum) — só marca inativa
      // quando deu tudo certo.
      setSessionActive(ownSummaryFailed ? true : false);
      setEndSessionSummaries(summaries);
      setEndSessionPhase("results");
    } catch (error) {
      setEndSessionPhase("error");
      setEndSessionError((error as Error).message);
      setRetryEndSession(() => () => chooseEndSessionScope(scope));
    }
  }

  // Encerramento de uma sessão em grupo, do lado do NARRADOR — chamado por
  // `stopSession` no lugar da pergunta de escopo (não faz sentido "só eu
  // ou a mesa inteira" aqui, o transcript já é um só, compartilhado).
  // Gera só um resumo em prosa PRA ELE MESMO ver (informativo) — SEM
  // registro estruturado (XP, casa, inventário, campanha): quem narra não
  // viveu a própria história nessa sessão, o registro é de quem foi
  // narrado pra (ver `closeMyGroupSessionParticipation`, cada participante
  // no próprio cliente). Depois apaga os documentos compartilhados
  // (`group_sessions` e `narration_sessions` do `sharedSessionId`).
  async function endGroupSessionAsNarrator() {
    if (!activeCharacter || !user || !groupSession || !hostUserId) return;
    setEndSessionPhase("loading");

    try {
      const [prompts, providerConfig] = await Promise.all([getAiPrompts(user.uid), getAiProviderConfig(user.uid)]);

      if (!providerConfig.apiKey) {
        setEndSessionPhase("error");
        setEndSessionError(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra gerar o resumo."
        );
        setEndSessionNeedsSetup(true);
        return;
      }

      const basePrompt = buildClosingPrompt(prompts);
      const sessionMessages = narrationMessages;
      const text = sessionMessages.length > 0 ? await generateClosingSummary(activeCharacter, sessionMessages, basePrompt) : null;

      await endGroupSession(hostUserId);
      await clearNarrationSession(groupSession.sharedSessionId);

      setSessionActive(false);
      setEndSessionSummaries([{ characterId: activeCharacter.id, characterName: activeCharacter.name, text }]);
      setEndSessionPhase("results");
    } catch (error) {
      setEndSessionPhase("error");
      setEndSessionError((error as Error).message);
      setRetryEndSession(() => endGroupSessionAsNarrator);
    }
  }

  // Lado de cada PARTICIPANTE (não o narrador) de uma sessão em grupo: o
  // narrador encerra a sessão dele (`endGroupSessionAsNarrator`, acima),
  // que apaga o `group_sessions` da mesa — todo cliente que participava
  // detecta isso (`groupSession` vira `null`) e roda esta função sozinho,
  // com a própria conta, gerando o PRÓPRIO resumo/registro (nunca o
  // narrador escrevendo na ficha de outra pessoa — mesma fronteira de
  // permissão do resto do app, ver `runSessionRegistration`). É aqui, não
  // no narrador, que o registro de verdade acontece — campanha, XP, casa
  // e inventário são de quem participou/teve a história narrada, não de
  // quem só narrou. `messages` vem de um snapshot tirado ANTES do feed
  // ser zerado (ver o efeito logo abaixo) — no instante em que isso roda,
  // `narrationMessages` já pode ter voltado a apontar pra sessão
  // individual (vazia) deste personagem. Sempre termina em algum feedback
  // visível (resultado, ou aviso no feed) — nunca falha em silêncio, pra
  // quem estava sendo narrado não ficar sem saber que a sessão acabou.
  async function closeMyGroupSessionParticipation(messages: NarrationMessage[]) {
    if (!activeCharacter || !user || messages.length === 0) return;
    setEndSessionPhase("loading");

    try {
      const [prompts, providerConfig] = await Promise.all([getAiPrompts(user.uid), getAiProviderConfig(user.uid)]);

      if (!providerConfig.apiKey) {
        setEndSessionPhase("error");
        setEndSessionError(
          "O narrador encerrou a sessão em grupo, mas você não tem um token de IA configurado — abra Configurações pra registrar sua participação."
        );
        setEndSessionNeedsSetup(true);
        return;
      }

      const basePrompt = buildClosingPrompt(prompts);
      const text = await generateClosingSummary(activeCharacter, messages, basePrompt);
      await runSessionRegistration(messages);

      setEndSessionSummaries([{ characterId: activeCharacter.id, characterName: activeCharacter.name, text }]);
      setEndSessionPhase("results");
    } catch (error) {
      setEndSessionPhase("error");
      setEndSessionError((error as Error).message);
      setRetryEndSession(() => () => closeMyGroupSessionParticipation(messages));
    }
  }

  function openImageForm() {
    setImageUrlInput("");
    setImageError("");
    setIsImageFormOpen(true);
  }

  function handleImageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = imageUrlInput.trim();

    if (!url) {
      setImageError("Informe o link da imagem.");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      setImageError("Informe um link válido começando com http:// ou https://.");
      return;
    }

    setImageError("");
    setHistory((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "image", user: playerName, imageUrl: url },
    ]);
    setIsImageFormOpen(false);
    setPreviewImage(url);
  }

  async function submitEncounterRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !activeCharacter || !encounterTarget) return;
    const location = encounterLocation.trim();
    if (!location) return;

    setEncounterSubmitting(true);
    setEncounterError("");
    try {
      await createEncounter(
        user.uid,
        activeCharacter.id,
        playerName,
        encounterTarget.user_id,
        encounterTarget.id,
        encounterTarget.name,
        location
      );
      setEncounterTarget(null);
    } catch (error) {
      setEncounterError(`Não foi possível enviar o pedido: ${(error as Error).message}`);
    } finally {
      setEncounterSubmitting(false);
    }
  }

  // Só quem ACEITA o pedido gera a narrativa de convergência — o outro
  // lado (quem pediu) recebe o resultado automaticamente assim que
  // `subscribeToMyEncounter` (dos dois lados) notar que o status virou
  // "accepted" e `effectiveCharacterId` trocar pro `sharedCharacterId`.
  async function respondToEncounterRequest(encounter: Encounter, status: "accepted" | "rejected") {
    setRespondingEncounterId(encounter.id);
    try {
      await respondToEncounter(encounter.id, status);
      if (status === "accepted") await mergeEncounter(encounter);
    } catch (error) {
      console.error("Erro ao responder pedido de encontro:", error);
    } finally {
      setRespondingEncounterId(null);
    }
  }

  // Narra o momento em que os dois personagens se encontram, juntando o
  // que cada um estava vivendo separado, e salva isso como a primeira
  // fala da sessão compartilhada (`sharedCharacterId`) — simplificação:
  // é uma única cena de convergência gerada pela IA, não uma jornada
  // simulada em vários turnos até o encontro de fato acontecer.
  async function mergeEncounter(encounter: Encounter) {
    if (!user || !activeCharacter) return;

    setNarrating(true);
    try {
      const otherCharacterId =
        encounter.fromCharacterId === activeCharacter.id ? encounter.toCharacterId : encounter.fromCharacterId;

      const [prompts, providerConfig, otherMessages] = await Promise.all([
        getAiPrompts(user.uid),
        getAiProviderConfig(user.uid),
        getNarrationSessionOnce(otherCharacterId),
      ]);

      if (!providerConfig.apiKey) {
        addNarratorMessage(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra narrar."
        );
        return;
      }

      const basePrompt = buildNarrationPrompt(prompts);
      const campaignContext = await buildCampaignContext(activeCharacter);
      const systemPrompt = [basePrompt, campaignContext].filter(Boolean).join("\n\n");

      const describeRecent = (messages: NarrationMessage[]) =>
        messages
          .slice(-6)
          .map((message) => `${message.user}: ${message.text}`)
          .join("\n") || "(sem histórico ainda)";

      const myRecent = describeRecent(narrationMessages);
      const otherRecent = describeRecent(otherMessages);
      const fromIsMe = encounter.fromCharacterId === activeCharacter.id;

      const mergeInstruction = `Dois personagens que estavam vivendo cenas separadas agora se encontram em "${encounter.location}".

Cena recente de ${encounter.fromCharacterName}:
${fromIsMe ? myRecent : otherRecent}

Cena recente de ${encounter.toCharacterName}:
${fromIsMe ? otherRecent : myRecent}

Narre o momento em que os dois se encontram em "${encounter.location}", unindo as duas histórias numa cena só a partir de agora.`;

      let fullText = "";
      let hasReceivedText = false;

      await narrate({ systemPrompt, messages: [{ role: "user", content: mergeInstruction }] }, (chunk) => {
        fullText += chunk;
        hasReceivedText = true;
      });

      if (hasReceivedText) {
        const narratorMessage: NarrationMessage = { id: crypto.randomUUID(), user: "Narrador", text: fullText };
        await saveNarrationSession(encounter.sharedCharacterId, [narratorMessage]);
      }
    } catch (error) {
      console.error("Erro ao narrar o encontro:", error);
    } finally {
      setNarrating(false);
    }
  }

  const groupNarratorName =
    isGroupParticipant && !isNarratorOfActiveSession
      ? tableCharacters.find((character) => character.id === groupSession?.narratorCharacterId)?.name ?? "alguém"
      : null;

  // Transcript pronto pro botão "Baixar história (.txt)" do EndSessionModal
  // — a história narrada até agora, disponível em qualquer fase do
  // encerramento (inclusive se der erro no resumo), pra sempre dar pra
  // guardar uma cópia mesmo que a IA falhe. `null` quando não há nada
  // narrado ainda (botão fica escondido, ver EndSessionModal).
  const endSessionTranscript =
    narrationMessages.length > 0 ? buildTranscriptText(playerName, narrationMessages) : null;
  const endSessionTranscriptFileName = `historia-${playerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${new Date().toISOString().slice(0, 10)}.txt`;

  return (
    <section className="platform-page">
      <header className="platform-page__header">
        <h1>
          Plataforma
          {guestSeat && (
            <span className="platform-page__guest-seat">
              <Users size={13} aria-hidden="true" /> Sentado na mesa de {guestSeat.hostName}
            </span>
          )}
          {groupNarratorName && (
            <span className="platform-page__guest-seat">
              <Users size={13} aria-hidden="true" /> Sessão em grupo narrada por {groupNarratorName}
            </span>
          )}
          {myEncounter && (
            <span className="platform-page__guest-seat">
              <Footprints size={13} aria-hidden="true" /> Encontro com{" "}
              {myEncounter.fromCharacterId === activeCharacter?.id
                ? myEncounter.toCharacterName
                : myEncounter.fromCharacterName}{" "}
              em {myEncounter.location}
            </span>
          )}
        </h1>
        <div className="platform-page__header-actions">
          {sessionActive ? (
            <button
              type="button"
              className="platform-page__session-button platform-page__session-button--stop"
              aria-label="Encerrar sessão"
              title={
                isGroupParticipant && !isNarratorOfActiveSession
                  ? "Só o narrador encerra a sessão em grupo"
                  : pendingEndSession
                    ? "Enviando sua última mensagem antes de encerrar..."
                    : "Encerrar sessão"
              }
              onClick={stopSession}
              disabled={narrating || pendingEndSession || (isGroupParticipant && !isNarratorOfActiveSession)}
            >
              {pendingEndSession ? (
                <Loader2 size={16} className="platform-page__spinner" />
              ) : (
                <Square size={16} />
              )}{" "}
              Encerrar
            </button>
          ) : (
            <button
              type="button"
              className="platform-page__session-button platform-page__session-button--play"
              aria-label="Iniciar sessão"
              title="Iniciar sessão"
              onClick={playSession}
              disabled={narrating}
            >
              <Play size={16} /> Iniciar
            </button>
          )}
          <button
            type="button"
            className="platform-page__settings-button"
            aria-label="Abrir configurações da plataforma"
            title="Configurações"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>

      {pendingEncounters.length > 0 && (
        <div className="platform-page__encounter-requests">
          {pendingEncounters.map((encounter) => (
            <div key={encounter.id} className="platform-page__encounter-request">
              <Footprints size={15} aria-hidden="true" />
              <p>
                <strong>{encounter.fromCharacterName}</strong> quer te encontrar em{" "}
                <strong>{encounter.location}</strong>.
              </p>
              <div className="platform-page__encounter-request-actions">
                <button
                  type="button"
                  className="platform-page__encounter-accept"
                  onClick={() => respondToEncounterRequest(encounter, "accepted")}
                  disabled={respondingEncounterId === encounter.id}
                >
                  <Check size={14} /> Aceitar
                </button>
                <button
                  type="button"
                  className="platform-page__encounter-reject"
                  onClick={() => respondToEncounterRequest(encounter, "rejected")}
                  disabled={respondingEncounterId === encounter.id}
                >
                  <X size={14} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="platform-page__workspace">
        <div className="platform-page__story-grid">
          <NarrationPanel
            messages={narrationMessages}
            onRegenerateLast={regenerateLastMessage}
            regenerating={narrating}
          />
          <HistoryPanel items={history} onPreview={setPreviewImage} />
        </div>

        <div className="platform-page__response-row">
          <form className="platform-page__response-box" onSubmit={submitResponse}>
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={
                !sessionActive
                  ? "Aperte iniciar pra começar a sessão..."
                  : pendingEndSession
                    ? "Enviando sua última mensagem antes de encerrar..."
                    : narrating
                      ? "O narrador está escrevendo..."
                      : "Escreva sua ação ou narração..."
              }
              aria-label="Mensagem da rodada"
              disabled={narrating || pendingEndSession || !sessionActive}
            />
            <button
              type="submit"
              disabled={!responseText.trim() || narrating || pendingEndSession || !sessionActive}
              aria-label="Enviar mensagem"
            >
              {narrating ? <Loader2 size={16} className="platform-page__spinner" /> : <Send size={16} />}
              <span>Entrar</span>
            </button>
          </form>
          <div className="platform-page__actions">
            <button type="button" onClick={openImageForm}>
              <ImagePlus size={16} /> Disparar imagem
            </button>
            <div className="platform-scoreboard-anchor">
              <button type="button" onClick={() => setIsScoreboardOpen((current) => !current)}>
                <PanelTop size={16} /> Ver placar
              </button>
              {isScoreboardOpen && !isScoreboardPinned && (
                <ScoreboardPanel
                  pinned={false}
                  onClose={() => setIsScoreboardOpen(false)}
                  onTogglePin={toggleScoreboardPin}
                />
              )}
            </div>
          </div>
        </div>

        <DiceRoller rolledDie={rolledDie} onRoll={rollDie} onCloseResult={() => setRolledDie(null)} />

        <TurnOrder />
      </div>

      {isScoreboardOpen && isScoreboardPinned && (
        <div
          className="platform-scoreboard-floating"
          style={{ left: scoreboardPosition.x, top: scoreboardPosition.y }}
        >
          <ScoreboardPanel
            pinned
            onClose={() => {
              setIsScoreboardOpen(false);
              setIsScoreboardPinned(false);
            }}
            onTogglePin={toggleScoreboardPin}
            onDragStart={startScoreboardDrag}
          />
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onAddPlayer={(item) => setHistory((current) => [...current, item])}
        onRequireSetup={() => setIsSettingsOpen(true)}
        narratorMode={narratorMode}
        onNarratorModeChange={setNarratorMode}
        companionMode={companionMode}
        onCompanionModeChange={setCompanionMode}
        selectedAiCharacter={selectedAiCharacter}
        onSelectedAiCharacterChange={setSelectedAiCharacter}
        selectedParticipantIds={selectedParticipantIds}
        onToggleParticipant={(characterId) =>
          setSelectedParticipantIds((current) =>
            current.includes(characterId) ? current.filter((id) => id !== characterId) : [...current, characterId]
          )
        }
      />

      <ImageShareModal
        isOpen={isImageFormOpen}
        urlValue={imageUrlInput}
        error={imageError}
        onUrlChange={(value) => {
          setImageUrlInput(value);
          setImageError("");
        }}
        onSubmit={handleImageSubmit}
        onClose={() => setIsImageFormOpen(false)}
      />

      <ImagePreviewModal
        src={previewImage}
        onClose={() => setPreviewImage("")}
        onError={() => {
          setPreviewImage("");
          setImageError("Não foi possível carregar essa imagem.");
          setIsImageFormOpen(true);
        }}
      />

      <EncounterModal
        isOpen={encounterTarget !== null}
        targetName={encounterTarget?.name ?? ""}
        locationValue={encounterLocation}
        error={encounterError}
        submitting={encounterSubmitting}
        onLocationChange={setEncounterLocation}
        onSubmit={submitEncounterRequest}
        onClose={() => setEncounterTarget(null)}
      />

      <EndSessionModal
        phase={endSessionPhase}
        summaries={endSessionSummaries}
        registration={registration}
        registrationError={registrationError}
        onRetryRegistration={retryRegistration}
        endSessionError={endSessionError}
        onRetry={() => retryEndSession?.()}
        needsAiSetup={endSessionNeedsSetup}
        onOpenSettings={openSettingsFromEndSession}
        appliedMysterySuggestions={appliedMysterySuggestions}
        applyingMysteryIndex={applyingMysteryIndex}
        onApproveMysterySuggestion={approveMysterySuggestion}
        appliedNpcSuggestions={appliedNpcSuggestions}
        applyingNpcIndex={applyingNpcIndex}
        onApproveNpcSuggestion={approveNpcSuggestion}
        onChooseScope={chooseEndSessionScope}
        onClose={closeEndSessionModal}
        transcript={endSessionTranscript}
        transcriptFileName={endSessionTranscriptFileName}
      />
    </section>
  );
}
