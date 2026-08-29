import { Link } from "react-router";

import heroImage from "../assets/hero.png";

function Hero() {
  return (
    <section className="public-hero" aria-labelledby="hero-title">
      <img className="public-hero-image" src={heroImage} alt="Espace d'entraînement GymSaaS" />
      <div className="public-hero-overlay" />
      <div className="public-hero-content">
        <span className="hero-kicker">VOTRE ÉNERGIE. VOTRE RYTHME.</span>
        <h1 id="hero-title">Une expérience fitness simple, motivante et connectée.</h1>
        <p>
          Découvrez l’univers GymSaaS et gérez ensuite votre abonnement, vos paiements,
          vos présences et votre accès depuis votre espace adhérent.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-large" href="#plans">Découvrir les formules</a>
          <Link className="btn btn-ghost btn-large" to="/register">Créer mon espace</Link>
        </div>
        <div className="hero-proof" aria-label="Services GymSaaS">
          <span>Coaching</span>
          <span>Accès digital</span>
          <span>Suivi adhérent</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
