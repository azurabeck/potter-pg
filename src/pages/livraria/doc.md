# Livraria (Floreios e Borrões)

Página de referência: mostra pro jogador, em forma de livro (flavor
in-universe), as regras que a IA já usa de verdade pra narrar — ou que
ainda não tem gatilho nenhum, mas já estão documentadas (ver os últimos
dois livros abaixo). Não lê nem escreve nada no Firestore — é só uma
vitrine de `services/ai_prompt_defaults.ts`, o mesmo módulo que
`pages/plataforma` usa pra montar o prompt de sistema real
(`buildNarrationPrompt`/`buildClosingPrompt`, ver doc do `plataforma`).

## `functions.ts`

`BOOKS`: os 7 livros fixos (id, título, autor, `content` — o texto puro
mostrado no modal —, `icon`, `accent` — uma string `"r, g, b"` usada via
`rgba(var(--book-accent-rgb), alpha)` no CSS, evitando `color-mix` por
compatibilidade — e `format`, opcional). Cada um tem uma relação
diferente com `services/ai_prompt_defaults.ts`:

- Os 4 primeiros usam `DEFAULT_AI_PROMPTS.narration`/`.quidditch`/
  `.duel`/`.battle` direto — regra realmente usada em toda narração, via
  `buildNarrationPrompt`.
- O 5º (Filius Flitwick, "A Evolução e Ligação de Feitiços e Poções")
  usa `MASTERY_AND_ATTRIBUTES` — exportado separado porque ele soma
  dentro de `DEFAULT_AI_PROMPTS.closing`
  (`[CLOSING, MASTERY_AND_ATTRIBUTES].join(...)`), mas o livro mostra só
  essa parte, não o `closing` inteiro (que também tem o resumo de
  eventos/inventário/mistérios da sessão — misturaria dois assuntos num
  livro só).
- O 6º (Minerva Macgonagall, "Hogwarts Vivência") usa `FINAL_EXAMS` — a
  regra dos exames finais/Taça das Casas — e o 7º (Kingsley
  Shacklebolt, "Registros Mágicos") usa `MINISTRY_RECORDS` — o
  protocolo de encerramento/atualização de sessão em JSON. **Nenhum dos
  dois soma em `DEFAULT_AI_PROMPTS`**: a Plataforma não tem gatilho de
  "exame final" nem um fluxo de chamada de IA que peça resposta
  estruturada em JSON (com etapas aguardando rolagem do usuário) — os
  dois livros são só referência de regra por enquanto, sem efeito na
  narração real.

Os ícones dos 4 primeiros repetem os mesmos de "Prompts da IA" no
`SettingsModal` (`ScrollText`/`Trophy`/`Dices`/`Sword`) de propósito —
mesma regra, mesmo símbolo nos dois lugares; o 5º usa `DoorClosed`, o
mesmo ícone de "Regra de Encerramento" lá, já que é conteúdo que soma
no prompt de encerramento; o 6º e o 7º (`GraduationCap`/`Landmark`) não
têm equivalente no `SettingsModal`, já que não são campos de
`AiPrompts`.

### Dois formatos de conteúdo

`book.format` decide como `BookDetailModal` renderiza `book.content`:

- **`"prose"` (padrão, 6 primeiros livros)** — `promptBlocksFor(book)`
  quebra o texto em blocos (`PromptBlock`): texto separado por linha em
  branco, uma linha de título seguida do corpo. `parsePromptLines` lê o
  corpo **na ordem**, agrupando linhas consecutivas do mesmo tipo:
  - `"- item"` → `{ kind: "list" }` (uma lista por sequência de linhas).
  - `"| a | b | c |"` → `{ kind: "table" }` (primeira linha = cabeçalho
    — a tabela de testes de ações principais por ano no livro do
    Weasley, a de XP por dificuldade do Flitwick, e as duas tabelas de
    exames da Macgonagall: pontos de evolução e prêmios da Taça das
    Casas por ano).
  - Qualquer outra linha → `{ kind: "text" }` (parágrafo solto — ex.: a
    "Regra Fundamental" no fim de cada regra, ou a frase descritiva
    antes dos exemplos em lista de cada atributo).
  Puramente textual — se o formato mudar (por exemplo, um bloco sem
  título), a primeira linha vira o título mesmo assim, então não
  quebra, só fica um pouco menos organizado.
- **`"raw"` (só o 7º, Kingsley)** — o documento do Kingsley usa listas
  numeradas, marcadores `*`, blocos de código ```` ```json ````/
  ```` ```text ```` com JSON de verdade (às vezes com chaves/valores
  multi-linha) — não cabe no parser de blocos acima sem risco de
  misturar tudo errado. Em vez de escrever um parser de markdown
  completo pra um documento só, `stripCodeFences` apenas remove as
  linhas ```` ``` ```` e o texto vai pro modal como `<pre>` monoespaçado
  (`__raw`), preservando indentação e JSON exatamente como estão —
  ler como um "documento técnico impresso" também combina com "um
  documento do Ministério". `book-detail-modal__panel--raw` deixa o
  modal mais largo (760px vs. 560px) só nesse caso, pra caber as linhas
  de JSON sem quebrar demais.

## Componentes

- **`index.tsx`** — a "estante": `BOOKS.map` renderizando um botão por
  livro (`__book`, hover levanta o livro com `translateY` + leve
  rotação). Clicar guarda o livro em `selectedBook` e abre o modal.
- **`components/book-detail-modal/`** — mesmo padrão de modal
  overlay-clica-fora-fecha + Escape dos outros modais do app (ex.
  `spell-detail-modal`, `encounter-modal`), mas com estilo próprio (não
  usa a família `.platform-modal`, que é específica da `Plataforma`).
  Cabeçalho com ícone/título/autor; corpo rolável que renderiza os
  `PromptBlock` de `promptBlocksFor` (`format: "prose"`) ou o `<pre>`
  de `stripCodeFences` (`format: "raw"`), ver seção acima.
