function FeatureCard({ number, title, description }) {
  return (
    <article className="feature-card">
      <span className="feature-number">{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default FeatureCard;
