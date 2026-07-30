# Relações

Lista de NPCs relacionados ao personagem ativo, com painel de detalhe e
edição/exclusão por item — inspirado na aba "Relations" de um projeto
irmão (`GameData/Tabs/Relations`), mas simplificado: **quem cria um NPC
vai ser a IA**, não o jogador manualmente, então esta tela não tem "novo
NPC"/importar em lote/vincular NPC existente — só carrega, edita e
exclui o que já existe.

## Modelo de dados

NPCs moram numa coleção **separada**, `npcs` — confirmado no console do
Firebase do projeto (não é `character_type: "npc"` dentro de
`characters`, como uma primeira versão desta integração assumiu por
engano, copiando a estrutura do projeto de referência de cabeça em vez
de conferir os dados reais). `Npc` (`utils/types.ts`) é um tipo
próprio, sem relação com `Character`:

- `relacionado?: string[] | string` — ids dos personagens (`player`) que
  este NPC está relacionado. Aceita string única além de array (dado
  legado, mesma leniência do projeto de referência).
- `tipo?: string` — Aluno/Professor/Criatura/Visitante/Mistério/Outro.
- `relacao?: string` — Amigo/Suspeito/Inimigo/Conhecido/Mistério.
- `confianca?: number` / `amizade?: number` — os dois medidores mostrados
  no painel de detalhe.
- `caracteristicas`/`personalidade`/`detalhes` — texto livre.
- `atributos: Record<string, number>` — as 18 chaves em português
  (Coragem, Inteligência, Agilidade, ...), confirmadas nos dados reais.

**Vários campos têm mais de um nome possível** nos documentos reais —
mesma leniência defensiva do projeto de referência
(`getNpcYear`/`getNpcStudentYear` de lá): `ano`/`year` (ano do NPC),
`student_year`/`studentYear` (ano da campanha em que apareceu — o
equivalente ao "ano de campanha" mostrado nesta tela), `casa`/`house`.
Os accessors `getNpcAno`/`getNpcCampaignYear`/`getNpcHouse`
(`functions.ts`) resolvem qual nome está preenchido — **sempre use eles
em vez de ler o campo direto**, porque não dá pra garantir qual nome
cada NPC já cadastrado usa.

## Leitura e filtragem

Igual ao projeto de referência: busca a coleção inteira de NPCs
(`getNpcs()`, `actions/get/npcs.ts` — sem filtro nenhum, nem por dono)
e filtra **client-side** pelos que têm o personagem ativo em
`relacionado` (`getRelatedNpcs`, `pages/relacoes/functions.ts`). Não
existe (e não existiu na referência) uma query por `relacionado` —
Firestore não indexa bem "array contém este id" combinado com outros
filtros, então é mais simples buscar tudo e filtrar depois, igual lá.

`getNpcs()` também é usado por `actions/ai/context.ts` (contexto da IA
na Plataforma) e pelo seletor "Quem é a IA?" do `SettingsModal` — os
três consumidores de NPC do projeto compartilham essa única leitura.
Antes desta correção, os três liam a coleção errada (`characters` com
`character_type == "npc"`, que nunca teve nenhum documento de verdade)
e por isso nunca mostravam nada.

## Layout

Dois painéis (`index.tsx`, `.relacoes-page__layout`): lista à esquerda
(`RelationList` — nome + editar + excluir por linha) e detalhe fixo à
direita (`RelationDetail` — imagem, tipo/casa/ano/ano de campanha,
amizade/confiança, características/personalidade/detalhes, grade
completa dos 18 atributos com ícone via `getAttributeIcon` de
`@/utils`).

**A busca e os filtros seguem o mesmo padrão das outras telas**
(`components/filter-bar`, cópia do padrão de `feiticos`/`atributos`:
caixa de busca + ícone de filtro revelando um painel com selects).
Filtros: Tipo, Relação, Ano, Ano campanha (`buildFilterOptions` monta as
opções de Ano/Ano campanha a partir dos NPCs já relacionados ao
personagem ativo, igual ao `feiticos`).

## Modal

`relation-form-modal` — só edição (recebe `relation: Npc` obrigatório,
sem modo de criação): imagem (URL + preview), tipo/relação (select),
casa/ano/ano de campanha/confiança/amizade, grade de inputs pra cada um
dos 18 atributos (0-15), 3 textareas (características
físicas/personalidade/detalhes). Ao salvar, sempre escreve nos nomes de
campo "canônicos" (`ano`, `casa`, `student_year`) mesmo que o documento
original usasse a variante alternativa (`year`/`house`) — como os
accessors sempre preferem o campo canônico primeiro, isso não quebra
nada, só "migra" o NPC pro nome padrão na próxima edição. Não mexe em
`relacionado`/`user_id`/`habilidades`/`pocoes` — preserva o que já
estava lá. Usa `components/modal-shell` (overlay + painel + fechar com
Escape), local desta página.

## Quem popula `relacionado` (a IA, no encerramento de sessão)

A primeira versão desta página tinha CRUD completo, igual ao projeto de
referência: criar NPC novo, vincular um NPC já existente a um
personagem específico, migrar relações antigas e importar/copiar em
lote. Foi revertido porque **quem cria/vincula um NPC no potter-pg é a
IA**, não o jogador manualmente — esse fluxo já está implementado, como
parte do registro de sessão (ver "Registro de NPCs" na doc do
`pages/plataforma`, seção "Encerrar sessão"): ao fechar a sessão, a IA
olha quem apareceu na narração e decide, por NPC, entre 3 casos —
já conhecido (nada a fazer), já existe mas ainda não relacionado
(vincula direto, `linkNpcToCharacter`) ou totalmente novo (sugere a
ficha completa, só cria depois que o jogador aprova no
`EndSessionModal`, `createNpcFromSuggestion`). Ambas as ações moram em
`actions/sets/npcs.ts`, junto de `updateNpc`/`deleteNpc` (as únicas
escritas que esta página em si ainda faz).

Se precisar popular `relacionado` manualmente por outro motivo
(depuração, corrigir um vínculo que a IA errou), os arquivos de CRUD
completo removidos (`bulk-json-modal`, `copy-modal`,
`migrateLegacyNpcRelations`) são simples de reconstruir seguindo o
mesmo padrão desta página — ou editar direto no console do Firebase.
