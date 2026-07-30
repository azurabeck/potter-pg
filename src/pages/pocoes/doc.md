# Página: Poções

Mesmo layout de `pages/feiticos` (grade de cartas, busca, filtros,
paginação de tamanho dinâmico) — código deliberadamente duplicado, não
compartilhado, seguindo a mesma convenção de página autocontida que o
resto do app usa. As diferenças ficam todas no formato do dado e no
conteúdo do modal de detalhe.

## Fluxo de dados

1. `getPotions()` (`actions/get/potions.ts`) busca todos os documentos
   da coleção `potions`, ordenados por `ano`.
2. `FilterBar` filtra a lista em memória (`applyFilters`) por
   busca/ano/nível/status — sem "atributo"/"categoria" como em
   feitiços, porque poção não tem esses campos.
3. `paginatePotions` fatia o resultado filtrado em páginas de tamanho
   dinâmico, calculado do mesmo jeito que feitiços
   (`calculateGridMetrics`, ver doc de `feiticos` pra como isso
   funciona — a lógica foi copiada igual).
4. Slots vazios da última linha são preenchidos com `LockedSlot`.
5. Clicar num `PotionCard` guarda a poção em `selectedPotion` e abre
   `PotionDetailModal`.

## Formato do documento (`Potion`, `utils/types.ts`)

Diferente de `Spell`, os campos ficam direto na raiz do documento, sem
wrapper `attributes`:

```json
{
  "id": "...",
  "name": "Chelidonium Miniscula",
  "ano": 1,
  "ingredientes_info": [{ "value": "91 ml", "name": "...", "shop": "...", "drop": "...", "note": "" }],
  "cooking": "Aqueça em fogo baixo...",
  "nivel": "Muito Fácil",
  "xp_maestria": { "M1": 1, "M2": 2, "...": "...", "M10": 50 },
  "xp_total": 50,
  "aula": "Poções",
  "card_image_url": "",
  "image_url": "https://...",
  "effect": "...",
  "mastery_effect": [{ "mastery": "1-4", "effect": "...", "recipe": "..." }]
}
```

## Bloqueado vs. desbloqueado

`isPotionLocked` (em `utils/index.ts`, ao lado de `isSpellLocked`):
desbloqueada quando o personagem ativo tem uma entrada em `pocoes` cuja
chave é o id da poção (mesmo id do documento na coleção `potions`).
Sem personagem ativo, sempre bloqueada — diferente de feitiço, poção
não tem um campo `required` pra comparar contra o
`CURRENT_CHARACTER_STUB`. A imagem usada segue a mesma ideia de
feitiço: desbloqueada prefere `card_image_url` (com fallback pra
`image_url`, já que a maioria ainda não tem arte completa cadastrada);
bloqueada usa `image_url`.

## `PotionDetailModal`

Layout em duas colunas como `SpellDetailModal`, mas o conteúdo é
diferente:

- **Cabeçalho**: nome + badge com `nivel` (a dificuldade da poção —
  "Muito Fácil", "Fácil" etc., mesma escala de `services/
  ai_prompt_defaults.ts` → `MASTERY_AND_ATTRIBUTES`).
- **Meta**: ano e "XP atual/total" — o atual vem de
  `activeCharacter.pocoes[potion.id]?.xp ?? 0` (calculado pela página,
  não pelo modal, e passado via prop `currentXp`), o total de
  `potion.xp_total`.
- **Efeito**: `potion.effect`, direto.
- **Preparo**: `potion.cooking`.
- **Ingredientes**: lista colapsada por padrão (`expandedIngredient`,
  só um aberto por vez) — expandir mostra loja (`shop`), onde
  encontrar (`drop`) e observação (`note`, se houver).
- **Efeito por Maestria**: cada faixa de `mastery_effect` (`"1-4"`,
  `"5-9"`, `"10"`) vira um item, com o efeito e a receita
  (`recipe`). A faixa que contém a maestria atual do jogador fica
  destacada (`--current`, tag "Atual") — `currentMasteryTier`
  (`functions.ts`) calcula a maestria (0-10) comparando `currentXp`
  contra `xp_maestria`, igual à regra descrita no livro do Flitwick
  (`pages/livraria`); `matchesMasteryRange` decide se essa maestria cai
  dentro da faixa de cada `mastery_effect`.
