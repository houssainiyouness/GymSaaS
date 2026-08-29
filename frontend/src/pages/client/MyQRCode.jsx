import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import api, { getApiError } from "../../services/api";
import "../../styles/client-portal.css";

function MyQRCode() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/me/qr-code/")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(getApiError(requestError, "Impossible de charger votre QR code.")))
      .finally(() => setLoading(false));
  }, []);

  async function copyCode() {
    if (!data?.qr_code) return;
    await navigator.clipboard.writeText(data.qr_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="client-page">
      <div className="client-page-heading">
        <span className="eyebrow">ACCÈS</span>
        <h1>Mon QR code</h1>
        <p>Présentez ce QR code au scanner ou à l’accueil de la salle.</p>
      </div>

      {error && <div className="client-profile-message error">{error}</div>}

      <article className="client-panel qr-card">
        {loading ? (
          <div className="client-empty">Chargement du QR code…</div>
        ) : data?.qr_code ? (
          <>
            <div className="real-qr-code" aria-label="QR code personnel">
              <QRCodeSVG value={data.qr_code} size={220} level="M" marginSize={4} />
            </div>
            <span>IDENTIFIANT PERSONNEL</span>
            <strong className="qr-code-value">{data.qr_code}</strong>
            <button className="btn btn-primary" type="button" onClick={copyCode}>{copied ? "Copié" : "Copier le code"}</button>
            <small>Ce code est personnel. Ne le partagez qu’au moment de votre accès à la salle.</small>
          </>
        ) : (
          <div className="client-empty">Aucun QR code disponible.</div>
        )}
      </article>
    </div>
  );
}

export default MyQRCode;
