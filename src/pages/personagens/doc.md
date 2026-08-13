# Personagens

Ficha de personagem num layout de "folha" — cabeçalho ilustrado, textos
livres, cartas de animal/varinha e um carrossel com todos os jogadores da
mesa. A ficha exibida é a do personagem "em vista" (`viewedCharacter`,
estado local — ver Carrossel abaixo), não sempre a do próprio usuário.
Primeira versão: foco no layout, só leitura além do link da imagem do
animal (única edição desta tela, e só quando é o seu próprio personagem
— ver abaixo).

## Cabeçalho (hero)

Foto de fundo por casa (`HOUSE_BACKGROUNDS`, `functions.ts`) — 4 URLs fixas
(uma por casa), decorativas, sem relação com os brasões. Os brasões
(`HOUSE_CRESTS`) são os mesmos arquivos já usados no wizard de criação
(`pages/character-wizard/functions.ts`, `HOUSE_FLAGS` — `griff_flag.png`,
`son_flag.png`, `cor_flag.png`, `luf_flag.png`), reaproveitados aqui em vez
de duplicados.

## Animal e Varinha

**Varinha**: `Character.varinha` guarda só nome da madeira/núcleo e um
texto de bônus já pronto (`madeira`, `miolo`, `atributo`) — as imagens de
carta vêm de `WAND_OPTIONS`/`CORE_OPTIONS` (mesmo arquivo do wizard),
casadas pelo `nome`. Se o personagem tiver madeira/núcleo que não bate com
nenhuma opção do wizard (ficha legada/importada), a imagem cai no
placeholder "Sem madeira"/"Sem núcleo" — o texto (`varinha.atributo`)
continua aparecendo normalmente.

**Animal**: `Character.animal` é só o nome (ex. "Gato") — o bônus exibido
ao lado (`getAnimalBonusLabel`) vem de `ANIMAL_OPTIONS`, casado pelo nome,
mesma lógica da varinha.

## Imagem do animal (`pet_url`)

Único campo editável desta tela, e só quando `viewedCharacter` é o seu
próprio personagem (`isOwnCharacter`, ver Carrossel) — olhando a ficha de
outro jogador da mesa, a imagem aparece igual mas sem botão/modal. Sem
`pet_url` salvo, usa `DEFAULT_PET_IMAGE` (fallback fixo). Clicar na
imagem abre `components/pet-modal` — cola um link, salva com
`updateCharacterPetUrl` (`actions/sets/characters.ts`, grava só esse
campo) e recarrega via `refreshCharacters()` do contexto pra
`activeCharacter.pet_url` refletir o valor novo.

## Carrossel (todos os jogadores da mesa)

**Não** é a lista de personagens do usuário logado, nem filtra por quem
está online — é o roster de quem está sentado na mesa agora, mesmo
padrão do `CharacterPanel` (`roster.tsx`): `[activeCharacter,
...tableCharacters]` (`context/character`; `tableCharacters` vem dos
convites aceitos do anfitrião, populado independente de presença/online).

Navegar pelo carrossel só troca `viewedId` (estado local desta página) —
**não** chama `selectCharacter` nem mexe no personagem ativo global do
usuário (não faria sentido "virar" o personagem de outro jogador). Ao
trocar de `activeCharacter` de verdade (ex. o usuário troca de ficha no
`CharacterPanel`), um efeito realinha `viewedId` de volta pra ele.

As setas andam um por um no roster (wrap circular); os avatares miniatura
(`getCarouselWindow`, até 5 centrados no personagem em vista, com wrap só
quando há mais de 5) também trocam ao clicar. Retrato de cada personagem
é `image_url ?? image_url_ano_1`, igual ao `CharacterPanel`; sem foto,
cai nas iniciais do nome.

## Taça das Casas (`components/house-cup`)

Placar das 4 casas, lido direto de `table.housePoints` (coleção `tables`,
`utils/types.ts` — um número por casa, sempre as 4, iniciadas em 0) via
`buildHouseCupStandings(table)`; não recalcula nada, só ordena. Casa do
personagem em vista fica destacada (escudo `HOUSE_SHIELDS` no topo do
banner + item maior na lista); cada linha usa a arte pronta
`HOUSE_RIBBONS` (já vem com o nome da casa desenhado).

**De onde vem `table`**: `subscribeToTable(hostUserId, ...)`
(`actions/get/table.ts`, tempo real) — mesmo `hostUserId` usado pra montar
`tableCharacters` (`guestSeat?.hostUserId ?? user?.uid`). Documento só
existe depois que o anfitrião cria o primeiro convite ou alguém ganha o
primeiro ponto; até lá, `table` é `null` e as 4 casas aparecem zeradas.

**De onde vêm os pontos**: normalmente só de um lugar — o encerramento de
sessão na Plataforma. A IA já recebe instrução (`buildSessionRegistrationPrompt`,
`pages/plataforma/functions.ts`) pra decidir `house_points_earned` (pode
vir negativo — a própria instrução manda descontar por covardia/maldade
gratuita) junto com o resto do registro (XP, inventário, dinheiro etc.);
ao aplicar a resposta, `pages/plataforma/index.tsx` chama `addHousePoints`
(transação, soma no `pointsForHouse` do personagem **e** no
`housePoints[casa]` do documento da mesa) se o valor vier diferente de
zero. Não existe tela de ajuste manual de pontos — só a IA decide, no
fechamento de cada sessão de cada personagem. Fora isso, `housePoints`
só muda via `recalculateHousePoints` (botão de atualizar do
`CharacterPanel`, recalcula do zero a partir de `players` — conserta
mesas antigas de antes desse campo existir).

**Não** guarda status "conectado" no documento — quem quiser saber quem
está online usa a assinatura de presença que já existe (`presence`,
`isUserOnline` no `CharacterPanel`), não duplicado aqui.
