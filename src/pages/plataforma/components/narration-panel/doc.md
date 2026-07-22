# NarrationPanel

Exibe o feed de mensagens de narração da página `Plataforma`
(`platform-page__story-grid`, coluna principal). Controlado pelo pai —
recebe `messages: NarrationMessage[]` (a lista de mensagens vive em
`pages/plataforma/index.tsx`, escrita pelo formulário de resposta
logo abaixo do `story-grid` na mesma página).

Sem mensagens, mostra um estado vazio pedindo pra apertar o botão
**Iniciar** do header — `pages/plataforma/index.tsx` (`playSession`)
é quem de fato inicia a sessão; `NarrationPanel` só exibe o aviso, sem
lógica própria de início. Rola pro fim automaticamente a cada mudança,
observando o próprio container via `MutationObserver` (não depende de
`messages` como array de dependências do efeito).
