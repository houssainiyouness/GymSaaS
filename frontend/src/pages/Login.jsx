import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getApiError } from "../services/api";
import { homeForUser } from "../services/roles";
import heroImage from "../assets/hero.png";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      navigate(homeForUser(user), { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de vous connecter."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-image-panel" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-image-overlay">
          <Link className="brand" to="/">GYM<span>SAAS</span></Link>
          <div>
            <span className="eyebrow">ESPACE ADHÉRENT</span>
            <h1>Votre salle, votre abonnement, votre espace.</h1>
            <p>Retrouvez vos paiements, présences, QR code et informations personnelles depuis un seul endroit.</p>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="auth-language-row"><LanguageSwitcher /></div>
          <Link className="login-mobile-brand brand" to="/">GYM<span>SAAS</span></Link>
          <span className="eyebrow">CONNEXION</span>
          <h2>Bienvenue</h2>
          <p className="muted">Utilisez le compte créé pour votre espace GymSaaS.</p>

          {error && <div className="form-error" role="alert">{error}</div>}

          <label htmlFor="username">Nom d'utilisateur</label>
          <input id="username" name="username" value={form.username} onChange={handleChange} autoComplete="username" required />

          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />

          <button className="btn btn-primary btn-large login-submit" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="auth-switch">Pas encore membre ? <Link to="/register">Créer un compte</Link></p>
          <p className="auth-switch"><Link to="/admin-login">Accès équipe de gestion</Link></p>
          <Link className="back-home" to="/">← Retour à l'accueil</Link>
        </form>
      </section>
    </main>
  );
}

export default Login;
