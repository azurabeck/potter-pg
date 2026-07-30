# Mistérios

Lista os registros do personagem ativo (`useCharacter()`) — busca única
via `getCharacterMysteries` (`actions/get/mysteries.ts`), colecao
"mysteries" do Firestore (um documento por registro, `character_id`
como dono, ver `Mystery` em `utils/types.ts`).

O modelo de dados (campos, categorias, formato de `clues`) foi copiado
de um projeto irmão deste (`potter-spells`) que já tem a edição/gestão
de mistérios funcionando — aqui a diferença é que **não existe (e não
vai existir por enquanto) nenhuma tela de criar/editar/marcar como
resolvido**: quem faz isso é a IA, ao encerrar uma sessão (ainda não
implementado — ver a seção "Encerrar sessão" da doc do `plataforma` e o
livro "Registros Mágicos" em `pages/livraria`, que já descreve um
protocolo de atualização de sessão, mas não cobre mistérios com esse
nível de detalhe ainda). Por enquanto a colecao está vazia pra todo
mundo, então a lista aparece vazia até essa escrita existir.

## Categorias

Um documento "mystery" não é só um mistério de investigação — a mesma
colecao cobre 4 categorias que o narrador acompanha (`MysteryCategory`):

- **`"mistérios"`** — mistério de investigação de verdade. Tem `clues`
  (pistas, cada uma com `order`, `name`, `question`, `details`,
  `resolution`, `status`) e `status` geral do mistério
  (`"em andamento" | "resolvido" | "cancelado"`).
- **`"projetos"`** — mesma estrutura de `"mistérios"` (`clues` vira
  "objetivos" na exibição), pra acompanhar projetos de longo prazo do
  personagem.
- **`"pendencias narrador"`** — pendência que o narrador ainda precisa
  resolver/responder; usa `awaited_event` (evento aguardado, funciona
  como o "nome" dessa categoria), `current_situation` e `responder`
  (quem pode responder) em vez de `clues`/`status`.
- **`"proxima sessão"`** — nota livre pra próxima sessão; usa `details`
  e o boolean `next_session`.

`year` existe em todas — é o ano letivo do personagem quando o registro
foi criado (não necessariamente o ano atual, já que registros antigos
continuam existindo).

## Componentes

`index.tsx` agrupa por categoria (`groupMysteriesByCategory`,
`functions.ts`) e renderiza uma seção por categoria não-vazia, na ordem
de `CATEGORY_ORDER`. Cada item é um botão que expande/colapsa
(`expandedId`, só um aberto por vez) mostrando os campos específicos da
categoria — mesma lógica condicional por `category` que o formulário e
a timeline do projeto irmão usam.

`statusModifier` (`functions.ts`) existe porque os valores de status
têm espaço (`"em andamento"`, `"em aberto"`) — direto como modificador
BEM (`__badge--em andamento`) isso vira duas classes CSS por engano
(`__badge--em` e `andamento`); a função normaliza pra
`"em-andamento"`/`"em-aberto"` antes de montar a classe.
