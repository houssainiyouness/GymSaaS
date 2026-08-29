import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/client-portal.css";

function MySubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me/subscription/")
      .then((response) => setSubscription(response.data.subscription || null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="client-page">
      <PageHeading eyebrow="ABONNEMENT" title="Mon abonnement" text="Retrouvez les informations de votre formule actuelle." />
      {loading ? <div className="client-empty">Chargement…</div> : subscription ? (
        <article className="client-panel subscription-detail-card">
          <div className="subscription-detail-top">
            <div><span>Formule</span><h2>{subscription.plan_name}</h2></div>
            <span className={`client-status status-${subscription.status?.toLowerCase()}`}>{subscription.status_display}</span>
          </div>
          <div className="detail-grid">
            <Detail label="Prix de l’abonnement" value={`${formatMoney(subscription.price_at_subscription)} DH`} />
            <Detail label="Date de début" value={formatDate(subscription.start_date)} />
            <Detail label="Date de fin" value={formatDate(subscription.end_date)} />
            <Detail label="Jours restants" value={subscription.days_remaining} />
            <Detail label="État" value={subscription.is_suspended ? "Suspendu" : "En cours"} />
          </div>
        </article>
      ) : <div className="client-empty bordered">Vous n’avez pas d’abonnement actif actuellement.</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, text }) { return <div className="client-page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }
function Detail({ label, value }) { return <div className="client-detail"><span>{label}</span><strong>{value}</strong></div>; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value)) : "—"; }
function formatMoney(value) { return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)); }
export default MySubscription;
