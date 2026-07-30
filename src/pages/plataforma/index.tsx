import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Footprints, ImagePlus, Loader2, PanelTop, Play, Send, Settings, Square, Users, X } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { getAiPrompts, getAiProviderConfig } from "@/actions/get/settings";
import { getNarrationSessionOnce, subscribeToNarrationSession } from "@/actions/get/narration-session";
import { subscribeToHostInvites } from "@/actions/get/invites";
import { subscribeToMyEncounter, subscribeToPendingEncounters } from "@/actions/get/encounters";
import { getCharacterMysteries } from "@/actions/get/mysteries";
import { getSpells } from "@/actions/get/spells";
import { getPotions } from "@/actions/get/potions";
import { getNpcs } from "@/actions/get/npcs";
import { getEnemies } from "@/actions/get/enemies";
import { clearNarrationSession, saveNarrationSession } from "@/actions/sets/narration-session";
import { recordGuestCharacter } from "@/actions/sets/invites";
import { createEncounter, respondToEncounter } from "@/actions/sets/encounters";
import { updateCharacterAfterSession } from "@/actions/sets/characters";
import { addHousePoints } from "@/actions/sets/table";
import { appendSessionToCampaign } from "@/actions/sets/campaigns";
import { applyMysterySuggestion } from "@/actions/sets/mysteries";
import { createNpcFromSuggestion, linkNpcToCharacter } from "@/actions/sets/npcs";
import { narrate, type NarrateMessage } from "@/actions/ai/narrate";
import { buildCampaignContext } from "@/actions/ai/context";
import type { Character, Encounter } from "@/utils/types";
import ScoreboardPanel from "./components/scoreboard";
import TurnOrder from "./components/turn-order";
import NarrationPanel from "./components/narration-panel";
import HistoryPanel from "./components/history-panel";
import DiceRoller from "./components/dice-roller";
import SettingsModal from "./components/settings-modal";
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
  parseSessionRegistration,
  randomDieResult,
  splitKnownNpcs,
} from "./functions";
import type { Die, EndSessionSummary, HistoryItem, NarrationMessage, RolledDie, SessionRegistration } from "./functions";
import "./style.scss";

