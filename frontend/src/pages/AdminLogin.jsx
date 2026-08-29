import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getApiError } from "../services/api";
import { isAdmin } from "../services/roles";
import "../styles/admin-login.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.username.trim(), form.password);

      if (!isAdmin(user)) {
        await logout();
        setError("Ce compte est un compte adhérent. Utilisez l’espace adhérent.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de se connecter à l’administration."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <Link className="brand admin-login-brand" to="/">GYM<span>SAAS</span></Link>

      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="auth-language-row"><LanguageSwitcher /></div>
        <span className="admin-badge">ESPACE DE GESTION</span>
        <h1>Connexion équipe</h1>
        <p>Accès réservé aux super-administrateurs et coordinateurs.</p>

        {error && <div className="form-error" role="alert">{error}</div>}

        <label htmlFor="admin-username">Nom d'utilisateur</label>
        <input id="admin-username" name="username" value={form.username} onChange={handleChange} autoComplete="username" required />

        <label htmlFor="admin-password">Mot de passe</label>
        <input id="admin-password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />

        <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
          {loading ? "Connexion…" : "Connexion administrateur"}
        </button>

        <Link className="admin-back" to="/">← Retour au site public</Link>
      </form>
    </main>
  );
}

export default AdminLogin;
