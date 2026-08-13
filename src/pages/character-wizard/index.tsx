import { useState } from "react";
import { Loader2, ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { createPlayerCharacter, updateCharacterAfterSession } from "@/actions/sets/characters";
import { addHousePoints } from "@/actions/sets/table";
import { appendSessionToCampaign } from "@/actions/sets/campaigns";
import { linkNpcToCharacter } from "@/actions/sets/npcs";
import { getSpells } from "@/actions/get/spells";
import { getPotions } from "@/actions/get/potions";
import { getCharacterMysteries } from "@/actions/get/mysteries";
import { getNpcs } from "@/actions/get/npcs";
import { getEnemies } from "@/actions/get/enemies";
import { sortingNarrate } from "@/actions/ai/sorting-narrate";
import {
  applyAdversaryEncounters,
  applyInventoryUpdates,
  applyMoneyUpdate,
  applyPotionMasteryUpdates,
  applySpellMasteryUpdates,
  buildSessionRegistrationPrompt,
  parseSessionRegistration,
  splitKnownNpcs,
} from "@/pages/plataforma/functions";
import { APP_NAME } from "@/services/genene_settings";
import type { Character } from "@/utils/types";
import StepIdentity from "./components/step-identity";
import StepAttributes from "./components/step-attributes";
import StepFinal from "./components/step-final";
import StepHouse from "./components/step-house";
import {
  buildCharacterPayload,
  createInitialWizardState,
  isAttributesStepValid,
  isFinalStepValid,
  isHouseStepValid,
  isIdentityStepValid,
  type SortingStoryMessage,
  type WizardState,
} from "./functions";
import "./style.scss";

const STEP_LABELS = ["Identidade", "Atributos e talento", "Varinha, núcleo e animal", "Casa"];

/**
 * Bloqueia o resto do app (ver `App.tsx`) até o usuário logado ter pelo
 * menos uma ficha de personagem "player" — cobre tanto quem acabou de
 * criar conta quanto um player convidado pra uma sessão que loga pela
 * primeira vez sem ficha nenhuma ainda.
 */
export default function CharacterWizard() {
  const { user } = useAuth();
  const { refreshCharacters, hostUserId } = useCharacter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(createInitialWizardState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEP_LABELS.length - 1;
  const canAdvance =
    step === 0
      ? isIdentityStepValid(state)
      : step === 1
        ? isAttributesStepValid(state)
        : step === 2
          ? isFinalStepValid(state)
          : isHouseStepValid(state);

  function goNext() {
    if (!canAdvance || submitting) return;
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }
    void submit();
  }

  function goBack() {
    if (submitting) return;
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildCharacterPayload(state);
      const characterId = await createPlayerCharacter(user.uid, payload);
      // Registro da primeira sessão (ver função abaixo) roda solto, sem
      // `await` — não deve travar a conclusão do wizard nem seu spinner:
      // o jogador já pode entrar no app enquanto isso termina de rodar em
      // segundo plano (é "invisível" de propósito, não bloqueante).
      void registerFirstSession(
        { ...payload, id: characterId, user_id: user.uid, character_type: "player" },
        state.sortingStoryTranscript ?? [],
        hostUserId
      );
      await refreshCharacters();
    } catch (err) {
      setError(`Não foi possível criar a ficha: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="character-wizard-page">
      <div className="character-wizard-page__card">
        <div className="character-wizard-page__brand">
          <ShieldHalf className="character-wizard-page__brand-icon" />
          <span>{APP_NAME}</span>
        </div>

        <h1 className="character-wizard-page__title">Crie sua ficha</h1>
        <p className="character-wizard-page__subtitle">
          Antes de entrar na mesa, vamos montar seu personagem — leva só alguns passos.
        </p>

        <ol className="character-wizard-page__steps">
          {STEP_LABELS.map((label, index) => (
            <li key={label} className={index === step ? "is-active" : index < step ? "is-done" : ""}>
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="character-wizard-page__content">
          {step === 0 && <StepIdentity state={state} onChange={setState} />}
          {step === 1 && <StepAttributes state={state} onChange={setState} />}
          {step === 2 && <StepFinal state={state} onChange={setState} />}
          {step === 3 && <StepHouse state={state} onChange={setState} />}
        </div>

        {error && <p className="character-wizard-page__error">{error}</p>}

        <div className="character-wizard-page__footer">
          <button type="button" onClick={goBack} disabled={step === 0 || submitting}>
            Voltar
          </button>
          <button
            type="button"
            className="character-wizard-page__primary"
            onClick={goNext}
            disabled={!canAdvance || submitting}
          >
            {submitting && <Loader2 size={15} className="character-wizard-page__spinner" />}
            {isLastStep ? "Concluir" : "Avançar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Registra a história do teste de seleção (Beco Diagonal → trem →
// Hogwarts → Chapéu Seletor, ver buildSortingStorySystemPrompt em
// functions.ts) como a PRIMEIRA SESSÃO do personagem recém-criado — roda
// automática e invisivelmente ao concluir o wizard (sem modal, sem
// clique nenhum), reaproveitando o MESMO protocolo de registro de sessão
// da Plataforma (`buildSessionRegistrationPrompt`/`parseSessionRegistration`,
// pages/plataforma/functions.ts — as mesmas funções puras que
// `runSessionRegistration` usa lá). A única diferença é o transporte de
// IA: `sortingNarrate` (a IA fixa do projeto, mesma que narrou a
// história) em vez do provedor que o usuário configura em
// Configurações — que nesse ponto do fluxo ainda nem existe (usuário
// acabou de criar a primeira ficha). `transcript` vazio (casa escolhida
// direto, sem teste de seleção) não registra nada. Nunca lança: qualquer
// falha aqui é só logada, nunca aparece pro usuário nem desfaz a
// criação da ficha (que já aconteceu com sucesso antes desta função
// rodar).
async function registerFirstSession(
  character: Character,
  transcript: SortingStoryMessage[],
  hostUserId: string | null
): Promise<void> {
  if (transcript.length === 0) return;

  try {
    const [knownSpells, knownPotions, existingMysteries, allNpcs, allEnemies] = await Promise.all([
      getSpells(),
      getPotions(),
      getCharacterMysteries(character.id),
      getNpcs(),
      getEnemies(),
    ]);

    const { known: knownNpcs, other: otherNpcs } = splitKnownNpcs(allNpcs, character.id);

    const payload = {
      character,
      session_messages: transcript.map((message) => ({
        user: message.role === "narrator" ? "Narrador" : character.name,
        text: message.text,
      })),
      // Vazio de propósito: os resultados de dado já vêm embutidos no
      // texto de cada fala do jogador (ver rollDie em sorting-story), não
      // como uma lista estruturada à parte — diferente da Plataforma,
      // onde `history` guarda dados soltos, sem relação com a narração.
      dice_rolls: [] as Array<{ sides: number; result: number }>,
      spells: knownSpells.filter((spell) => spell.attributes.ano_letivo <= character.ano),
      potions: knownPotions.filter((potion) => potion.ano <= character.ano),
      existing_mysteries: existingMysteries,
      known_npcs: knownNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
      other_npcs: otherNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
      all_enemies: allEnemies.map((enemy) => ({ id: enemy.id, name: enemy.name })),
      known_adversaries: [] as string[],
    };

    let fullText = "";
    await sortingNarrate(
      {
        systemPrompt: buildSessionRegistrationPrompt(),
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

    await updateCharacterAfterSession(character.id, {
      habilidades: applySpellMasteryUpdates(character.habilidades, parsed.spell_mastery_updates),
      pocoes: applyPotionMasteryUpdates(character.pocoes, parsed.potion_mastery_updates),
      inventario: {
        ...character.inventario,
        itens: applyInventoryUpdates(character.inventario.itens, parsed.inventory_updates),
      },
      dinheiro: applyMoneyUpdate(character.dinheiro, parsed.money_update),
      adversarios_conhecidos: applyAdversaryEncounters(
        character.adversarios_conhecidos ?? [],
        parsed.adversary_encounters
      ),
    });

    // Cada passo daqui pra baixo é independente, igual em
    // `runSessionRegistration` (pages/plataforma/index.tsx) — um erro em
    // qualquer um não deve impedir os outros de tentar.
    if (parsed.house_points_earned !== 0 && hostUserId) {
      await addHousePoints(hostUserId, character.id, character.casa, parsed.house_points_earned).catch((error) => {
        console.error("Erro ao somar pontos de casa da primeira sessão:", error);
      });
    }

    if (parsed.session_history.length > 0) {
      await appendSessionToCampaign(character, parsed.session_history).catch((error) => {
        console.error("Erro ao registrar a primeira sessão na campanha:", error);
      });
    }

    if (parsed.npc_links.length > 0) {
      await Promise.all(parsed.npc_links.map((link) => linkNpcToCharacter(link.npc_id, character.id))).catch(
        (error) => {
          console.error("Erro ao vincular NPC da primeira sessão:", error);
        }
      );
    }

    // `mystery_suggestions`/`npc_creation_suggestions` ficam de fora de
    // propósito — no fluxo normal (EndSessionModal) exigem um clique de
    // aprovação do jogador; sem modal nenhum aqui, ninguém aprovaria
    // nada, então nunca são aplicadas (mesma regra, resultado natural).
  } catch (error) {
    console.error("Erro ao registrar a primeira sessão:", error);
  }
}
