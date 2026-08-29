import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/client-portal.css";

function MyAttendances() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me/attendances/")
      .then((response) => setAttendances(response.data.attendances || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="client-page">
      <div className="client-page-heading"><span className="eyebrow">PRÉSENCES</span><h1>Mes présences</h1><p>Votre historique d’entrées et de sorties au club.</p></div>
      <article className="client-panel client-table-panel">
        {loading ? <div className="client-empty">Chargement…</div> : attendances.length ? (
          <div className="client-table-wrap"><table className="client-table"><thead><tr><th>Entrée</th><th>Sortie</th><th>Durée</th><th>Méthode</th><th>Statut</th></tr></thead><tbody>{attendances.map((attendance) => <tr key={attendance.id}><td>{formatDateTime(attendance.check_in)}</td><td>{attendance.check_out ? formatDateTime(attendance.check_out) : "—"}</td><td>{attendance.duration_minutes} min</td><td>{attendance.entry_method}</td><td><span className={`client-status ${attendance.attendance_status === "present" ? "status-active" : ""}`}>{attendance.attendance_status === "present" ? "Présent" : "Sorti"}</span></td></tr>)}</tbody></table></div>
        ) : <div className="client-empty">Aucune présence enregistrée.</div>}
      </article>
    </div>
  );
}

function formatDateTime(value) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
export default MyAttendances;
