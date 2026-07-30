# Locais

Lista de locais que o personagem ativo já conheceu/descobriu — **só
leitura**, mesmo padrão de `pages/adversarios`: sem criar, editar ou
excluir nada aqui. Cadastro da coleção `locations` fica pro dashboard do
mestre (projeto irmão `potter-spells`, aba "Locais"); quem marca um
local como "conhecido" pelo personagem também é lá, não aqui.

## Modelo de dados

`Location` (`utils/types.ts`) — documento da coleção `locations`,
global (sem filtro por dono na leitura, mesmo padrão de `npcs`/
`enemies`): `name`, `type` (Particular/Secreto/Público/Restrito/
Escolar/Comercial/Natural/Histórico/Outro — mesmas opções do
dashboard), `characteristics`, `importance`, `image_url`,
`access_character_ids` (existe no documento, mas **não é o que esta
tela usa** — ver abaixo).

**A ligação com o personagem é `Character.locais_conhecidos?: string[]`**
— mesma mecânica de `adversarios_conhecidos`, só que sem `tipo` porque
só existe uma coleção de locais (nada de "enemy vs npc" pra
desambiguar). Populado pelo botão de relacionar (📍) no dashboard
`potter-spells` (Tabs/Locations), que grava direto no documento do
personagem (`updateDoc(characters/{id}, { locais_conhecidos:
arrayUnion(locationId) })`) — nunca por esta tela nem pela IA (ainda).

`access_character_ids` (no documento do local) é um conceito
**diferente**, do mestre: "quem tem acesso" a esse local, editado no
formulário de cadastro do dashboard. Não confundir os dois — esta
página filtra só por `locais_conhecidos`.

## Leitura e filtragem

Busca a coleção inteira (`getLocations()`, `actions/get/locations.ts`,
sem filtro) e resolve localmente pra só os que estão em
`activeCharacter.locais_conhecidos` (`getKnownLocations`,
`functions.ts`) — mesma abordagem "buscar tudo e filtrar client-side"
de `pages/adversarios`/`pages/relacoes` (Firestore não indexa bem
"array contém este id").

**Busca e filtro seguem o mesmo padrão das outras telas**
(`components/filter-bar`: caixa de busca + ícone de filtro revelando um
painel com select). Único filtro: Tipo (`TYPE_OPTIONS`, mesmas opções
do dashboard).

## Layout

Dois painéis (`index.tsx`, `.locais-page__layout`): lista à esquerda
(`LocationList` — ícone de pin + nome, sem ações, só leitura) e detalhe
fixo à direita (`LocationDetail` — imagem, nome, tipo, características,
importância), mesma estrutura visual do `Side.jsx` do dashboard.
