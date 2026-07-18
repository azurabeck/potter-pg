# StatsBar

Faixa fixa abaixo do `Navbar` com HP/MP/XP, moedas, atributos, casa e a
meta atual do personagem.

- Moedas (`dinheiro`) e atributos (`atributos`) vêm de
  `useCharacter().activeCharacter` (`context/character`) quando existe um
  personagem real selecionado. `atributos` é um mapa dinâmico
  (`Record<string, number>`) — cada personagem pode ter um conjunto
  diferente de atributos, então a lista é renderizada por
  `Object.entries` e o ícone de cada um vem de `getAttributeIcon`
  (`functions.ts`, com fallback `Sparkles` para nomes não mapeados).
- HP/MP/XP, casa e meta atual continuam vindo de `CURRENT_CHARACTER_STUB`
  (`services/genene_settings.ts`), porque esses campos ainda não existem
  nos documentos reais de `characters`. Sem personagem ativo, moedas e
  atributos também caem no stub (`FALLBACK_ATTRIBUTES` normaliza os nomes
  do stub para o mesmo formato title-case usado pelos personagens reais).
- O X no canto superior direito chama `hideSheet()` (`context/character`)
  e a barra inteira some (`sheetVisible === false` → componente retorna
  `null`). Ela volta a aparecer quando o usuário clica no avatar/nome no
  `Navbar` (que chama `showSheet()`).
