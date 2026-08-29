import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

import api, {
  extractList,
  getApiError,
} from "../services/api";

import "../styles/home.css";
import "../styles/public-coaches.css";


function PublicCoaches() {
  const [
    coaches,
    setCoaches,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    specialty,
    setSpecialty,
  ] = useState("Tous");

  const [
    expandedCoach,
    setExpandedCoach,
  ] = useState(null);


  async function loadCoaches() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/coaches/",
          {
            skipAuth: true,
          },
        );

      const data =
        extractList(
          response,
        ).filter(
          (coach) =>
            coach.is_active !== false,
        );

      setCoaches(data);

    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de charger les coachs disponibles.",
        ),
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });

    loadCoaches();
  }, []);


  const specialties =
    useMemo(
      () => {
        const values =
          coaches
            .map(
              (coach) =>
                coach.specialty
                  ?.trim(),
            )
            .filter(Boolean);

        return [
          "Tous",

          ...Array.from(
            new Set(values),
          ).sort(
            (
              first,
              second,
            ) =>
              first.localeCompare(
                second,
                "fr",
              ),
          ),
        ];
      },
      [coaches],
    );


  const filteredCoaches =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return coaches.filter(
          (coach) => {
            const coachName =
              getCoachName(
                coach,
              );

            const matchesSpecialty =
              specialty === "Tous" ||
              coach.specialty ===
                specialty;

            const searchableText = [
              coachName,
              coach.specialty,
              coach.bio,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              !normalizedSearch ||
              searchableText.includes(
                normalizedSearch,
              );

            return (
              matchesSpecialty &&
              matchesSearch
            );
          },
        );
      },
      [
        coaches,
        search,
        specialty,
      ],
    );


  const resultLabel =
    filteredCoaches.length > 1
      ? `${filteredCoaches.length} coachs disponibles`
      : filteredCoaches.length === 1
        ? "1 coach disponible"
        : "Aucun coach trouvé";


  return (
    <div className="public-site public-coaches-page">

      <Navbar />


      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="public-coaches-hero">

          <div className="public-coaches-container public-coaches-hero-inner">

            <div className="public-coaches-hero-copy">

              <Link
                className="public-coaches-back"
                to="/#coaching"
              >
                <span aria-hidden="true">
                  ←
                </span>

                Retour à l’accueil
              </Link>


              <span className="public-coaches-kicker">
                ÉQUIPE GYMSAAS
              </span>


              <h1>
                Trouvez le coach qui
                vous correspond.
              </h1>


              <p>
                Découvrez les spécialités
                de notre équipe et
                choisissez l’accompagnement
                le plus adapté à votre
                niveau, votre rythme et
                vos objectifs.
              </p>

            </div>


            <div className="public-coaches-hero-stat">

              <strong>
                {loading
                  ? "—"
                  : coaches.length}
              </strong>

              <span>
                {coaches.length > 1
                  ? "coachs disponibles"
                  : "coach disponible"}
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            LISTE
        ================================================= */}

        <section className="public-coaches-main">

          <div className="public-coaches-container">

            {/* RECHERCHE */}

            <div className="public-coaches-toolbar">

              <div className="public-coaches-search-wrap">

                <span
                  className="public-coaches-search-icon"
                  aria-hidden="true"
                >
                  ⌕
                </span>


                <input
                  type="search"
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value,
                      )
                  }
                  placeholder="Rechercher un coach ou une spécialité..."
                  aria-label="Rechercher un coach"
                />


                {search && (
                  <button
                    type="button"
                    className="public-coaches-clear-search"
                    onClick={
                      () =>
                        setSearch("")
                    }
                    aria-label="Effacer la recherche"
                  >
                    ×
                  </button>
                )}

              </div>


              <span className="public-coaches-result-count">

                {loading
                  ? "Chargement…"
                  : resultLabel}

              </span>

            </div>


            {/* FILTRES */}

            {!loading &&
              !error &&
              specialties.length > 1 && (

                <div
                  className="public-coaches-filters"
                  aria-label="Filtrer par spécialité"
                >

                  {specialties.map(
                    (item) => (

                      <button
                        type="button"
                        key={item}
                        className={
                          specialty === item
                            ? "public-coaches-filter is-active"
                            : "public-coaches-filter"
                        }
                        onClick={
                          () =>
                            setSpecialty(
                              item,
                            )
                        }
                      >
                        {item}
                      </button>

                    ),
                  )}

                </div>
              )}


            {/* CHARGEMENT */}

            {loading && (

              <div className="public-coaches-state">

                <span className="public-coaches-loader" />

                <strong>
                  Chargement de notre
                  équipe…
                </strong>

                <p>
                  Nous récupérons les
                  coachs disponibles.
                </p>

              </div>

            )}


            {/* ERREUR */}

            {!loading &&
              error && (

                <div className="public-coaches-state is-error">

                  <div className="public-coaches-state-icon">
                    !
                  </div>

                  <strong>
                    Impossible de charger
                    les coachs
                  </strong>

                  <p>
                    {error}
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                      loadCoaches
                    }
                  >
                    Réessayer
                  </button>

                </div>
              )}


            {/* GRILLE */}

            {!loading &&
              !error &&
              filteredCoaches.length >
                0 && (

                <div className="public-coaches-grid">

                  {filteredCoaches.map(
                    (coach) => {

                      const coachName =
                        getCoachName(
                          coach,
                        );

                      const expanded =
                        expandedCoach ===
                        coach.id;


                      return (

                        <article
                          className="public-coach-card"
                          key={
                            coach.id
                          }
                        >

                          <CoachPhoto
                            coach={
                              coach
                            }
                            coachName={
                              coachName
                            }
                          />


                          <div className="public-coach-card-body">

                            <div className="public-coach-card-meta">

                              <span className="public-coach-specialty">

                                {coach.specialty ||
                                  "Coach sportif"}

                              </span>


                              <span className="public-coach-card-dot">
                                •
                              </span>


                              <span>
                                Accompagnement
                                personnalisé
                              </span>

                            </div>


                            <h2>
                              {coachName}
                            </h2>


                            <p
                              className={
                                expanded
                                  ? "public-coach-bio is-expanded"
                                  : "public-coach-bio"
                              }
                            >

                              {coach.bio ||
                                "Un accompagnement personnalisé pour progresser selon votre niveau et vos objectifs."}

                            </p>


                            <button
                              type="button"
                              className="public-coach-profile-button"
                              onClick={
                                () =>
                                  setExpandedCoach(
                                    expanded
                                      ? null
                                      : coach.id,
                                  )
                              }
                            >

                              <span>
                                {expanded
                                  ? "Réduire le profil"
                                  : "Découvrir le profil"}
                              </span>

                              <span aria-hidden="true">

                                {expanded
                                  ? "↑"
                                  : "→"}

                              </span>

                            </button>

                          </div>

                        </article>

                      );
                    },
                  )}

                </div>
              )}


            {/* AUCUN RÉSULTAT */}

            {!loading &&
              !error &&
              filteredCoaches.length ===
                0 && (

                <div className="public-coaches-state">

                  <div className="public-coaches-state-icon">
                    0
                  </div>

                  <strong>
                    Aucun coach ne
                    correspond à votre
                    recherche
                  </strong>

                  <p>
                    Modifiez votre
                    recherche ou
                    choisissez une autre
                    spécialité.
                  </p>

                  <button
                    type="button"
                    className="public-coaches-reset"
                    onClick={
                      () => {
                        setSearch("");
                        setSpecialty(
                          "Tous",
                        );
                      }
                    }
                  >
                    Afficher tous les
                    coachs
                  </button>

                </div>
              )}

          </div>

        </section>


        {/* =================================================
            CTA
        ================================================= */}

        <section className="public-coaches-cta">

          <div className="public-coaches-container public-coaches-cta-inner">

            <div>

              <span className="public-coaches-kicker">
                PRÊT À COMMENCER ?
              </span>

              <h2>
                Votre progression
                commence avec le bon
                accompagnement.
              </h2>

              <p>
                Créez votre espace
                GymSaaS et commencez
                votre parcours avec
                notre équipe.
              </p>

            </div>


            <div className="public-coaches-cta-actions">

              <Link
                className="btn btn-primary"
                to="/register"
              >
                Créer mon espace
              </Link>


              <a
                className="btn public-coaches-contact-button"
                href="/#contact"
              >
                Nous contacter
              </a>

            </div>

          </div>

        </section>

      </main>


      <Footer />

    </div>
  );
}


