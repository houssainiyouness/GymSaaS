import { useEffect, useState } from "react";

import api, {
  getApiError,
} from "../services/api";

import "../styles/admin-tools.css";

const emptyForm = {
  name: "",
  primary_color: "#2563EB",
  secondary_color: "#111827",
  email: "",
  phone: "",
  address: "",
  city: "",
  description: "",
  is_active: true,
};

function GymSettings() {
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadGym() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/gym/");

      if (!response.data?.gym) {
        setForm({
          ...emptyForm,
          ...response.data,
        });
      } else {
        setForm(emptyForm);
      }

      if (response.data?.id) {
        setForm({
          name: response.data.name || "",
          primary_color:
            response.data.primary_color || "#2563EB",
          secondary_color:
            response.data.secondary_color || "#111827",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          city: response.data.city || "",
          description:
            response.data.description || "",
          is_active:
            Boolean(response.data.is_active),
        });

        setLogoUrl(
          response.data.logo_url || "",
        );
      }
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de charger les paramètres.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGym();
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          payload.append(key, value);
        },
      );

      if (logoFile) {
        payload.append(
          "logo",
          logoFile,
        );
      }

      const response = await api.put(
        "/gym/",
        payload,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

      setLogoUrl(
        response.data.logo_url || "",
      );

      setLogoFile(null);

      setSuccess(
        "Paramètres enregistrés avec succès.",
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible d’enregistrer les paramètres.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        Chargement...
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">
            Paramètres de la salle
          </h1>

          <p className="muted">
            Personnalisez les informations
            et l'identité de votre salle.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="form-success">
          {success}
        </div>
      )}

      <form
        className="card admin-form-card"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>
              Nom de la salle
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label>Ville</label>

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>Téléphone</label>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>
              Couleur principale
            </label>

            <input
              type="color"
              name="primary_color"
              value={form.primary_color}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>
              Couleur secondaire
            </label>

            <input
              type="color"
              name="secondary_color"
              value={form.secondary_color}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field wide">
            <label>Adresse</label>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field wide">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>Logo</label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setLogoFile(
                  event.target.files?.[0] ||
                    null,
                )
              }
            />

            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: 90,
                  height: 90,
                  marginTop: 12,
                  objectFit: "contain",
                  borderRadius: 12,
                }}
              />
            )}
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />

            Salle active
          </label>
        </div>

        <div className="form-actions">
          <button
            className="action-button primary"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GymSettings;