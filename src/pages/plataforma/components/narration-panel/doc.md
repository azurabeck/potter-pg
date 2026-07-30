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

Quando a última mensagem é do "Narrador" e o pai passa
`onRegenerateLast`, aparece um botão **"Refazer última resposta"** logo
depois do feed (`.platform-page__regenerate-button`) — some sozinho se
a última fala for de outra pessoa (nada pra refazer) ou se `onRegenerateLast`
não for passado. `regenerating` só desabilita o botão e anima o ícone
(reaproveita `.platform-page__spinner` de `pages/plataforma/style.scss`,
já que os dois `style.scss` fazem parte do mesmo bundle global e não são
escopados por arquivo); toda a lógica de qual chamada refazer vive em
`regenerateLastMessage` (`pages/plataforma/index.tsx`).
