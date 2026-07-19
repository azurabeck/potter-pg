# SettingsModal

Configurações da sessão: tipo de narrador, IA como jogador (com busca de
NPCs via `getNpcCharacters`), prompts da IA e cadastro de players.

Diferente dos outros modais da `Plataforma`, este é sempre montado pelo
pai (`isOpen` só controla se o JSX visível aparece, via `if (!isOpen)
return null` **depois** dos hooks) — os campos preenchidos (prompts,
players adicionados, NPC selecionado) precisam sobreviver a um
fechar/abrir, exatamente como aconteciam quando isso era um bloco de
JSX condicional dentro de um componente que nunca desmontava.

`onAddPlayer` deixa quem escreve no histórico (`history`) por conta do
pai, já que esse estado é compartilhado com `HistoryPanel`.
