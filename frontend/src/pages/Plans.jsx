import { useEffect, useState } from "react";
import api, { extractList } from "../services/api";
import "../styles/admin-tools.css";

const emptyForm = { name: "", duration_days: 30, price: "", description: "", is_active: true };

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadPlans() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/plans/");
      setPlans(extractList(response));
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger les formules depuis Django."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function startEdit(plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name || "",
      duration_days: plan.duration_days || 30,
      price: plan.price || "",
      description: plan.description || "",
      is_active: Boolean(plan.is_active),
    });
    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePlan(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const payload = { ...form, duration_days: Number(form.duration_days), price: Number(form.price) };
      if (editingId) {
        await api.patch(`/plans/${editingId}/`, payload);
        setSuccess("Formule modifiée avec succès.");
      } else {
        await api.post("/plans/", payload);
        setSuccess("Formule créée avec succès.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadPlans();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible d’enregistrer cette formule."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(plan) {
    try {
      setError("");
      await api.patch(`/plans/${plan.id}/`, { is_active: !plan.is_active });
      setSuccess(plan.is_active ? "Formule désactivée." : "Formule réactivée.");
      await loadPlans();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de modifier la formule."));
    }
  }

  async function deletePlan(plan) {
    if (!window.confirm(`Supprimer la formule « ${plan.name} » ?`)) return;
    try {
      setError("");
      await api.delete(`/plans/${plan.id}/`);
      setSuccess("Formule supprimée.");
      await loadPlans();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de supprimer cette formule. Elle peut être utilisée par un abonnement."));
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Formules d'abonnement</h1>
          <p className="muted">Créez et gérez les offres proposées aux adhérents.</p>
        </div>
        <button className="action-button primary" type="button" onClick={startCreate}>+ Nouvelle formule</button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showForm && (
        <form className="card admin-form-card" onSubmit={savePlan}>
          <h2>{editingId ? "Modifier la formule" : "Nouvelle formule"}</h2>
          <div className="admin-form-grid">
            <Field label="Nom" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Durée (jours)" name="duration_days" type="number" min="1" value={form.duration_days} onChange={handleChange} required />
            <Field label="Prix (DH)" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} required />
            <label className="checkbox-field"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Formule active</label>
            <div className="admin-field wide"><label htmlFor="plan-description">Description</label><textarea id="plan-description" name="description" value={form.description} onChange={handleChange} /></div>
          </div>
          <div className="form-actions">
            <button className="action-button primary" type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            <button className="action-button" type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card muted">Chargement des formules...</div>
      ) : (
        <div className="grid stats-grid">
          {plans.map((plan) => (
            <div className="card" key={plan.id}>
              <div style={styles.header}>
                <h2 style={{ margin: 0 }}>{plan.name}</h2>
                <span className={`badge ${plan.is_active ? "active" : "expired"}`}>{plan.is_active ? "Active" : "Inactive"}</span>
              </div>
              <div style={styles.price}>{formatMoney(plan.price)} DH</div>
              <p className="muted">{plan.duration_days} jours</p>
              {plan.description && <p>{plan.description}</p>}
              <div className="plan-card-actions">
                <button className="action-button" type="button" onClick={() => startEdit(plan)}>Modifier</button>
                <button className={`action-button ${plan.is_active ? "warning" : "success"}`} type="button" onClick={() => togglePlan(plan)}>{plan.is_active ? "Désactiver" : "Réactiver"}</button>
                <button className="action-button danger" type="button" onClick={() => deletePlan(plan)}>Supprimer</button>
              </div>
            </div>
          ))}
          {plans.length === 0 && <div className="card muted">Aucune formule enregistrée.</div>}
        </div>
      )}
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, required = false, ...rest }) {
  return <div className="admin-field"><label htmlFor={`plan-${name}`}>{label}</label><input id={`plan-${name}`} name={name} type={type} value={value} onChange={onChange} required={required} {...rest} /></div>;
}

function formatMoney(value) { return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)); }
function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") {
    const values = Object.entries(data).flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map((message) => `${field}: ${message}`));
    if (values.length) return values.join(" ");
  }
  return fallback;
}

const styles = { header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, price: { fontSize: 32, fontWeight: 900, marginTop: 18 } };
export default Plans;
