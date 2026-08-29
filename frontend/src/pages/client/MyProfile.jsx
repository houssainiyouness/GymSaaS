import { useEffect, useState } from "react";
import api from "../../services/api";
import { getCurrentUser, getStoredUser } from "../../services/auth";
import { saveTokens } from "../../services/session";
import "../../styles/client-portal.css";

const emptyPasswordForm = { old_password: "", new_password: "", new_password_confirm: "" };

function MyProfile() {
  const [user, setUser] = useState(getStoredUser());
  const [member, setMember] = useState(null);
  const [form, setForm] = useState(null);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const [profileResponse, currentUser] = await Promise.all([
        api.get("/me/profile/"),
        getCurrentUser(),
      ]);
      const profile = profileResponse.data;
      setMember(profile);
      setUser(currentUser);
      setForm({
        first_name: currentUser?.first_name || "",
        last_name: currentUser?.last_name || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        preferred_language: currentUser?.preferred_language || "fr",
        birth_date: profile?.birth_date || "",
        address: profile?.address || "",
        emergency_phone: profile?.emergency_phone || "",
      });
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger votre profil."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.patch("/me/profile/", { ...form, birth_date: form.birth_date || null });
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setEditing(false);
      setSuccess("Profil mis à jour avec succès.");
      await loadProfile();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de modifier votre profil."));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      setPasswordSaving(true);
      setError("");
      setSuccess("");
      const response = await api.post("/auth/change-password/", passwordForm);
      saveTokens(response.data.access, response.data.refresh);
      setPasswordForm(emptyPasswordForm);
      setSuccess(response.data.detail || "Mot de passe modifié avec succès.");
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de modifier le mot de passe."));
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return <div className="client-page"><div className="client-panel client-empty">Chargement du profil...</div></div>;
  }

  return (
    <div className="client-page">
      <div className="client-page-heading">
        <span className="eyebrow">PROFIL</span>
        <h1>Mon profil</h1>
        <p>Consultez et modifiez vos informations personnelles.</p>
      </div>

      {error && <div className="client-profile-message error">{error}</div>}
      {success && <div className="client-profile-message success">{success}</div>}

      <article className="client-panel profile-card">
        <div className="profile-header-row">
          <div className="profile-identity">
            <div className="profile-avatar">{initials(user?.full_name || user?.username)}</div>
            <div className="profile-name"><h2>{user?.full_name || user?.username}</h2><span>Adhérent GymSaaS</span></div>
          </div>
          {!editing && <button className="client-profile-button primary" type="button" onClick={() => setEditing(true)}>Modifier mon profil</button>}
        </div>

        {editing ? (
          <form className="client-profile-form" onSubmit={saveProfile}>
            <div className="client-form-grid">
              <ProfileField label="Prénom" name="first_name" value={form?.first_name || ""} onChange={handleProfileChange} />
              <ProfileField label="Nom" name="last_name" value={form?.last_name || ""} onChange={handleProfileChange} />
              <ProfileField label="E-mail" name="email" type="email" value={form?.email || ""} onChange={handleProfileChange} required />
              <ProfileField label="Téléphone" name="phone" value={form?.phone || ""} onChange={handleProfileChange} />
              <ProfileField label="Date de naissance" name="birth_date" type="date" value={form?.birth_date || ""} onChange={handleProfileChange} />
              <ProfileField label="Téléphone d'urgence" name="emergency_phone" value={form?.emergency_phone || ""} onChange={handleProfileChange} />
              <div className="client-profile-field">
                <label htmlFor="preferred_language">Langue préférée</label>
                <select id="preferred_language" name="preferred_language" value={form?.preferred_language || "fr"} onChange={handleProfileChange}>
                  <option value="fr">Français</option><option value="ar">Arabe</option>
                </select>
              </div>
              <div className="client-profile-field wide"><label htmlFor="profile-address">Adresse</label><textarea id="profile-address" name="address" value={form?.address || ""} onChange={handleProfileChange} /></div>
            </div>
            <div className="client-profile-actions">
              <button className="client-profile-button primary" type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
              <button className="client-profile-button" type="button" onClick={() => { setEditing(false); loadProfile(); }}>Annuler</button>
            </div>
          </form>
        ) : (
          <div className="detail-grid profile-details">
            <Detail label="Nom d'utilisateur" value={user?.username} />
            <Detail label="E-mail" value={user?.email || "—"} />
            <Detail label="Téléphone" value={user?.phone || "—"} />
            <Detail label="Langue" value={user?.preferred_language === "ar" ? "Arabe" : "Français"} />
            <Detail label="Date d'inscription" value={member?.joined_at ? formatDate(member.joined_at) : "—"} />
            <Detail label="Date de naissance" value={member?.birth_date ? formatDate(member.birth_date) : "Non renseignée"} />
            <Detail label="Téléphone d'urgence" value={member?.emergency_phone || "Non renseigné"} />
            <Detail label="Adresse" value={member?.address || "Non renseignée"} wide />
          </div>
        )}
      </article>

      <article className="client-panel password-card">
        <div className="client-page-heading compact"><span className="eyebrow">SÉCURITÉ</span><h2>Changer mon mot de passe</h2><p>Après le changement, votre session sécurisée est renouvelée automatiquement.</p></div>
        <form className="client-profile-form" onSubmit={changePassword}>
          <div className="client-form-grid">
            <ProfileField label="Ancien mot de passe" name="old_password" type="password" value={passwordForm.old_password} onChange={handlePasswordChange} required />
            <ProfileField label="Nouveau mot de passe" name="new_password" type="password" value={passwordForm.new_password} onChange={handlePasswordChange} required />
            <ProfileField label="Confirmer le nouveau mot de passe" name="new_password_confirm" type="password" value={passwordForm.new_password_confirm} onChange={handlePasswordChange} required />
          </div>
          <div className="client-profile-actions"><button className="client-profile-button primary" type="submit" disabled={passwordSaving}>{passwordSaving ? "Modification..." : "Changer le mot de passe"}</button></div>
        </form>
      </article>
    </div>
  );
}

function ProfileField({ label, name, type = "text", value, onChange, required = false }) {
  return <div className="client-profile-field"><label htmlFor={`profile-${name}`}>{label}</label><input id={`profile-${name}`} name={name} type={type} value={value} onChange={onChange} required={required} /></div>;
}
function Detail({ label, value, wide = false }) { return <div className={`client-detail ${wide ? "wide" : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function initials(name = "?") { return name.split(" ").filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value)); }
function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.non_field_errors?.[0] === "string") return data.non_field_errors[0];
  if (data && typeof data === "object") {
    const values = Object.entries(data).flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map((message) => `${field}: ${message}`));
    if (values.length) return values.join(" ");
  }
  return fallback;
}
export default MyProfile;
