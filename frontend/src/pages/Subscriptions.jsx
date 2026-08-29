import { useEffect, useMemo, useState } from "react";
import api, { extractList } from "../services/api";
import "../styles/admin-tools.css";

const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  member: "",
  plan: "",
  start_date: today,
  is_suspended: false,
  create_payment: false,
  payment_method: "CASH",
};

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(form.plan)) || null,
    [plans, form.plan],
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [subscriptionsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get("/subscriptions/"),
        api.get("/members/"),
        api.get("/plans/"),
      ]);
      setSubscriptions(extractList(subscriptionsResponse));
      setMembers(extractList(membersResponse));
      setPlans(extractList(plansResponse));
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger les abonnements depuis Django."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

async function createSubscription(event) {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const subscriptionResponse = await api.post("/subscriptions/", {
      member: Number(form.member),
      plan: Number(form.plan),
      start_date: form.start_date,
      is_suspended: form.is_suspended,
    });

    const subscription = subscriptionResponse.data;

    if (form.create_payment) {
      try {
        await api.post("/payments/", {
          subscription: subscription.id,
          amount: Number(
            subscription.price_at_subscription ||
            selectedPlan?.price ||
            0
          ),
          method: form.payment_method,
          reference: "",
          notes: "Paiement enregistré automatiquement lors de la création de l’abonnement.",
        });
      } catch (paymentError) {
        setForm(emptyForm);
        setShowForm(false);

        setSuccess(
          "Abonnement créé, mais le paiement automatique n’a pas pu être enregistré."
        );

        setError(
          getApiError(
            paymentError,
            "Erreur lors de la création automatique du paiement."
          )
        );

        await loadData();
        return;
      }
    }

    setForm(emptyForm);
    setShowForm(false);

    setSuccess(
      form.create_payment
        ? "Abonnement et paiement créés avec succès."
        : "Abonnement créé avec succès."
    );

    await loadData();
  } catch (requestError) {
    setError(
      getApiError(
        requestError,
        "Impossible de créer cet abonnement."
      )
    );
  } finally {
    setSaving(false);
  }
}

  async function toggleSuspension(subscription) {
    try {
      setError("");
      setSuccess("");
      await api.patch(`/subscriptions/${subscription.id}/`, { is_suspended: !subscription.is_suspended });
      setSuccess(subscription.is_suspended ? "Abonnement réactivé." : "Abonnement suspendu.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de modifier cet abonnement."));
    }
  }

  async function deleteSubscription(subscription) {
    if (!window.confirm(`Supprimer l’abonnement de ${subscription.member_name || "ce membre"} ?`)) return;
    try {
      setError("");
      await api.delete(`/subscriptions/${subscription.id}/`);
      setSuccess("Abonnement supprimé.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de supprimer cet abonnement."));
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Abonnements</h1>
          <p className="muted">Affectez une formule à un membre et gérez les suspensions.</p>
        </div>
        <button className="action-button primary" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? "Fermer" : "+ Nouvel abonnement"}</button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {showForm && (
        <form className="card admin-form-card" onSubmit={createSubscription}>
          <h2>Nouvel abonnement</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="subscription-member">Membre</label>
              <select id="subscription-member" name="member" value={form.member} onChange={handleChange} required>
                <option value="">Sélectionner un membre</option>
                {members.filter((member) => member.is_active).map((member) => <option key={member.id} value={member.id}>{member.full_name || member.username}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="subscription-plan">Formule</label>
              <select id="subscription-plan" name="plan" value={form.plan} onChange={handleChange} required>
                <option value="">Sélectionner une formule</option>
                {plans.filter((plan) => plan.is_active).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {formatMoney(plan.price)} DH</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="subscription-price">Prix automatique</label>
              <input
                id="subscription-price"
                value={selectedPlan ? `${formatMoney(selectedPlan.price)} DH` : "Sélectionnez une formule"}
                readOnly
                aria-describedby="subscription-price-help"
              />
              <small id="subscription-price-help" className="muted">Le prix est enregistré par Django à partir de la formule.</small>
            </div>
            <div className="admin-field"><label htmlFor="subscription-start">Date de début</label><input id="subscription-start" name="start_date" type="date" value={form.start_date} onChange={handleChange} required /></div>
            <label className="checkbox-field"><input type="checkbox" name="is_suspended" checked={form.is_suspended} onChange={handleChange} /> Créer l'abonnement suspendu</label>
           <label className="checkbox-field">
  <input
    type="checkbox"
    name="create_payment"
    checked={form.create_payment}
    onChange={handleChange}
  />
  Enregistrer automatiquement le paiement
</label>

{form.create_payment && (
  <div className="admin-field">
    <label htmlFor="subscription-payment-method">
      Méthode de paiement
    </label>

    <select
      id="subscription-payment-method"
      name="payment_method"
      value={form.payment_method}
      onChange={handleChange}
    >
      <option value="CASH">Espèces</option>
      <option value="CARD">Carte</option>
      <option value="TRANSFER">Virement</option>
    </select>
  </div>
)}
          </div>
          <div className="form-actions">
            <button className="action-button primary" type="submit" disabled={saving}>{saving ? "Création..." : "Créer l’abonnement"}</button>
            <button className="action-button" type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Annuler</button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        {loading ? <p className="muted">Chargement des abonnements...</p> : (
          <table>
            <thead><tr><th>Membre</th><th>Formule</th><th>Prix</th><th>Début</th><th>Expiration</th><th>Jours restants</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.member_name || `Membre #${subscription.member}`}</td>
                  <td>{subscription.plan_name || `Formule #${subscription.plan}`}</td>
                  <td>{formatMoney(subscription.price_at_subscription)} DH</td>
                  <td>{formatDate(subscription.start_date)}</td>
                  <td>{formatDate(subscription.end_date)}</td>
                  <td>{subscription.days_remaining}</td>
                  <td><SubscriptionStatus subscription={subscription} /></td>
                  <td>
                    <div className="row-actions">
                      <button className={`action-button ${subscription.is_suspended ? "success" : "warning"}`} type="button" onClick={() => toggleSuspension(subscription)}>{subscription.is_suspended ? "Réactiver" : "Suspendre"}</button>
                      <button className="action-button danger" type="button" onClick={() => deleteSubscription(subscription)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && <tr><td colSpan="8" className="muted">Aucun abonnement trouvé.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SubscriptionStatus({ subscription }) {
  const classes = { ACTIVE: "active", EXPIRING_SOON: "warning", EXPIRED: "expired", SUSPENDED: "warning" };
  return <span className={`badge ${classes[subscription.status] || ""}`}>{subscription.status_display || subscription.status}</span>;
}
function formatDate(value) { if (!value) return "-"; return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
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
export default Subscriptions;
