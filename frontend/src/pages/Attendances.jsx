import { useEffect, useMemo, useState } from "react";

import api, { extractList, getApiError } from "../services/api";
import "../styles/admin-tools.css";

function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showQrForm, setShowQrForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [attendanceResponse, memberResponse, summaryResponse] = await Promise.all([
        api.get("/attendances/", { params: { ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status } : {}) } }),
        api.get("/members/"),
        api.get("/attendances/summary/"),
      ]);
      setAttendances(extractList(attendanceResponse));
      setMembers(extractList(memberResponse).filter((member) => member.is_active));
      setSummary(summaryResponse.data);
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible de charger les présences."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const presentCount = useMemo(() => attendances.filter((item) => !item.check_out).length, [attendances]);

  async function createManualEntry(event) {
    event.preventDefault();
    if (!memberId) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/attendances/", { member: Number(memberId), entry_method: "manual", notes: "" });
      setMemberId("");
      setShowEntryForm(false);
      setSuccess("Entrée enregistrée.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible d’enregistrer cette entrée."));
    } finally {
      setSaving(false);
    }
  }

  async function createQrEntry(event) {
    event.preventDefault();
    if (!qrCode.trim()) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/attendances/qr-checkin/", { qr_code: qrCode.trim() });
      setQrCode("");
      setShowQrForm(false);
      setSuccess("Entrée QR enregistrée.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "QR code invalide ou entrée impossible."));
    } finally {
      setSaving(false);
    }
  }

  async function checkout(attendance) {
    try {
      setError("");
      setSuccess("");
      await api.post(`/attendances/${attendance.id}/checkout/`);
      setSuccess("Sortie enregistrée.");
      await loadData();
    } catch (requestError) {
      setError(getApiError(requestError, "Impossible d’enregistrer la sortie."));
    }
  }

  function submitFilters(event) {
    event.preventDefault();
    loadData();
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Présences</h1>
          <p className="muted">Entrées, sorties et contrôle QR via les endpoints Django existants.</p>
        </div>
        <div className="row-actions">
          <button className="action-button" type="button" onClick={() => setShowQrForm((value) => !value)}>Scanner / saisir QR</button>
          <button className="action-button primary" type="button" onClick={() => setShowEntryForm((value) => !value)}>+ Entrée manuelle</button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="admin-mini-stats">
        <MiniStat label="Entrées aujourd'hui" value={summary?.today?.total_check_ins ?? "—"} />
        <MiniStat label="Présents maintenant" value={summary?.today?.currently_present ?? presentCount} />
        <MiniStat label="Sorties aujourd'hui" value={summary?.today?.checked_out ?? "—"} />
        <MiniStat label="Durée moyenne" value={summary?.today ? `${summary.today.average_duration_minutes} min` : "—"} />
      </div>

      {showEntryForm && (
        <form className="card admin-form-card" onSubmit={createManualEntry}>
          <h2>Entrée manuelle</h2>
          <div className="admin-field">
            <label htmlFor="attendance-member">Membre</label>
            <select id="attendance-member" value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
              <option value="">Sélectionner un membre</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.full_name || member.username}</option>)}
            </select>
          </div>
          <div className="form-actions"><button className="action-button primary" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l’entrée"}</button></div>
        </form>
      )}

      {showQrForm && (
        <form className="card admin-form-card" onSubmit={createQrEntry}>
          <h2>Entrée par QR</h2>
          <div className="admin-field wide">
            <label htmlFor="attendance-qr">Valeur du QR code</label>
            <input id="attendance-qr" value={qrCode} onChange={(event) => setQrCode(event.target.value)} placeholder="UUID renvoyé par /api/me/qr-code/" required />
          </div>
          <div className="form-actions"><button className="action-button primary" disabled={saving}>{saving ? "Validation…" : "Valider le QR"}</button></div>
        </form>
      )}

      <form className="card filter-bar" onSubmit={submitFilters}>
        <input type="search" placeholder="Rechercher un membre…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="present">Présent</option>
          <option value="checked_out">Sorti</option>
        </select>
        <button className="action-button primary" type="submit">Filtrer</button>
      </form>

      <div className="card table-wrap">
        {loading ? <p className="muted">Chargement des présences…</p> : (
          <table>
            <thead><tr><th>Membre</th><th>Entrée</th><th>Sortie</th><th>Durée</th><th>Méthode</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              {attendances.map((attendance) => (
                <tr key={attendance.id}>
                  <td>{attendance.member_name}</td>
                  <td>{formatDateTime(attendance.check_in)}</td>
                  <td>{attendance.check_out ? formatDateTime(attendance.check_out) : "—"}</td>
                  <td>{attendance.duration_minutes} min</td>
                  <td>{attendance.entry_method === "qr_code" ? "QR code" : "Manuel"}</td>
                  <td><span className={`badge ${attendance.check_out ? "expired" : "active"}`}>{attendance.check_out ? "Sorti" : "Présent"}</span></td>
                  <td>{!attendance.check_out && <button className="action-button warning" type="button" onClick={() => checkout(attendance)}>Enregistrer sortie</button>}</td>
                </tr>
              ))}
              {!attendances.length && <tr><td colSpan="7" className="muted">Aucune présence trouvée.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) { return <article className="mini-stat"><span>{label}</span><strong>{value}</strong></article>; }
function formatDateTime(value) { if (!value) return "—"; return new Intl.DateTimeFormat("fr-MA", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

export default Attendances;
