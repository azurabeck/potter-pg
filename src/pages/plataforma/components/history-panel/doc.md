# HistoryPanel

Barra lateral com o histórico da sessão (rolagens de dado, imagens
disparadas, entradas de player) — coluna estreita ao lado do
`NarrationPanel` dentro de `platform-page__story-grid`.

Controlado pelo pai: recebe `items: HistoryItem[]` (o array vive em
`pages/plataforma/index.tsx`, escrito por `DiceRoller`, `ImageShareModal`
e `SettingsModal`) e `onPreview(url)`, chamado ao clicar na miniatura de
um item de imagem — o pai usa isso pra abrir o `ImagePreviewModal`.

Rola pro fim automaticamente sempre que `items` muda.

Item `type: "join"` com `inviteId` (veio de um convite por e-mail em
`SettingsModal`, não de um nome puro) mostra uma tag ao lado: "(usuário
convidado)" enquanto `inviteStatus === "pending"`, "(convidado aceito)"
quando vira `"accepted"`. `HistoryPanel` só lê `inviteStatus` — quem
atualiza esse campo (em tempo real, via `subscribeToHostInvites`,
Firestore `onSnapshot`) é `pages/plataforma/index.tsx`, não este
componente.
