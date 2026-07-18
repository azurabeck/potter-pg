# AuthProvider / useAuth

Contexto React que espelha o estado de autenticação do Firebase
(`onAuthStateChanged`) para o resto da aplicação.

- `AuthProvider` deve envolver todo o app (feito em `main.tsx`, por fora do
  `BrowserRouter`).
- `useAuth()` retorna `{ user, loading }`:
  - `loading` é `true` só na primeira checagem (evita "piscar" a tela de
    login antes do Firebase confirmar se já existe sessão).
  - `user` é `null` quando ninguém está logado.

`App.tsx` usa esses dois valores para decidir entre mostrar `Login`
(`pages/login`) ou o shell normal da aplicação (Sidebar/Navbar/Routes).

As ações de login/cadastro/logout ficam em `actions/auth/session.ts`,
nunca chamadas diretamente pelos components.