export default function Plataforma() {
  const { user } = useAuth();
  const { activeCharacter, tableCharacters, guestSeat, guestSeatLoading, encounterTarget, setEncounterTarget } =
    useCharacter();
  const playerName = activeCharacter?.name?.trim() || "Tomas Black";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [narrating, setNarrating] = useState(false);
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

  const [endSessionPhase, setEndSessionPhase] = useState<EndSessionPhase>(null);
  const [endSessionSummaries, setEndSessionSummaries] = useState<EndSessionSummary[]>([]);
  const [registration, setRegistration] = useState<SessionRegistration | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
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

  // Cada player usa a própria configuração de IA (token/prompts) — sentar
  // na mesa de alguém não empresta as configurações do anfitrião. As
  // histórias já são independentes por padrão (cada um vive a própria)
  // e só convergem quando um pedido de encontro é aceito, trocando
  // `effectiveCharacterId` pra `myEncounter.sharedCharacterId` (ver seção
  // "Encontros" abaixo) — isso não afeta de quem são as configurações.
  const effectiveCharacterId = myEncounter?.sharedCharacterId ?? activeCharacter?.id ?? null;

  // Escuta em tempo real o feed de narração do personagem "efetivo"
  // (a sessão compartilhada de um encontro aceito, ou a do próprio
  // personagem, por padrão): um documento por personagem no Firestore —
  // qualquer um que salvar uma resposta nova (`saveNarrationSession`)
  // atualiza o feed de todo mundo que estiver escutando o mesmo id, sem
  // reload (ver `subscribeToNarrationSession`). Streaming chunk a chunk
  // continua só local pra quem disparou a chamada — os outros só veem a
  // resposta pronta, quando ela é salva no final. Troca de personagem/
  // encontro sempre zera o feed local antes de escutar a sessão nova,
  // pra não misturar sessões.
  useEffect(() => {
    setNarrationMessages([]);
    setSessionActive(false);
    if (guestSeatLoading || !effectiveCharacterId) return;

    return subscribeToNarrationSession(effectiveCharacterId, (messages) => {
      if (messages.length === 0) return;
      setNarrationMessages(messages);
      setSessionActive(true);
    });
  }, [effectiveCharacterId, guestSeatLoading]);

  // Convite aceito sem personagem registrado ainda (ex: aceitou durante
  // o wizard de criação) — assim que a ficha existir, grava
  // guestUserId/guestCharacterId no convite, pra aparecer na lista de
  // "Na mesa" de todo mundo (roster do CharacterPanel).
  useEffect(() => {
    if (!guestSeat || !user || !activeCharacter || guestSeat.guestCharacterId === activeCharacter.id) return;
    recordGuestCharacter(guestSeat.id, user.uid, activeCharacter.id, playerName).catch((error) => {
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

      const panelWidth = 562.5;
      const panelHeight = 587.5;
      const x = Math.min(Math.max(15, event.clientX - scoreboardDragRef.current.offsetX), window.innerWidth - panelWidth - 15);
      const y = Math.min(Math.max(15, event.clientY - scoreboardDragRef.current.offsetY), window.innerHeight - panelHeight - 15);
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
        const width = 562.5;
        setScoreboardPosition({
          x: Math.max(15, window.innerWidth - width - 42.5),
          y: 112.5,
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

  function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (narrating || !sessionActive) return;
    const text = responseText.trim();
    if (!text) return;

    const playerMessage: NarrationMessage = { id: crypto.randomUUID(), user: playerName, text };
    setNarrationMessages((current) => [...current, playerMessage]);
    setResponseText("");

    continueNarration([...narrationMessages, playerMessage]);
  }

  function playSession() {
    if (narrating || sessionActive) return;
    setNarrationMessages([]);
    setSessionActive(true);
    startSession();
  }

  // Só abre a pergunta de escopo (só eu / mesa inteira) — a chamada de IA
  // em si só acontece depois que o usuário escolhe, em `chooseEndSessionScope`.
  function stopSession() {
    if (narrating || !sessionActive) return;
    setEndSessionPhase("confirm");
  }

  // Refaz a última fala do Narrador: descarta ela do feed e repete a
  // mesma chamada que a gerou (abertura ou rodada normal — o resumo de
  // encerramento não entra mais no feed, ver EndSessionModal).
  function regenerateLastMessage() {
    if (narrating || !sessionActive) return;
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
    setRegistration(null);
    setRegistrationError(null);
    setAppliedMysterySuggestions(new Set());
    setAppliedNpcSuggestions(new Set());
  }

  // Gera a atualização estruturada (maestria de feitiço/poção, inventário,
  // dinheiro, histórico de campanha, NPCs vinculados, sugestões de
  // mistério/NPC novo) e já aplica tudo na ficha, EXCETO mistérios e NPCs
  // novos (só depois de aprovado, ver `approveMysterySuggestion`/
  // `approveNpcSuggestion`) — vincular um NPC já existente é automático
  // (ver REGISTRO DE NPCs em buildSessionRegistrationPrompt), criar um
  // NPC do zero não. Tudo isso só pro próprio personagem, nunca pros
  // outros da mesa: escrever na ficha de outra pessoa a partir da própria
  // sessão não é algo que a mesa deveria permitir, então o resumo dos
  // outros continua só em prosa (ver `chooseEndSessionScope`).
  async function runSessionRegistration(): Promise<void> {
    if (!activeCharacter || !user) return;

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
        session_messages: narrationMessages,
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

      if (parsed.session_history.length > 0) {
        await appendSessionToCampaign(activeCharacter, parsed.session_history);
      }

      if (parsed.npc_links.length > 0) {
        await Promise.all(parsed.npc_links.map((link) => linkNpcToCharacter(link.npc_id, activeCharacter.id)));
      }

      if (parsed.house_points_earned !== 0) {
        const hostUserId = guestSeat?.hostUserId ?? user.uid;
        await addHousePoints(hostUserId, activeCharacter.id, parsed.house_points_earned);
      }
    } catch (error) {
      console.error("Erro ao registrar a sessão:", error);
      setRegistrationError((error as Error).message);
    }
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

  // Escolhido o escopo (só o próprio personagem, ou a mesa inteira), gera
  // um resumo de encerramento SEPARADO por personagem — cada um com sua
  // própria sessão de narração salva (`narration_sessions`, um documento
  // por personagem) e seu próprio contexto de campanha. Quem não tem
  // sessão salva nem chega a chamar a IA: vira `text: null`
  // ("não participou", ver EndSessionModal). Todo mundo que participou
  // tem a sessão encerrada de verdade (Firestore limpo) — o resumo só
  // aparece no modal, não entra mais no feed.
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
        closeEndSessionModal();
        addNarratorMessage(
          "Nenhum token de IA configurado ainda. Abra Configurações, escolha o provedor e cole o token pra narrar."
        );
        setIsSettingsOpen(true);
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

            return {
              characterId: character.id,
              characterName: character.name,
              text: fullText || "A IA não gerou um resumo de encerramento.",
            };
          } catch (error) {
            return {
              characterId: character.id,
              characterName: character.name,
              text: `A IA não conseguiu responder: ${(error as Error).message}`,
            };
          }
        })
      );

      await Promise.all(
        summaries
          .filter((summary) => summary.text !== null)
          .map((summary) =>
            clearNarrationSession(summary.characterId).catch((error) => {
              console.error("Erro ao encerrar a sessão:", error);
            })
          )
      );

      // Registro estruturado (livro do Kingsley) só roda pro próprio
      // personagem — quem clicou em Encerrar — e só se ele participou de
      // fato da sessão (senão não há nada pra registrar).
      if (narrationMessages.length > 0) {
        await runSessionRegistration();
      }

      setSessionActive(false);
      setEndSessionSummaries(summaries);
      setEndSessionPhase("results");
    } catch (error) {
      closeEndSessionModal();
      addNarratorMessage(`A IA não conseguiu responder: ${(error as Error).message}`);
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
              title="Encerrar sessão"
              onClick={stopSession}
              disabled={narrating}
            >
              <Square size={16} /> Encerrar
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
                  : narrating
                    ? "O narrador está escrevendo..."
                    : "Escreva sua ação ou narração..."
              }
              aria-label="Mensagem da rodada"
              disabled={narrating || !sessionActive}
            />
            <button
              type="submit"
              disabled={!responseText.trim() || narrating || !sessionActive}
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
        appliedMysterySuggestions={appliedMysterySuggestions}
        applyingMysteryIndex={applyingMysteryIndex}
        onApproveMysterySuggestion={approveMysterySuggestion}
        appliedNpcSuggestions={appliedNpcSuggestions}
        applyingNpcIndex={applyingNpcIndex}
        onApproveNpcSuggestion={approveNpcSuggestion}
        onChooseScope={chooseEndSessionScope}
        onClose={closeEndSessionModal}
      />
    </section>
  );
}
