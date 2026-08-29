import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";

import api, {
  extractList,
  getApiError,
  getFieldErrors,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

import "../styles/home.css";


const activities = [
  {
    icon: "01",
    title: "Musculation",
    text:
      "Un univers dédié au renforcement, à la progression et à l’entraînement libre.",
  },
  {
    icon: "02",
    title: "Cardio",
    text:
      "Développez votre endurance avec des séances adaptées à votre rythme.",
  },
  {
    icon: "03",
    title: "Cross-training",
    text:
      "Des entraînements variés qui combinent intensité, mobilité et condition physique.",
  },
  {
    icon: "04",
    title: "Cours collectifs",
    text:
      "Une expérience dynamique à plusieurs, pensée pour garder la motivation.",
  },
  {
    icon: "05",
    title: "Remise en forme",
    text:
      "Reprenez une activité progressivement et construisez une routine durable.",
  },
  {
    icon: "06",
    title: "Coaching",
    text:
      "Un accompagnement humain pour mieux structurer vos objectifs et vos séances.",
  },
];


const coachingSteps = [
  "Comprendre votre point de départ",
  "Définir des objectifs réalistes",
  "Structurer votre pratique",
  "Suivre vos progrès dans le temps",
];


const initialContact = {
  full_name: "",
  email: "",
  phone: "",
  subject: "Demande d'information",
  message: "",
};


function Home() {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();


  /* =====================================================
     FORMULES
  ===================================================== */

  const [
    plans,
    setPlans,
  ] = useState([]);


  const [
    plansState,
    setPlansState,
  ] = useState({
    loading: false,
    unavailablePublicly: false,
    error: "",
  });


  /* =====================================================
     CONTACT
  ===================================================== */

  const [
    contact,
    setContact,
  ] = useState(
    initialContact,
  );


  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});


  const [
    contactState,
    setContactState,
  ] = useState({
    loading: false,
    message: "",
    error: false,
  });


  /* =====================================================
     FORMULES API
  ===================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }


    if (!isAuthenticated) {
      setPlans([]);

      setPlansState({
        loading: false,
        unavailablePublicly: true,
        error: "",
      });

      return;
    }


    setPlansState({
      loading: true,
      unavailablePublicly: false,
      error: "",
    });


    api
      .get("/plans/")
      .then((response) => {

        setPlans(
          extractList(
            response,
          ).filter(
            (plan) =>
              plan.is_active,
          ),
        );


        setPlansState({
          loading: false,
          unavailablePublicly: false,
          error: "",
        });

      })
      .catch((error) => {

        setPlansState({
          loading: false,
          unavailablePublicly: false,

          error:
            getApiError(
              error,
              "Impossible de charger les formules.",
            ),
        });

      });

  }, [
    authLoading,
    isAuthenticated,
  ]);


  /* =====================================================
     CONTACT
  ===================================================== */

  const contactDisabled =
    useMemo(
      () =>
        contactState.loading,
      [
        contactState.loading,
      ],
    );


  function handleContactChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;


    setContact(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );


    setFieldErrors(
      (current) => ({
        ...current,
        [name]: "",
      }),
    );
  }


  async function handleContactSubmit(
    event,
  ) {
    event.preventDefault();


    if (
      contactState.loading
    ) {
      return;
    }


    setFieldErrors({});


    setContactState({
      loading: true,
      message: "",
      error: false,
    });


    try {

      await api.post(
        "/contacts/",
        contact,
        {
          skipAuth: true,
        },
      );


      setContact(
        initialContact,
      );


      setContactState({
        loading: false,

        message:
          "Votre message a bien été envoyé.",

        error: false,
      });

    } catch (error) {

      setFieldErrors(
        getFieldErrors(
          error,
        ),
      );


      setContactState({
        loading: false,

        message:
          getApiError(
            error,
            "Impossible d’envoyer votre message.",
          ),

        error: true,
      });

    }
  }


  return (
    <div className="public-site">

      <Navbar />


      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <Hero />


        {/* =================================================
            ACTIVITÉS
        ================================================= */}

        <section
          className="public-section"
          id="activities"
        >

          <div className="section-kicker">
            BOUGER À VOTRE FAÇON
          </div>


          <div className="section-intro-row">

            <h2>
              Des activités pour
              construire votre propre
              routine.
            </h2>


            <p>
              Découvrez plusieurs
              univers d’entraînement
              pour progresser à votre
              rythme.
            </p>

          </div>


          <div className="activity-grid">

            {activities.map(
              (activity) => (

                <article
                  className="activity-card"
                  key={
                    activity.title
                  }
                >

                  <span>
                    {activity.icon}
                  </span>


                  <h3>
                    {activity.title}
                  </h3>


                  <p>
                    {activity.text}
                  </p>

                </article>

              ),
            )}

          </div>

        </section>


        {/* =================================================
            COACHING
        ================================================= */}

        <section
          className="coaching-section"
          id="coaching"
        >

          <div className="public-section coaching-inner">

            <div className="coaching-copy">

              <span className="eyebrow">
                ACCOMPAGNEMENT
              </span>


              <h2>
                Un parcours plus humain
                que simplement “venir
                s’entraîner”.
              </h2>


              <p>
                Nos coachs vous
                accompagnent selon
                votre niveau, vos
                objectifs et votre
                rythme.
              </p>


              <div className="coaching-actions">

                <Link
                  className="btn btn-primary"
                  to="/register"
                >
                  Créer mon espace
                </Link>


                <Link
                  className="btn btn-coach-outline"
                  to="/nos-coachs"
                >

                  Voir les coachs
                  disponibles

                  <span>
                    →
                  </span>

                </Link>

              </div>

            </div>


            <div className="coaching-steps">

              {coachingSteps.map(
                (
                  step,
                  index,
                ) => (

                  <div
                    className="coaching-step"
                    key={step}
                  >

                    <span>

                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}

                    </span>


                    <strong>
                      {step}
                    </strong>

                  </div>

                ),
              )}

            </div>

          </div>

        </section>


        {/* =================================================
            FORMULES
        ================================================= */}

        <section
          className="public-section"
          id="plans"
        >

          <div className="section-kicker">
            FORMULES
          </div>


          <div className="section-intro-row">

            <h2>
              Choisissez la formule
              qui vous convient.
            </h2>


            <p>
              Retrouvez les formules
              proposées dans votre
              salle.
            </p>

          </div>


          {plansState.loading && (

            <div className="public-state-card">
              Chargement des formules…
            </div>

          )}


          {plansState.error && (

            <div className="public-state-card error">
              {plansState.error}
            </div>

          )}


          {plansState.unavailablePublicly ? (

            <div className="plans-api-notice">

              <div>

                <span className="eyebrow">
                  FORMULES EN LIGNE
                </span>


                <h3>
                  Connectez-vous pour
                  consulter les formules
                  disponibles.
                </h3>


                <p>
                  Retrouvez les offres
                  depuis votre espace
                  GymSaaS.
                </p>

              </div>


              <Link
                className="btn btn-primary"
                to="/login"
              >
                Accéder à mon espace
              </Link>

            </div>

          ) : (

            <div className="public-plan-grid">

              {plans.map(
                (plan) => (

                  <article
                    className="public-plan-card"
                    key={
                      plan.id
                    }
                  >

                    <span className="plan-duration">

                      {plan.duration_days}{" "}
                      jours

                    </span>


                    <h3>
                      {plan.name}
                    </h3>


                    <div className="plan-price">

                      <strong>
                        {formatMoney(
                          plan.price,
                        )}
                      </strong>

                      <span>
                        DH
                      </span>

                    </div>


                    <p>

                      {plan.description ||
                        "Aucune description renseignée."}

                    </p>


                    <Link
                      className="btn btn-dark"
                      to="/register"
                    >
                      Je m’inscris
                    </Link>

                  </article>

                ),
              )}


              {!plans.length && (

                <div className="public-state-card">

                  Aucune formule active
                  n’est disponible
                  actuellement.

                </div>

              )}

            </div>

          )}

        </section>


        {/* =================================================
            SALLE
        ================================================= */}

        <section
          className="gym-preview-section"
          id="gym"
        >

          <div className="public-section gym-preview-inner">

            <div>

              <span className="eyebrow">
                LA SALLE
              </span>


              <h2>
                Retrouvez toutes les
                informations de votre
                club.
              </h2>


              <p>
                Coordonnées,
                équipements et
                présentation de votre
                salle.
              </p>

            </div>


            <div className="gym-missing-api">

              <strong>
                Informations du club
              </strong>


              <span>
                Coordonnées · horaires ·
                équipements ·
                présentation
              </span>


              <a
                className="btn btn-dark"
                href="#contact"
              >
                Nous contacter
              </a>

            </div>

          </div>

        </section>


        {/* =================================================
            CONTACT
        ================================================= */}

        <section
          className="public-section contact-section"
          id="contact"
        >

          <div className="contact-copy">

            <span className="eyebrow">
              CONTACT
            </span>


            <h2>
              Une question avant
              de vous inscrire ?
            </h2>


            <p>
              Envoyez-nous votre
              demande.
            </p>

          </div>


          <form
            className="contact-form"
            onSubmit={
              handleContactSubmit
            }
            noValidate
          >

            {contactState.message && (

              <div
                className={
                  contactState.error
                    ? "form-error"
                    : "form-success"
                }
                role="status"
              >
                {contactState.message}
              </div>

            )}


            <div className="form-grid">

              <Field
                label="Nom complet"
                name="full_name"
                value={
                  contact.full_name
                }
                onChange={
                  handleContactChange
                }
                error={
                  fieldErrors.full_name
                }
                required
              />


              <Field
                label="E-mail"
                name="email"
                type="email"
                value={
                  contact.email
                }
                onChange={
                  handleContactChange
                }
                error={
                  fieldErrors.email
                }
                required
              />


              <Field
                label="Téléphone"
                name="phone"
                type="tel"
                value={
                  contact.phone
                }
                onChange={
                  handleContactChange
                }
                error={
                  fieldErrors.phone
                }
              />


              <Field
                label="Sujet"
                name="subject"
                value={
                  contact.subject
                }
                onChange={
                  handleContactChange
                }
                error={
                  fieldErrors.subject
                }
                required
              />

            </div>


            <label
              className="field-label"
              htmlFor="message"
            >
              Message
            </label>


            <textarea
              id="message"
              name="message"
              value={
                contact.message
              }
              onChange={
                handleContactChange
              }
              rows="6"
              required
              aria-invalid={
                Boolean(
                  fieldErrors.message,
                )
              }
            />


            {fieldErrors.message && (

              <small className="field-error">
                {fieldErrors.message}
              </small>

            )}


            <button
              className="btn btn-primary btn-large"
              type="submit"
              disabled={
                contactDisabled
              }
            >

              {contactState.loading
                ? "Envoi…"
                : "Envoyer ma demande"}

            </button>

          </form>

        </section>

      </main>


      <Footer />

    </div>
  );
}


/* =====================================================
   FIELD
===================================================== */

function Field({
  label,
  name,
  error,
  ...props
}) {
  return (
    <div className="field-wrap">

      <label
        className="field-label"
        htmlFor={name}
      >
        {label}
      </label>


      <input
        id={name}
        name={name}
        aria-invalid={
          Boolean(error)
        }
        {...props}
      />


      {error && (

        <small className="field-error">
          {error}
        </small>

      )}

    </div>
  );
}


/* =====================================================
   PRIX
===================================================== */

function formatMoney(
  value,
) {
  return new Intl.NumberFormat(
    "fr-MA",
    {
      maximumFractionDigits:
        2,
    },
  ).format(
    Number(
      value ||
      0,
    ),
  );
}


export default Home;