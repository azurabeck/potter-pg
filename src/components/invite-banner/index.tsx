import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Mail, X } from "lucide-react";
import { useAuth } from "@/context/auth";
import { subscribeToPendingInvites } from "@/actions/get/invites";
import { respondToInvite } from "@/actions/sets/invites";
import { ROUTES } from "@/services/routes";
import type { TableInvite } from "@/utils/types";
import "./style.scss";

/**
 * Aviso global (montado em `App.tsx`, acima do resto do app — aparece
 * tanto no wizard de criação quanto no app normal, já que é por conta,
 * não por personagem) pra convites pendentes de mesa endereçados ao
 * e-mail do usuário logado. Escuta em tempo real
 * (`subscribeToPendingInvites`, Firestore `onSnapshot`) — um convite
 * novo aparece assim que é criado, sem precisar de reload nem esperar
 * um polling.
 */
export default function InviteBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<TableInvite[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setInvites([]);
      return;
    }

    return subscribeToPendingInvites(email, setInvites);
  }, [user?.email]);

  async function respond(invite: TableInvite, status: "accepted" | "rejected") {
    setRespondingId(invite.id);
    try {
      await respondToInvite(invite.id, status);
      setInvites((current) => current.filter((item) => item.id !== invite.id));
      // Aceitar leva direto pra Plataforma — mesmo se o wizard ainda não
      // tiver terminado (sem ficha ainda), App.tsx continua travando no
      // wizard; assim que a ficha existir, essa navegação já deixa a URL
      // certa, sem precisar de outro clique.
      if (status === "accepted") navigate(ROUTES.PLATAFORMA);
    } catch (error) {
      console.error("Erro ao responder convite:", error);
    } finally {
      setRespondingId(null);
    }
  }

  if (invites.length === 0) return null;

  return (
    <div className="invite-banner">
      {invites.map((invite) => (
        <div key={invite.id} className="invite-banner__item">
          <Mail size={16} aria-hidden="true" />
          <p>
            <strong>{invite.hostName}</strong> está te convidando pra entrar na mesa.
          </p>
          <div className="invite-banner__actions">
            <button
              type="button"
              className="invite-banner__accept"
              onClick={() => respond(invite, "accepted")}
              disabled={respondingId === invite.id}
            >
              <Check size={14} /> Aceitar
            </button>
            <button
              type="button"
              className="invite-banner__reject"
              onClick={() => respond(invite, "rejected")}
              disabled={respondingId === invite.id}
            >
              <X size={14} /> Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
