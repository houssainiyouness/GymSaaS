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
  name: "",
  coach: "",
  room: "",
  start_at: "",
  end_at: "",
  capacity: 10,
  description: "",
  is_active: true,
};

function Courses() {
  const [courses, setCourses] =
    useState([]);

  const [coaches, setCoaches] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadData() {
    try {
      const [
        coursesResponse,
        coachesResponse,
      ] = await Promise.all([
        api.get("/courses/"),
        api.get("/coaches/"),
      ]);

      setCourses(
        extractList(
          coursesResponse,
        ),
      );

      setCoaches(
        extractList(
          coachesResponse,
        ),
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de charger les cours.",
        ),
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(course) {
    setEditingId(course.id);

    setForm({
      name:
        course.name || "",
      coach:
        course.coach || "",
      room:
        course.room || "",
      start_at:
        toLocalDateTime(
          course.start_at,
        ),
      end_at:
        toLocalDateTime(
          course.end_at,
        ),
      capacity:
        course.capacity || 10,
      description:
        course.description || "",
      is_active:
        Boolean(
          course.is_active,
        ),
    });

    setShowForm(true);
  }

  async function saveCourse(event) {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        coach:
          Number(form.coach),
        capacity:
          Number(form.capacity),
        start_at:
          new Date(
            form.start_at,
          ).toISOString(),
        end_at:
          new Date(
            form.end_at,
          ).toISOString(),
      };

      if (editingId) {
        await api.patch(
          `/courses/${editingId}/`,
          payload,
        );
      } else {
        await api.post(
          "/courses/",
          payload,
        );
      }

      setEditingId(null);
      setShowForm(false);
      setForm(emptyForm);

      await loadData();
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible d'enregistrer le cours.",
        ),
      );
    }
  }

  return (
    <div className="page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">
            Cours
          </h1>

          <p className="muted">
            Planning des activités
            et coachs.
          </p>
        </div>

        <button
          className="action-button primary"
          onClick={startCreate}
        >
          + Ajouter un cours
        </button>
      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="card admin-form-card"
          onSubmit={saveCourse}
        >
          <h2>
            {editingId
              ? "Modifier le cours"
              : "Nouveau cours"}
          </h2>

          <div className="admin-form-grid">
            <Field
              label="Nom"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <div className="admin-field">
              <label>Coach</label>

              <select
                name="coach"
                value={form.coach}
                onChange={handleChange}
                required
              >
                <option value="">
                  Choisir
                </option>

                {coaches
                  .filter(
                    (coach) =>
                      coach.is_active,
                  )
                  .map((coach) => (
                    <option
                      value={coach.id}
                      key={coach.id}
                    >
                      {coach.full_name}
                    </option>
                  ))}
              </select>
            </div>

            <Field
              label="Salle"
              name="room"
              value={form.room}
              onChange={handleChange}
            />

            <Field
              label="Capacité"
              name="capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={handleChange}
            />

            <Field
              label="Début"
              name="start_at"
              type="datetime-local"
              value={form.start_at}
              onChange={handleChange}
              required
            />

            <Field
              label="Fin"
              name="end_at"
              type="datetime-local"
              value={form.end_at}
              onChange={handleChange}
              required
            />

            <label className="checkbox-field">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />

              Cours actif
            </label>

            <div className="admin-field wide">
              <label>Description</label>

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="action-button primary"
            >
              Enregistrer
            </button>

            <button
              type="button"
              className="action-button"
              onClick={() =>
                setShowForm(false)
              }
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cours</th>
              <th>Coach</th>
              <th>Salle</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Capacité</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>
                  {course.name}
                </td>

                <td>
                  {course.coach_name}
                </td>

                <td>
                  {course.room || "—"}
                </td>

                <td>
                  {formatDate(
                    course.start_at,
                  )}
                </td>

                <td>
                  {formatDate(
                    course.end_at,
                  )}
                </td>

                <td>
                  {course.capacity}
                </td>

                <td>
                  <span
                    className={`badge ${
                      course.is_active
                        ? "active"
                        : "expired"
                    }`}
                  >
                    {course.is_active
                      ? "Actif"
                      : "Inactif"}
                  </span>
                </td>

                <td>
                  <button
                    className="action-button"
                    onClick={() =>
                      startEdit(course)
                    }
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div className="admin-field">
      <label>{label}</label>

      <input
        name={name}
        type={type}
        {...props}
      />
    </div>
  );
}

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  date.setMinutes(
    date.getMinutes()
      - date.getTimezoneOffset(),
  );

  return date
    .toISOString()
    .slice(0, 16);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(
    "fr-MA",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default Courses;