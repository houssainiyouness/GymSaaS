import { useEffect, useState } from "react";

import api, { getApiError } from "../services/api";
import "../styles/admin-tools.css";

function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;
  const [filters, setFilters] = useState({ start_date: monthStart, end_date: today });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloading, setDownloading] = useState("");

  async function loadReport() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/reports/financial/", { params: filters });
      setReport(response.data);
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger le rapport financier."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function downloadCsv(key, path, fallbackFilename, params = {}) {
    try {
      setDownloading(key);
      setError("");
      setSuccess("");
      const response = await api.get(path, { params, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadFilename(response.headers?.["content-disposition"], fallbackFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess(`Export « ${link.download} » téléchargé avec succès.`);
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de télécharger l’export."));
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div><h1 className="page-title">Rapports</h1><p className="muted">Revenus et exports disponibles dans le backend actuel.</p></div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <form className="card filter-bar" onSubmit={(event) => { event.preventDefault(); loadReport(); }}>
        <label>Du <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} /></label>
        <label>Au <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} /></label>
        <button className="action-button primary" type="submit">Actualiser</button>
      </form>

      {loading ? <div className="card muted">Chargement du rapport…</div> : report && (
        <>
          <div className="admin-mini-stats">
            <MiniStat label="Revenus période" value={`${formatMoney(report.revenue?.total)} DH`} />
            <MiniStat label="Paiements" value={report.revenue?.payment_count ?? 0} />
            <MiniStat label="Paiement moyen" value={`${formatMoney(report.revenue?.average_payment)} DH`} />
            <MiniStat label="Reste à payer" value={`${formatMoney(report.outstanding?.total_remaining)} DH`} />
          </div>

          <div className="card report-export-card">
            <div><h2>Exports CSV</h2><p className="muted">Les fichiers sont générés directement par Django et nécessitent une session de gestion valide.</p></div>
            <div className="row-actions">
              <button className="action-button" type="button" disabled={Boolean(downloading)} onClick={() => downloadCsv("members", "/reports/exports/members.csv", "membres.csv")}>{downloading === "members" ? "Téléchargement…" : "Membres"}</button>
              <button className="action-button" type="button" disabled={Boolean(downloading)} onClick={() => downloadCsv("payments", "/reports/exports/payments.csv", "paiements.csv", filters)}>{downloading === "payments" ? "Téléchargement…" : "Paiements"}</button>
              <button className="action-button" type="button" disabled={Boolean(downloading)} onClick={() => downloadCsv("attendances", "/reports/exports/attendances.csv", "presences.csv", filters)}>{downloading === "attendances" ? "Téléchargement…" : "Présences"}</button>
            </div>
          </div>

          <div className="card table-wrap">
            <h2>Montants restant à payer</h2>
            <table>
              <thead><tr><th>Membre</th><th>Formule</th><th>Prix</th><th>Payé</th><th>Reste</th><th>Fin</th></tr></thead>
              <tbody>
                {(report.outstanding?.subscriptions || []).map((item) => (
                  <tr key={item.subscription_id}><td>{item.member_name}</td><td>{item.plan_name}</td><td>{formatMoney(item.plan_price)} DH</td><td>{formatMoney(item.total_paid)} DH</td><td>{formatMoney(item.remaining_amount)} DH</td><td>{item.end_date}</td></tr>
                ))}
                {!report.outstanding?.subscriptions?.length && <tr><td colSpan="6" className="muted">Aucun reste à payer.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }) { return <article className="mini-stat"><span>{label}</span><strong>{value}</strong></article>; }
function formatMoney(value) { return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)); }

export function getDownloadFilename(contentDisposition, fallback) {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].trim());

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1]?.trim() || fallback;
}

export default Reports;
