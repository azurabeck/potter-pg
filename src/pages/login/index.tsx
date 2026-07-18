// src/pages/login/index.tsx
import { useState, type FormEvent } from "react";
import { ShieldHalf, Loader2 } from "lucide-react";
import { APP_NAME } from "@/services/genene_settings";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/actions/auth/session";
import { mapAuthError, validateForm, type AuthMode } from "./functions";
import "./style.scss";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  function toggleMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
    setConfirmPassword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = validateForm(mode, email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <div className="login-page__brand">
          <ShieldHalf className="login-page__brand-icon" />
          <span>{APP_NAME}</span>
        </div>

        <h1 className="login-page__title">
          {isRegister ? "Criar conta" : "Entrar"}
        </h1>

        <form className="login-page__form" onSubmit={handleSubmit}>
          <label className="login-page__field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={submitting}
            />
          </label>

          <label className="login-page__field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={submitting}
            />
          </label>

          {isRegister && (
            <label className="login-page__field">
              <span>Confirmar senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={submitting}
              />
            </label>
          )}

          {error && <p className="login-page__error">{error}</p>}

          <button type="submit" className="login-page__submit" disabled={submitting}>
            {submitting && <Loader2 className="login-page__spinner" size={16} />}
            {isRegister ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <div className="login-page__divider">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="login-page__google"
          onClick={handleGoogleLogin}
          disabled={submitting}
        >
          Entrar com Google
        </button>

        <p className="login-page__toggle">
          {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          <button type="button" onClick={toggleMode} disabled={submitting}>
            {isRegister ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
}
