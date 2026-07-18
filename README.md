# Potter-PG

Painel de personagem de RPG (React + Vite + SCSS + Firebase/Firestore).

## Stack

- **React 18** + **TypeScript** + **Vite**
- **SCSS** (sem framework de UI)
- **Firebase / Firestore** para dados
- **react-router-dom** para rotas
- **lucide-react** para ícones

## Rodando o projeto

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:5173`. A rota inicial (`/`) redireciona
para `/feiticos`, a primeira página implementada.

## Firestore

O app lê a coleção **`spell`** (veja `src/services/genene_settings.ts`
→ `COLLECTIONS.SPELLS`). Cada documento deve seguir o formato de
`src/utils/types.ts` (`Spell` / `SpellAttributes`) — veja também o
exemplo `sample_spell_firestore.txt` fornecido, que corresponde ao
feitiço "Incendio".

Campos usados para a carta:

- `attributes.card_image_url` → imagem exibida quando o feitiço está
  **desbloqueado**.
- `attributes.image_url` → imagem exibida quando o feitiço está
  **bloqueado**.

## Arquitetura de pastas

```
src/
├── assets/
│   ├── images/
│   └── styles/            # tokens SCSS globais (_variables, global.scss)
├── components/             # componentes reutilizáveis em qualquer página
│   ├── buttons/
│   ├── navbar/
│   ├── sidebar/
│   ├── statsbar/
│   └── pagination/
├── pages/
│   └── feiticos/            # página atual
│       ├── index.tsx
│       ├── functions.ts
│       ├── style.scss
│       ├── doc.md
│       └── components/       # componentes usados só nesta página
│           ├── filter-bar/
│           ├── spell-card/
│           └── locked-slot/
├── services/
│   ├── firebase_settings.ts # init do Firebase/Firestore
│   ├── genene_settings.ts   # constantes gerais do app
│   └── routes.ts             # rotas + itens de navegação
├── actions/
│   ├── get/spells.ts          # leituras no Firestore
│   ├── sets/spells.ts          # criação de documentos
│   └── updates/spells.ts       # atualização de documentos
└── utils/                     # funções e tipos usados em vários lugares
```

Cada pasta de componente/página segue o padrão `index.tsx` (markup),
`functions.ts` (lógica), `style.scss` (estilo) e `doc.md` (documentação
curta), conforme o diagrama de arquitetura do projeto.
