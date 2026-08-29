import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "../styles/register.css";

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  password_confirm: "",
  preferred_language: "fr",
};

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await register(form);
      navigate("/client", { replace: true });
    } catch (requestError) {
      const data = requestError.response?.data;

      if (data && typeof data === "object") {
        setErrors(data);
      } else {
        setErrors({ detail: "Impossible de créer le compte." });
      }
    } finally {
      setLoading(false);
    }
  }

  function errorFor(field) {
    const value = errors[field];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : String(value);
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        <div className="register-intro">
          <Link className="brand" to="/">
            GYM<span>SAAS</span>
          </Link>
          <span className="eyebrow">REJOIGNEZ LA COMMUNAUTÉ</span>
          <h1>Créez votre espace adhérent.</h1>
          <p>
            Votre compte vous donne accès à votre abonnement, vos paiements,
            vos présences et votre identifiant QR.
          </p>

          <div className="register-benefits">
            <span>✓ Compte adhérent personnel</span>
            <span>✓ Suivi de l’abonnement</span>
            <span>✓ Historique de paiements et présences</span>
          </div>
        </div>

        <form className="register-card" onSubmit={handleSubmit}>
          <div className="auth-language-row"><LanguageSwitcher /></div>
          <div>
            <span className="eyebrow">INSCRIPTION</span>
            <h2>Créer mon compte</h2>
          </div>

          {errors.detail && <div className="form-error">{errorFor("detail")}</div>}
          {errors.non_field_errors && (
            <div className="form-error">{errorFor("non_field_errors")}</div>
          )}

          <div className="register-grid">
            <Field label="Prénom" name="first_name" value={form.first_name} onChange={handleChange} error={errorFor("first_name")} />
            <Field label="Nom" name="last_name" value={form.last_name} onChange={handleChange} error={errorFor("last_name")} />
            <Field label="Nom d'utilisateur" name="username" value={form.username} onChange={handleChange} error={errorFor("username")} />
            <Field label="Téléphone" name="phone" value={form.phone} onChange={handleChange} error={errorFor("phone")} required={false} />
            <Field label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} error={errorFor("email")} wide />
            <Field label="Mot de passe" name="password" type="password" value={form.password} onChange={handleChange} error={errorFor("password")} />
            <Field label="Confirmer le mot de passe" name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} error={errorFor("password_confirm")} />
          </div>

          <button className="btn btn-primary btn-large register-submit" type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>

          <p className="auth-switch">
            Déjà membre ? <Link to="/login">Se connecter</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", value, onChange, error, required = true, wide = false }) {
  return (
    <label className={`register-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} required={required} />
      {error && <small>{error}</small>}
    </label>
  );
}

export default Register;
