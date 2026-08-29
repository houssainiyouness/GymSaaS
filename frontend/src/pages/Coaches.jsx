import {
  useEffect,
  useState,
} from "react";

import api, {
  extractList,
  getApiError,
} from "../services/api";

import "../styles/admin-tools.css";


const emptyForm = {
  first_name: "",
  last_name: "",
  specialty: "",
  email: "",
  phone: "",
  bio: "",
  is_active: true,
};


function Coaches() {
  const [
    coaches,
    setCoaches,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm,
  );

  const [
    photo,
    setPhoto,
  ] = useState(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [
    currentPhotoUrl,
    setCurrentPhotoUrl,
  ] = useState("");

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  async function loadCoaches() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/coaches/",
        );

      setCoaches(
        extractList(
          response,
        ),
      );
    } catch (
      requestError
    ) {
      setError(
        getApiError(
          requestError,
          "Impossible de charger les coachs.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCoaches();
  }, []);


  function handleChange(
    event,
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      }),
    );
  }


  function handlePhotoChange(
    event,
  ) {
    const file =
      event.target
        .files?.[0] ||
      null;


    if (!file) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setError(
        "La photo doit être au format JPG, PNG ou WEBP.",
      );

      event.target.value =
        "";

      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "La photo ne doit pas dépasser 5 Mo.",
      );

      event.target.value =
        "";

      return;
    }


    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview,
      );
    }


    setError("");

    setPhoto(file);

    setPhotoPreview(
      URL.createObjectURL(
        file,
      ),
    );
  }


  function createCoach() {
    setEditingId(null);

    setForm(
      emptyForm,
    );

    setPhoto(null);

    setPhotoPreview("");

    setCurrentPhotoUrl("");

    setError("");

    setSuccess("");

    setShowForm(true);
  }


  function editCoach(
    coach,
  ) {
    setEditingId(
      coach.id,
    );


    setForm({
      first_name:
        coach.first_name ||
        "",

      last_name:
        coach.last_name ||
        "",

      specialty:
        coach.specialty ||
        "",

      email:
        coach.email || "",

      phone:
        coach.phone || "",

      bio:
        coach.bio || "",

      is_active:
        Boolean(
          coach.is_active,
        ),
    });


    setPhoto(null);

    setPhotoPreview("");

    setCurrentPhotoUrl(
      coach.photo_url ||
      "",
    );

    setError("");

    setSuccess("");

    setShowForm(true);


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview,
      );
    }


    setEditingId(null);

    setForm(
      emptyForm,
    );

    setPhoto(null);

    setPhotoPreview("");

    setCurrentPhotoUrl("");

    setShowForm(false);
  }


  async function saveCoach(
    event,
  ) {
    event.preventDefault();


    try {
      setSaving(true);

      setError("");

      setSuccess("");


      const payload =
        new FormData();


      payload.append(
        "first_name",
        form.first_name.trim(),
      );

      payload.append(
        "last_name",
        form.last_name.trim(),
      );

      payload.append(
        "specialty",
        form.specialty.trim(),
      );

      payload.append(
        "email",
        form.email.trim(),
      );

      payload.append(
        "phone",
        form.phone.trim(),
      );

      payload.append(
        "bio",
        form.bio.trim(),
      );

      payload.append(
        "is_active",
        String(
          form.is_active,
        ),
      );


      if (photo) {
        payload.append(
          "photo",
          photo,
        );
      }


      if (editingId) {
        await api.patch(
          `/coaches/${editingId}/`,
          payload,
        );

        setSuccess(
          "Coach modifié avec succès.",
        );

      } else {
        await api.post(
          "/coaches/",
          payload,
        );

        setSuccess(
          "Coach ajouté avec succès.",
        );
      }


      closeForm();

      await loadCoaches();

    } catch (
      requestError
    ) {
      setError(
        getApiError(
          requestError,
          "Impossible d'enregistrer le coach.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="page coach-admin-page">

      <div className="coach-page-head">

        <div>
          <span className="coach-page-kicker">
            ÉQUIPE SPORTIVE
          </span>

          <h1>
            Coachs
          </h1>

          <p>
            Gérez les profils,
            spécialités et
            disponibilités de
            votre équipe.
          </p>
        </div>


        <button
          type="button"
          className="coach-primary-button"
          onClick={
            createCoach
          }
        >
          <span>
            +
          </span>

          Ajouter un coach
        </button>

      </div>


      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}


      {success && (
        <div className="form-success">
          {success}
        </div>
      )}


      {showForm && (
        <form
          className="coach-editor"
          onSubmit={
            saveCoach
          }
        >

          <div className="coach-editor-head">

            <div>
              <span>
                {editingId
                  ? "MODIFICATION"
                  : "NOUVEAU PROFIL"}
              </span>

              <h2>
                {editingId
                  ? "Modifier le coach"
                  : "Ajouter un coach"}
              </h2>

              <p>
                Les informations
                renseignées pourront
                être affichées sur
                le site public.
              </p>
            </div>


            <button
              type="button"
              className="coach-close-button"
              onClick={
                closeForm
              }
            >
              ×
            </button>

          </div>


          <div className="coach-editor-content">

            {/* PHOTO */}

            <div className="coach-photo-column">

              <label>
                Photo du coach
              </label>


              <label
                htmlFor="coach-photo"
                className="coach-upload"
              >

                {photoPreview ||
                currentPhotoUrl ? (
                  <img
                    src={
                      photoPreview ||
                      currentPhotoUrl
                    }
                    alt="Coach"
                  />
                ) : (
                  <div className="coach-upload-empty">

                    <div>
                      +
                    </div>

                    <strong>
                      Ajouter une photo
                    </strong>

                    <span>
                      JPG, PNG ou WEBP
                    </span>

                  </div>
                )}


                <div className="coach-upload-action">
                  Choisir une photo
                </div>

              </label>


              <input
                id="coach-photo"
                type="file"
                className="coach-hidden-file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePhotoChange
                }
              />


              <small>
                Portrait recommandé.
                Taille maximale : 5 Mo.
              </small>

            </div>


            {/* FORMULAIRE */}

            <div className="coach-fields-column">

              <div className="coach-fields-grid">

                <Field
                  label="Prénom"
                  name="first_name"
                  value={
                    form.first_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Youness"
                  required
                />


                <Field
                  label="Nom"
                  name="last_name"
                  value={
                    form.last_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Houssaini"
                  required
                />


                <Field
                  label="Spécialité"
                  name="specialty"
                  value={
                    form.specialty
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Musculation, CrossFit, Fitness..."
                />


                <Field
                  label="Téléphone"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="+212 6..."
                />


                <div className="coach-field full">
                  <label>
                    Email
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="coach@gymsaas.ma"
                  />
                </div>


                <div className="coach-field full">
                  <label>
                    Biographie
                  </label>

                  <textarea
                    name="bio"
                    value={
                      form.bio
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Expérience, spécialités, méthode de coaching..."
                  />

                  <small>
                    Ce texte sera
                    présenté aux
                    visiteurs.
                  </small>
                </div>

              </div>


              <label className="coach-availability">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={
                    form.is_active
                  }
                  onChange={
                    handleChange
                  }
                />


                <span className="coach-toggle">
                  <i />
                </span>


                <div>
                  <strong>
                    Coach disponible
                  </strong>

                  <small>
                    Afficher ce profil
                    sur le site public
                  </small>
                </div>

              </label>


              <div className="coach-editor-actions">

                <button
                  type="button"
                  className="coach-secondary-button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  className="coach-primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Enregistrement..."
                    : editingId
                      ? "Enregistrer les modifications"
                      : "Créer le profil"}
                </button>

              </div>

            </div>

          </div>
        </form>
      )}


      <div className="coach-list-title">
        <div>
          <h2>
            Votre équipe
          </h2>

          <span>
            {coaches.length}{" "}
            coach
            {coaches.length > 1
              ? "s"
              : ""}
          </span>
        </div>
      </div>


      {loading ? (
        <div className="card">
          Chargement...
        </div>
      ) : (

        <div className="coach-admin-grid">

          {coaches.map(
            (coach) => (

              <article
                className="coach-admin-card"
                key={
                  coach.id
                }
              >

                <div className="coach-admin-card-image">

                  {coach.photo_url ? (
                    <img
                      src={
                        coach.photo_url
                      }
                      alt={
                        coach.full_name
                      }
                    />
                  ) : (
                    <div className="coach-image-fallback">
                      {getInitials(
                        coach,
                      )}
                    </div>
                  )}


                  <span
                    className={`coach-admin-status ${
                      coach.is_active
                        ? "available"
                        : "unavailable"
                    }`}
                  >
                    <i />

                    {coach.is_active
                      ? "Disponible"
                      : "Indisponible"}
                  </span>

                </div>


                <div className="coach-admin-card-body">

                  <span className="coach-card-specialty">
                    {coach.specialty ||
                      "Coach sportif"}
                  </span>


                  <h3>
                    {coach.full_name}
                  </h3>


                  <p>
                    {coach.bio
                      ? truncate(
                          coach.bio,
                          110,
                        )
                      : "Aucune présentation renseignée."}
                  </p>


                  {(coach.phone ||
                    coach.email) && (
                    <div className="coach-admin-contact">

                      {coach.phone && (
                        <span>
                          {coach.phone}
                        </span>
                      )}

                      {coach.email && (
                        <span>
                          {coach.email}
                        </span>
                      )}

                    </div>
                  )}


                  <button
                    type="button"
                    className="coach-edit-profile"
                    onClick={() =>
                      editCoach(
                        coach,
                      )
                    }
                  >
                    Modifier le profil

                    <span>
                      →
                    </span>
                  </button>

                </div>

              </article>
            ),
          )}


          {coaches.length ===
            0 && (
            <div className="coach-empty">
              <h3>
                Aucun coach
              </h3>

              <p>
                Ajoutez votre
                premier coach.
              </p>

              <button
                type="button"
                className="coach-primary-button"
                onClick={
                  createCoach
                }
              >
                Ajouter un coach
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}


function Field({
  label,
  name,
  type = "text",
  ...props
}) {
  return (
    <div className="coach-field">

      <label
        htmlFor={`coach-${name}`}
      >
        {label}
      </label>

      <input
        id={`coach-${name}`}
        name={name}
        type={type}
        {...props}
      />

    </div>
  );
}


function getInitials(
  coach,
) {
  const first =
    coach.first_name?.[0] ||
    "";

  const last =
    coach.last_name?.[0] ||
    "";

  return (
    `${first}${last}`
      .toUpperCase() ||
    "C"
  );
}


function truncate(
  text,
  length,
) {
  if (!text) {
    return "";
  }

  return text.length >
    length
    ? `${text.slice(
        0,
        length,
      )}…`
    : text;
}


export default Coaches;