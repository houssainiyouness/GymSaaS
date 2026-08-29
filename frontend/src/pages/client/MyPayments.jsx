import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../../styles/client-portal.css";

function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me/payments/")
      .then((response) => setPayments(response.data.payments || []))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);

  return (
    <div className="client-page">
      <div className="client-page-heading"><span className="eyebrow">PAIEMENTS</span><h1>Mes paiements</h1><p>Historique des règlements liés à vos abonnements.</p></div>
      <div className="client-summary-strip"><span>Total réglé</span><strong>{formatMoney(total)} DH</strong><small>{payments.length} paiement{payments.length > 1 ? "s" : ""}</small></div>
      <article className="client-panel client-table-panel">
        {loading ? <div className="client-empty">Chargement…</div> : payments.length ? (
          <div className="client-table-wrap"><table className="client-table"><thead><tr><th>Date</th><th>Formule</th><th>Méthode</th><th>Référence</th><th>Montant</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{formatDate(payment.paid_at)}</td><td>{payment.plan_name}</td><td>{payment.method_display || payment.method}</td><td>{payment.reference || "—"}</td><td><strong>{formatMoney(payment.amount)} DH</strong></td></tr>)}</tbody></table></div>
        ) : <div className="client-empty">Aucun paiement enregistré.</div>}
      </article>
    </div>
  );
}

function formatMoney(value) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value || 0)); }
function formatDate(value) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
export default MyPayments;
