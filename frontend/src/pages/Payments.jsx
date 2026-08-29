import { useEffect, useState } from "react";
import api, { extractList } from "../services/api";
import "../styles/admin-tools.css";

const methodLabels = { CASH: "Espèces", CARD: "Carte", TRANSFER: "Virement" };
const emptyForm = { subscription: "", amount: "", method: "CASH", reference: "", notes: "" };

function Payments() {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [paymentsResponse, subscriptionsResponse] = await Promise.all([
        api.get("/payments/"),
        api.get("/subscriptions/"),
      ]);
      setPayments(extractList(paymentsResponse));
      setSubscriptions(extractList(subscriptionsResponse));
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger les paiements depuis Django."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createPayment(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/payments/", {
        subscription: Number(form.subscription),
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference.trim(),
        notes: form.notes.trim(),
      });
      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Paiement enregistré avec succès.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible d’enregistrer ce paiement."));
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(payment) {
    if (!window.confirm(`Supprimer le paiement de ${formatMoney(payment.amount)} DH ?`)) return;
    try {
      setError("");
      await api.delete(`/payments/${payment.id}/`);
      setSuccess("Paiement supprimé.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de supprimer ce paiement."));
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="muted">Enregistrez les règlements associés aux abonnements.</p>
        </div>
        <button className="action-button primary" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? "Fermer" : "+ Enregistrer un paiement"}</button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showForm && (
        <form className="card admin-form-card" onSubmit={createPayment}>
          <h2>Nouveau paiement</h2>
          <div className="admin-form-grid">
            <div className="admin-field wide">
              <label htmlFor="payment-subscription">Abonnement</label>
              <select id="payment-subscription" name="subscription" value={form.subscription} onChange={handleChange} required>
                <option value="">Sélectionner un abonnement</option>
                {subscriptions.map((subscription) => (
                  <option key={subscription.id} value={subscription.id}>
                    {subscription.member_name || `Membre #${subscription.member}`} — {subscription.plan_name || `Formule #${subscription.plan}`} ({subscription.status_display || subscription.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field"><label htmlFor="payment-amount">Montant (DH)</label><input id="payment-amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required /></div>
            <div className="admin-field">
              <label htmlFor="payment-method">Méthode</label>
              <select id="payment-method" name="method" value={form.method} onChange={handleChange}>
                <option value="CASH">Espèces</option><option value="CARD">Carte</option><option value="TRANSFER">Virement</option>
              </select>
            </div>
            <div className="admin-field wide"><label htmlFor="payment-reference">Référence</label><input id="payment-reference" name="reference" value={form.reference} onChange={handleChange} placeholder="Optionnel" /></div>
            <div className="admin-field wide"><label htmlFor="payment-notes">Notes</label><textarea id="payment-notes" name="notes" value={form.notes} onChange={handleChange} /></div>
          </div>
          <div className="form-actions">
            <button className="action-button primary" type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer le paiement"}</button>
            <button className="action-button" type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Annuler</button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        {loading ? <p className="muted">Chargement des paiements...</p> : (
          <table>
            <thead><tr><th>Adhérent</th><th>Formule</th><th>Montant</th><th>Reste</th><th>Méthode</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.member_name || "-"}</td>
                  <td>{payment.plan_name || "-"}</td>
                  <td>{formatMoney(payment.amount)} DH</td>
                  <td>{formatMoney(payment.remaining_amount)} DH</td>
                  <td>{methodLabels[payment.method] || payment.method}</td>
                  <td>{formatDateTime(payment.paid_at)}</td>
                  <td><button className="action-button danger" type="button" onClick={() => deletePayment(payment)}>Supprimer</button></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="7" className="muted">Aucun paiement trouvé.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatMoney(value) { return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)); }
function formatDateTime(value) { if (!value) return "-"; return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") {
    const values = Object.entries(data).flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map((message) => `${field}: ${message}`));
    if (values.length) return values.join(" ");
  }
  return fallback;
}
export default Payments;
