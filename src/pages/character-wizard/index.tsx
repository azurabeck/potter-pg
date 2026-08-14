import { useState } from "react";
import { Loader2, ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useCharacter } from "@/context/character";
import { createPlayerCharacter, updateCharacterAfterSession } from "@/actions/sets/characters";
import { addHousePoints } from "@/actions/sets/table";
import { appendSessionToCampaign } from "@/actions/sets/campaigns";
import { createNpcFromSuggestion, linkNpcToCharacter } from "@/actions/sets/npcs";
import { getSpells } from "@/actions/get/spells";
import { getPotions } from "@/actions/get/potions";
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
  emptySessionRegistration,
  parseSessionRegistration,
  splitKnownNpcs,
  type SessionHistoryEvent,
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
  // Texto do botão "Concluir" enquanto `submitting` — muda pra deixar
  // claro que ainda tem coisa rodando depois da ficha já existir (o
  // registro da primeira sessão, que agora é esperado de propósito antes
  // de liberar a tela, ver `submit` abaixo).
  const [submitMessage, setSubmitMessage] = useState("Concluir");
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
    setSubmitMessage("Criando ficha...");
    setError(null);
    try {
      const payload = buildCharacterPayload(state);
      const characterId = await createPlayerCharacter(user.uid, payload);

      // Espera o registro da primeira sessão terminar (sucesso ou falha —
      // `registerFirstSession` nunca lança, sempre resolve) ANTES de
      // liberar a tela — de propósito, pra não deixar o jogador entrar no
      // app achando que já está tudo pronto enquanto casa/pontos/campanha
      // ainda estão sendo gravados no Firestore em segundo plano.
      if ((state.sortingStoryTranscript ?? []).length > 0) {
        setSubmitMessage("Concluindo registro de aluno...");
      }
      await registerFirstSession(
        { ...payload, id: characterId, user_id: user.uid, character_type: "player" },
        state.sortingStoryTranscript ?? [],
        hostUserId
      );

      await refreshCharacters();
    } catch (err) {
      setError(`Não foi possível criar a ficha: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
      setSubmitMessage("Concluir");
    }
  }

  return (
    <div className="character-wizard-page">
      <div className="character-wizard-page__card">
        {/* Cobre o wizard inteiro enquanto a última etapa está rodando —
            criação da ficha e, principalmente, o registro da primeira
            sessão (que agora é esperado de propósito antes de liberar a
            tela pro resto do app, ver `submit`). Sem isso o jogador podia
            mexer nos campos por baixo enquanto isso ainda roda. */}
        {submitting && isLastStep && (
          <div className="character-wizard-page__submit-overlay" role="status" aria-live="polite">
            <Loader2 size={28} className="character-wizard-page__spinner" />
            <p>{submitMessage}</p>
          </div>
        )}

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
            {isLastStep ? (submitting ? submitMessage : "Concluir") : "Avançar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Registra a história do teste de seleção (Beco Diagonal, terminando num
// salto pro Chapéu Seletor — ver buildSortingStorySystemPrompt em
// functions.ts) como a PRIMEIRA SESSÃO do personagem recém-criado — roda
// automática e invisivelmente ao concluir o wizard (sem modal, sem
// clique nenhum), o MESMO registro estruturado que "Encerrar sessão" faz
// na Plataforma (`buildSessionRegistrationPrompt`/
// `runSessionRegistration`, pages/plataforma/index.tsx): maestria,
// inventário, dinheiro, adversários, pontos de casa, histórico na
// campanha (`appendSessionToCampaign` — cria o documento em
// `campaigns` e já atrela o id ao personagem em `campaign_ids`, ver
// `linkCampaignToCharacter` em actions/sets/campaigns.ts), vínculo de
// NPC, mistério novo/atualizado e criação de NPC novo. Esses dois
// últimos exigem aprovação manual no fluxo normal (EndSessionModal);
// aqui, sem modal pra aprovar, aplica direto — o registro da primeira
// sessão precisa sair completo. NÃO grava nada no campo `historia` da
// ficha — o registro de sessão mora inteiro na coleção `campaigns`,
// igual à Plataforma, nunca em texto livre na ficha.
// Usa `sortingNarrate` (a IA fixa do projeto, mesma que narrou a
// história) em vez do provedor que o usuário configura em
// Configurações — que nesse ponto do fluxo ainda nem existe (usuário
// acabou de criar a primeira ficha). `transcript` vazio (casa escolhida
// direto, sem teste de seleção) não registra nada. Nunca lança pra fora:
// uma falha aqui só vai pro console (`console.log`/`console.error` em
// cada etapa, de propósito — é o único jeito de diagnosticar isso, já
// que roda sem UI nenhuma) e nunca desfaz a criação da ficha, que já
// aconteceu com sucesso antes desta função rodar.
async function registerFirstSession(
  character: Character,
  transcript: SortingStoryMessage[],
  hostUserId: string | null
): Promise<void> {
  if (transcript.length === 0) {
    console.log("[primeira sessão] casa escolhida direto, sem teste de seleção — nada pra registrar.");
    return;
  }

  console.log(`[primeira sessão] iniciando registro para ${character.name} (${transcript.length} falas)...`);

  // Registro estruturado (maestria, inventário, dinheiro, pontos de casa,
  // campanha, NPCs, mistérios). Cada sub-etapa tem o próprio fallback
  // silencioso (lookups viram array vazio, chamada de IA malsucedida vira
  // registro vazio) e a campanha é escrita ANTES de qualquer outra coisa
  // que possa falhar — o objetivo #1 desta função é "Sessões" nunca mais
  // mostrar "Nenhuma sessão registrada ainda" pra quem passou pelo teste
  // de seleção, mesmo se a IA falhar de ponta a ponta.
  try {
    const [knownSpells, knownPotions, allNpcs, allEnemies] = await Promise.all([
      getSpells().catch(() => []),
      getPotions().catch(() => []),
      getNpcs().catch(() => []),
      getEnemies().catch(() => []),
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
      // Vazio de propósito: a primeira sessão nunca registra mistério
      // (ver comentário perto de `mystery_suggestions`, mais abaixo) —
      // não vale a pena nem buscar os mistérios existentes do personagem
      // pra isso.
      existing_mysteries: [] as unknown[],
      known_npcs: knownNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
      other_npcs: otherNpcs.map((npc) => ({ id: npc.id, name: npc.name })),
      all_enemies: allEnemies.map((enemy) => ({ id: enemy.id, name: enemy.name })),
      known_adversaries: [] as string[],
    };

    // Isolado num try/catch próprio: se `sortingNarrate` falhar (erro de
    // rede, GEMINI_KEY faltando no ambiente etc.) ou a resposta não vier
    // em JSON válido, cai pro registro vazio em vez de abortar a função
    // inteira ANTES de chegar no `appendSessionToCampaign` garantido
    // logo abaixo.
    let parsed;
    try {
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
      // Loga o texto cru — se o parser abaixo falhar (a IA respondeu fora
      // do formato JSON esperado, por exemplo), isso é o que permite ver
      // exatamente o que ela devolveu em vez de só um erro genérico.
      console.log("[primeira sessão] resposta crua da IA (registro estruturado):", fullText);
      parsed = parseSessionRegistration(fullText);
    } catch (aiError) {
      console.error(
        "[primeira sessão] erro ao chamar a IA (ou interpretar a resposta) pro registro estruturado — seguindo com registro vazio:",
        aiError
      );
      parsed = emptySessionRegistration();
    }
    console.log("[primeira sessão] registro estruturado:", parsed);

    // Garante que a primeira sessão SEMPRE vira pelo menos uma entrada na
    // campanha, mesmo que a IA não tenha extraído nenhum evento de
    // `session_history` (ou tenha falhado por completo, acima) — sem
    // isso, uma sessão "calma" (só compras no Beco Diagonal, sem
    // feitiço/poção/item) podia legitimamente terminar sem nenhum evento
    // estruturado e a campanha ficava "sem sessão registrada" mesmo com a
    // história tendo acontecido de verdade.
    const sessionHistory: SessionHistoryEvent[] =
      parsed.session_history.length > 0
        ? parsed.session_history
        : [
            {
              order: 1,
              date: new Date().toLocaleDateString("pt-BR"),
              event: `${character.name} foi ao Beco Diagonal pela primeira vez, comprou os materiais para o 1º ano e foi selecionado pelo Chapéu Seletor para ${character.casa}.`,
              local: "Beco Diagonal",
              characters: [character.name],
            },
          ];

    // Vem primeiro, de propósito — ver comentário no início do passo 2.
    await appendSessionToCampaign(character, sessionHistory).catch((error) => {
      console.error("[primeira sessão] erro ao registrar na campanha:", error);
    });
    console.log("[primeira sessão] campanha atualizada com", sessionHistory.length, "evento(s).");

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
    }).catch((error) => {
      console.error("[primeira sessão] erro ao aplicar maestria/inventário/dinheiro:", error);
    });

    // Cada passo daqui pra baixo é independente, igual em
    // `runSessionRegistration` (pages/plataforma/index.tsx) — um erro em
    // qualquer um não deve impedir os outros de tentar.
    if (parsed.house_points_earned !== 0 && hostUserId) {
      await addHousePoints(hostUserId, character.id, character.casa, parsed.house_points_earned).catch((error) => {
        console.error("[primeira sessão] erro ao somar pontos de casa:", error);
      });
    }

    if (parsed.npc_links.length > 0) {
      await Promise.all(parsed.npc_links.map((link) => linkNpcToCharacter(link.npc_id, character.id))).catch(
        (error) => {
          console.error("[primeira sessão] erro ao vincular NPC:", error);
        }
      );
    }

    // `mystery_suggestions` fica de fora de propósito na primeira sessão
    // — não faz sentido nenhum mistério nascer de uma tarde de compras no
    // Beco Diagonal antes até da seleção de casa.
    //
    // `npc_creation_suggestions`, por outro lado, continua aplicado
    // direto (sem aprovação — no fluxo normal exige um clique em
    // `EndSessionModal`, mas aqui não tem modal nenhum): é assim que os
    // NPCs originais que aparecerem na história (vendedores, outros
    // alunos etc. — nunca personagens do cânone, ver
    // buildSortingStorySystemPrompt em functions.ts) entram no jogo.
    if (parsed.npc_creation_suggestions.length > 0) {
      await Promise.all(
        parsed.npc_creation_suggestions.map((suggestion) => createNpcFromSuggestion(character, suggestion))
      ).catch((error) => {
        console.error("[primeira sessão] erro ao criar NPC:", error);
      });
    }

    console.log("[primeira sessão] registro estruturado concluído.");
  } catch (error) {
    console.error("[primeira sessão] erro ao gerar/aplicar o registro estruturado:", error);
  }
}