/* =====================================================
   PHOTO
===================================================== */

function CoachPhoto({
  coach,
  coachName,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);


  const showPhoto =
    Boolean(
      coach.photo_url,
    ) &&
    !imageFailed;


  return (
    <div className="public-coach-photo">

      {showPhoto ? (

        <img
          src={
            coach.photo_url
          }
          alt={
            coachName
          }
          onError={
            () =>
              setImageFailed(
                true,
              )
          }
        />

      ) : (

        <div
          className="public-coach-placeholder"
          aria-hidden="true"
        >
          {getCoachInitials(
            coach,
          )}
        </div>

      )}


      <span className="public-coach-status">

        <i aria-hidden="true" />

        Disponible

      </span>

    </div>
  );
}


/* =====================================================
   NOM
===================================================== */

function getCoachName(
  coach,
) {
  return (
    coach.full_name ||
    `${
      coach.first_name ||
      ""
    } ${
      coach.last_name ||
      ""
    }`.trim() ||
    "Coach GymSaaS"
  );
}


/* =====================================================
   INITIALES
===================================================== */

function getCoachInitials(
  coach,
) {
  const firstName =
    coach.first_name
      ?.trim() ||
    "";

  const lastName =
    coach.last_name
      ?.trim() ||
    "";


  return (
    `${
      firstName[0] ||
      ""
    }${
      lastName[0] ||
      ""
    }`
      .toUpperCase() ||
    "GS"
  );
}


export default PublicCoaches;