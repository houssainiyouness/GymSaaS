import { useEffect, useState } from "react";
import api, { extractList } from "../services/api";
import "../styles/admin-tools.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs(query = "") {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/audit-logs/", {
        params: {
          ordering: "-created_at",
          ...(query.trim() ? { search: query.trim() } : {}),
        },
      });
      setLogs(extractList(response));
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger le journal d’activité."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadLogs(search);
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Journal d’activité</h1>
          <p className="muted">Historique des opérations enregistrées automatiquement par le backend.</p>
        </div>
        <form className="audit-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Utilisateur, action, adresse IP..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="action-button primary" type="submit">Rechercher</button>
        </form>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Chargement du journal...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Description</th>
                <th>Objet</th>
                <th>IP</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.actor_full_name || log.actor_username || "Système"}</td>
                  <td><ActionBadge action={log.action} label={log.action_display || log.action} /></td>
                  <td className="audit-description">{log.description || "—"}</td>
                  <td>
                    <div>{shortEntity(log.entity_type)}</div>
                    {log.entity_id && <div className="audit-meta">#{log.entity_id}</div>}
                  </td>
                  <td>{log.ip_address || "—"}</td>
                  <td>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="6" className="muted">Aucune activité trouvée.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action, label }) {
  const warning = ["SUSPEND", "DEACTIVATE"].includes(action);
  const danger = ["DELETE"].includes(action);
  const className = danger ? "expired" : warning ? "warning" : "active";
  return <span className={`badge ${className}`}>{label}</span>;
}

function shortEntity(value) {
  if (!value) return "—";
  const parts = String(value).split(".");
  return parts[parts.length - 1] || value;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") {
    const first = Object.values(data).flat().find(Boolean);
    if (first) return String(first);
  }
  return fallback;
}

export default AuditLogs;
