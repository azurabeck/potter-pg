# Adversários

Lista de criaturas/adversários e NPCs hostis que o personagem ativo já
conheceu ou enfrentou — inspirada na aba "Enemies" do projeto irmão
(`GameData/Tabs/Enemies`), mas **só leitura**: sem criar, editar ou
excluir nada aqui. Cadastro da coleção `enemies` (bestiário) fica pro
console do Firebase, igual a `spells`/`potions`; quem marca um
adversário como "conhecido" pro personagem é a IA, no encerramento de
sessão (ver `pages/plataforma`).

## Modelo de dados

Um adversário pode vir de **duas coleções diferentes**:

- `enemies` (`Enemy`, `utils/types.ts`) — criaturas/adversários formais,
  com ficha de combate: `type`, `hp`, `difficulty`, `recommended_year`,
  `impact_die`, `local`, `caracteristicas`, `main_attack`/
  `secondary_attack` (nome, atributo+valor, distância, efeito) e
  `defense` (atributo+valor). Sem escrita nesta página —
  `actions/get/enemies.ts` só lê.
- `npcs` (`Npc`, já usado por `pages/relacoes`) — um NPC pode virar
  adversário sem deixar de ser NPC (ex: um "amigo" que se revela
  hostil); por isso reaproveita a mesma coleção/tipo, só que aqui
  filtrado por outro critério (ver abaixo), não por `relacionado`.

`AdversaryItem` (`functions.ts`) é uma união discriminada —
`{ tipo: "enemy"; data: Enemy } | { tipo: "npc"; data: Npc }` — em vez
de achatar os dois formatos num tipo só, já que as fichas são bem
diferentes (combate vs relação/atributos).

**A ligação entre personagem e adversário é uma key nova em
`Character`**: `adversarios_conhecidos?: KnownAdversary[]`, onde
`KnownAdversary = { id: string; tipo: "enemy" | "npc" }`. O `tipo` diz
em qual coleção procurar o `id` — é exatamente esse par que
`getKnownAdversaries(enemies, npcs, known)` resolve pra ficha completa
(ignorando silenciosamente qualquer id que aponte pra um documento que
não existe mais).

## Quem popula `adversarios_conhecidos`

A IA, no encerramento de sessão (ver "Registro de adversários" na doc
do `pages/plataforma`) — nunca esta tela. O payload manda pra IA toda a
coleção `enemies` (`all_enemies`) e os nomes dos adversários já
conhecidos (`known_adversaries`, resolvidos a partir da key atual);
qualquer adversário — criatura ou NPC hostil — que aparecer de forma
relevante na cena (luta, confronto, ameaça direta) volta em
`adversary_encounters` e é adicionado à lista **sem aprovação** (é só
um registro de "o personagem já viu isso", não uma criação de dado
novo). `applyAdversaryEncounters` (`pages/plataforma/functions.ts`)
faz a deduplicação por `tipo:id`.

## Leitura e filtragem

Busca as coleções inteiras (`getEnemies()`/`getNpcs()`, sem filtro) e
resolve localmente pra só os que estão em
`activeCharacter.adversarios_conhecidos` — mesma lógica de "buscar tudo
e filtrar client-side" usada em `pages/relacoes` (Firestore não indexa
bem "array contém este id").

**A busca e os filtros seguem o mesmo padrão das outras telas**
(`components/filter-bar`: caixa de busca + ícone de filtro revelando um
painel com selects). Filtros: Origem (Todos/Adversário/NPC) e
Dificuldade (só se aplica a criaturas — `enemies`; opções construídas a
partir dos adversários já conhecidos, igual ao `feiticos`).

## Layout

Dois painéis (`index.tsx`, `.adversarios-page__layout`): lista à
esquerda (`AdversaryList` — ícone por origem, `Skull` pra criatura,
`Ghost` pra NPC, sem ações — só leitura) e detalhe fixo à direita
(`AdversaryDetail`, condicional por `item.tipo`):

- **Criatura**: imagem, pills de Tipo/Dificuldade/HP/Ano/Defesa/Impacto,
  Local, Características, e um cartão por ataque (principal/secundário)
  com atributo+valor, distância (`getDistanceLabel`, mesmos códigos
  internos do projeto de referência) e efeito.
- **NPC**: mesmo layout de `pages/relacoes` (imagem, tipo/casa/ano/ano
  de campanha, relação/amizade/confiança, características/
  personalidade/detalhes, grade completa dos 18 atributos com ícone via
  `getAttributeIcon` de `@/utils`) — duplicado aqui de propósito
  (páginas não importam componentes umas das outras).
