# InviteBanner

Aviso global de convites de mesa pendentes — montado em `App.tsx` acima
de tudo (antes do gate de personagem), então aparece tanto durante o
wizard de criação quanto no app normal. Não recebe props; lê o e-mail
do usuário logado direto de `useAuth()`.

Escuta em tempo real (`subscribeToPendingInvites`, `actions/get/
invites.ts` — Firestore `onSnapshot`) os convites com `status:
"pending"` endereçados a esse e-mail. Um convite novo aparece assim que
é criado, sem reload nem espera — o efeito só chama `setInvites`
direto como callback do listener, e o cleanup é a própria função de
unsubscribe que `subscribeToPendingInvites` devolve.

Sem convite pendente, não renderiza nada (`if (invites.length === 0)
return null`). Com um ou mais, mostra um item por convite
("**{hostName}** está te convidando pra entrar na mesa", com Aceitar/
Rejeitar) — `respondingId` desabilita só os botões do convite que está
sendo respondido, não os outros. Responder chama `respondToInvite`
(`actions/sets/invites.ts`, só troca o `status` do documento) e tira o
convite da lista local direto (sem rebuscar).

Aceitar marca o convite como aceito **e** navega pra `/plataforma`
(`useNavigate`, `ROUTES.PLATAFORMA`) — mesmo que o usuário ainda esteja
preso no wizard de criação de personagem (sem ficha ainda), a navegação
já deixa a URL certa; assim que a ficha existir, `App.tsx` troca pro
app normal e ele já cai direto na Plataforma, sem precisar de outro
clique. Quem realmente lê o convite aceito e coloca o personagem no
roster da mesa é a própria página `Plataforma` (`getActiveTableSeat`,
ver doc do `plataforma` seção "Mesa compartilhada") — este componente só
decide a navegação, não sabe nada sobre esse efeito. A narração e as
configurações de IA continuam sendo as do próprio convidado, não as do
anfitrião.

`.app-shell`/`.character-wizard-page` usam `min-height/height: 100vh`
each — com o banner ocupando espaço acima deles, sobra um scroll
vertical pequeno na página toda enquanto há convite pendente. Cosmético
(nada fica inacessível), não corrigido ainda.
