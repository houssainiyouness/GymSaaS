import { Link } from "react-router";

function NotFound() {
  return (
    <main className="simple-status-page">
      <span className="eyebrow">404</span>
      <h1>Cette page n’existe pas.</h1>
      <p>Le lien demandé n’est pas disponible dans GymSaaS.</p>
      <Link className="btn btn-primary" to="/">Retour à l’accueil</Link>
    </main>
  );
}

export default NotFound;
