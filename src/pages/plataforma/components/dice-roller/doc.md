# DiceRoller

Fileira de dados (d4–d20) + modal de resultado, na página `Plataforma`.

`rolledDie` é controlado pelo pai (`pages/plataforma/index.tsx`), que
também guarda `history` — `onRoll(sides)` é a função `rollDie` do pai,
que sorteia o resultado, atualiza `rolledDie` e adiciona a rolagem em
`history`. Isso também é o motivo de `rolledDie` não ser estado local
daqui: o listener de Esc global da página precisa conseguir fechar o
modal de resultado junto com os outros overlays (configurações, forms
de imagem etc).

O modal de resultado reaproveita as classes genéricas de modal
(`platform-modal`, `platform-modal__panel`, `platform-modal__close`,
`platform-modal__primary`...) definidas em `pages/plataforma/style.scss`
— compartilhadas com `ImageShareModal`, `ImagePreviewModal` e
`SettingsModal`.
