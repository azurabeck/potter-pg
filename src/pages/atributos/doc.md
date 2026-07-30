# Página: Atributos

Conteúdo (atributos/talentos/títulos agrupados por tipo) inspirado num
projeto irmão (`potter-spells`, aba "Attributes"); layout do filtro
(busca + ícone no header, dropdowns num painel que abre por baixo)
copiado de `pages/feiticos` — mesmo componente `FilterBar`, adaptado
pros campos desta página (tipo/ordenação em vez de ano/nível/atributo/
categoria/status). **Só leitura**: sem editar valor de atributo, sem
adicionar/editar/excluir talento ou título — a aba de referência tinha
tudo isso (inclusive um formulário de HP/XP), aqui não tem nada (mesma
ressalva das outras páginas novas: quem vai escrever essas mudanças é
a IA, ao encerrar uma sessão, ainda não implementado). Por esse motivo
também não peguei a seção "Recursos do personagem" (HP/XP editável) do
projeto de referência — além de ser edição, nosso `Character` nem tem
campo `xp` ainda (ver doc do `plataforma`, seção sobre o
`goal_percent`).

Igual `pages/inventario`, não existe collection nem action nova aqui —
tudo vem do personagem já carregado (`useCharacter().activeCharacter`):
`atributos` (`Record<string, number>`), `talentos` e `titulos`
(`CharacterTalento[]`, `utils/types.ts`).

## As chaves de `atributos` não têm um formato único

Primeira versão desta página assumia a lista de 19 chaves em
`snake_case` do wizard de criação (`ATTRIBUTE_KEYS`,
`pages/character-wizard/functions.ts`) e mostrava **0 pra todo mundo**
em personagens reais — a ficha de verdade guarda `atributos` com um
mix de chaves: algumas em slug minúsculo (`"magia"`, `"protecao"`),
outras já com o nome formatado como chave (`"Aprendizado Mágico"`,
`"Magia Antiga"`). Não existe uma lista canônica confiável de "todos os
atributos possíveis" batendo com toda ficha.

A correção foi trocar a fonte: em vez de partir de uma lista fixa,
`buildRows` (`functions.ts`) lista exatamente as chaves que o
personagem tem (`Object.entries(character.atributos)`) e formata cada
uma com `formatAttributeLabel` (`@/utils` — movida de
`components/character-panel/functions.ts` pra cá, já que agora duas
telas precisam da mesma normalização; `getAttributeIcon` foi junto,
pelo mesmo motivo). Mesma abordagem que `CharacterPanel` sempre usou,
e é por isso que lá os valores sempre apareceram certos.

`attributeMaxForYear(ano)` — mesma tabela de teto por ano do livro
"Hogwarts Vivência" (`services/ai_prompt_defaults.ts` → `FINAL_EXAMS`:
1º=5, 2º=7, 3º=9, 4º=11, 5º=12, 6º=13, 7º=14, adulto=15) — mostrada no
cabeçalho ("Limite dos atributos no Xº ano") e usada como `maximo` de
cada atributo.

## Layout

- **Header (`__top`)**: título + `components/filter-bar` — busca e um
  botão de ícone (`Filter`) que abre/fecha um painel com dois
  `<select>` (tipo: atributo/talento/título; ordenação: padrão/nome/
  nível). Mesmo componente/CSS de `pages/feiticos/components/filter-bar`
  e `pages/pocoes/components/filter-bar`, só trocando os campos — os
  três `filter-bar/style.scss` são cópias idênticas (convenção de
  página autocontida, ver acima).
- **Atributos**: grade de cards compactos (`__attr-grid`, `auto-fill`
  `minmax(200px, 1fr)`) — ícone (`getAttributeIcon`), nome, valor/máximo
  e uma barrinha de progresso (`nivel/maximo`). Pensado pra ler os 19 de
  uma vez sem depender de rolar uma lista alta — a grade se rearranja
  sozinha conforme a largura disponível.
- **Talentos/Títulos**: cards com borda colorida por tipo (vermelho/
  roxo), nome + badge `nivel/maximo` no topo, descrição/vantagem/
  conhecido-por/título abaixo quando existirem — sem clicar em nada,
  igual o `Table.jsx` do projeto de referência mostrava.

Sem modal de detalhe — só `index.tsx` (`AttributeCard`/`ExtraCard`,
componentes internos do próprio arquivo, não vale a pena separar em
arquivos por enquanto).
