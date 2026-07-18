// src/pages/login/functions.ts
export type AuthMode = "login" | "register";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validacao local antes de chamar o Firebase, para dar feedback rapido. */
export function validateForm(
  mode: AuthMode,
  email: string,
  password: string,
  confirmPassword: string
): string | null {
  if (!EMAIL_RE.test(email)) return "Informe um e-mail válido.";
  if (password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  if (mode === "register" && password !== confirmPassword) {
    return "As senhas não coincidem.";
  }
  return null;
}

// Mapa dos codigos mais comuns do Firebase Auth para mensagens em PT-BR.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "Não existe conta com esse e-mail.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente de novo.",
  "auth/popup-closed-by-user": "Login com Google cancelado.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
};

/** Extrai um `auth/...` code de um erro do Firebase e traduz para PT-BR. */
export function mapAuthError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";

  return AUTH_ERROR_MESSAGES[code] ?? "Não foi possível completar a ação. Tente novamente.";
}
