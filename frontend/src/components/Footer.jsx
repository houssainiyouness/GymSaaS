import { Link } from "react-router";

function Footer() {
  return (
    <footer className="public-footer">
      <div className="footer-grid">
        <div>
          <Link className="brand footer-brand" to="/">GYM<span>SAAS</span></Link>
          <p>Une expérience de salle de sport plus fluide pour les adhérents et l’équipe de gestion.</p>
        </div>

        <div>
          <strong>Découvrir</strong>
          <a href="#activities">Activités</a>
          <a href="#coaching">Coaching</a>
          <a href="#plans">Formules</a>
          <a href="#gym">La salle</a>
        </div>

        <div>
          <strong>Votre espace</strong>
          <Link to="/login">Connexion adhérent</Link>
          <Link to="/register">Créer un compte</Link>
          <Link to="/admin-login">Espace de gestion</Link>
        </div>

        <div>
          <strong>Informations</strong>
          <a href="#contact">Contact</a>
          <span>Mentions légales — à configurer</span>
          <span>Confidentialité — à configurer</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} GymSaaS</span>
        <span>Informations du club affichées uniquement lorsqu’elles sont disponibles.</span>
      </div>
    </footer>
  );
}

export default Footer;
