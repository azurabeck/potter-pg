# Página: Login

Tela exibida no lugar do app inteiro (`App.tsx`) quando `useAuth()`
(`context/auth`) retorna `user: null`. Alterna entre "Entrar" e "Criar
conta" no mesmo card, sem rota própria.

## Fluxo

1. `validateForm` (`functions.ts`) checa e-mail/senha localmente antes de
   chamar o Firebase (feedback imediato, sem round-trip).
2. Login e cadastro por e-mail/senha chamam `loginWithEmail` /
   `registerWithEmail` (`actions/auth/session.ts`). Login com Google chama
   `loginWithGoogle` (popup do `GoogleAuthProvider`).
3. Erros do Firebase (`error.code`) são traduzidos para PT-BR por
   `mapAuthError`.
4. Em caso de sucesso, `onAuthStateChanged` (dentro do `AuthProvider`)
   detecta a nova sessão e `App.tsx` troca a tela de Login pelo shell
   normal automaticamente — este componente não precisa redirecionar.

Logout fica no botão de menu do `Navbar` (`components/navbar`).
