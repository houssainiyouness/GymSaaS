import { useState } from "react";
import { useNavigate } from "react-router";

import api, { getApiError } from "../services/api";
import "../styles/admin-tools.css";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  password_confirm: "",
  first_name: "",
  last_name: "",
  phone: "",
  preferred_language: "fr",
  birth_date: "",
  address: "",
  emergency_phone: "",
  is_active: true,
};

function AddMember() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function createMember(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/members/admin-create/", {
        ...form,
        birth_date: form.birth_date || null,
      });

      navigate("/members", {
        replace: true,
        state: {
          success: "Membre créé avec succès.",
        },
      });
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de créer ce membre."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Ajouter un membre</h1>

          <p className="muted">
            Créer un nouveau compte adhérent GymSaaS.
          </p>
        </div>

        <button
          className="action-button"
          type="button"
          onClick={() => navigate("/members")}
        >
          ← Retour aux membres
        </button>
      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      <form
        className="card admin-form-card"
        onSubmit={createMember}
      >
        <h2>Nouveau membre</h2>

        <div className="admin-form-grid">

          <Field
            label="Prénom"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
          />

          <Field
            label="Nom"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
          />

          <Field
            label="Nom d'utilisateur"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />

          <Field
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Field
            label="Téléphone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Field
            label="Téléphone d'urgence"
            name="emergency_phone"
            value={form.emergency_phone}
            onChange={handleChange}
          />

          <Field
            label="Date de naissance"
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
          />

          <div className="admin-field">
            <label htmlFor="preferred_language">
              Langue préférée
            </label>

            <select
              id="preferred_language"
              name="preferred_language"
              value={form.preferred_language}
              onChange={handleChange}
            >
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
            </select>
          </div>

          <Field
            label="Mot de passe"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Field
            label="Confirmer le mot de passe"
            name="password_confirm"
            type="password"
            value={form.password_confirm}
            onChange={handleChange}
            required
          />

          <div className="admin-field wide">
            <label htmlFor="member-address">
              Adresse
            </label>

            <textarea
              id="member-address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />

            Compte actif dès la création
          </label>

        </div>

        <div className="form-actions">

          <button
            className="action-button primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Création..."
              : "Créer le membre"}
          </button>

          <button
            className="action-button"
            type="button"
            disabled={saving}
            onClick={() => navigate("/members")}
          >
            Annuler
          </button>

        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
}) {
  return (
    <div className="admin-field">
      <label htmlFor={`member-${name}`}>
        {label}
      </label>

      <input
        id={`member-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

export default AddMember;