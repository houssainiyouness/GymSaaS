import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import api, {
  extractList,
  getApiError,
} from "../services/api";

import "../styles/admin-tools.css";

function Members() {
  const location = useLocation();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(
    location.state?.success || ""
  );

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  async function loadData(searchValue = appliedSearch) {
    try {
      setLoading(true);
      setError("");

      const [
        membersResponse,
        subscriptionsResponse,
      ] = await Promise.all([
        api.get("/members/", {
          params: searchValue
            ? { search: searchValue }
            : {},
        }),

        api.get("/subscriptions/"),
      ]);

      setMembers(
        extractList(membersResponse)
      );

      setSubscriptions(
        extractList(subscriptionsResponse)
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de charger les membres depuis Django."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData("");

    if (location.state?.success) {
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, []);

  async function submitSearch(event) {
    event.preventDefault();

    const value = search.trim();

    setAppliedSearch(value);

    await loadData(value);
  }

  async function clearSearch() {
    setSearch("");
    setAppliedSearch("");

    await loadData("");
  }

  const subscriptionByMember = useMemo(() => {
    const map = new Map();

    subscriptions.forEach((subscription) => {
      const current = map.get(
        subscription.member
      );

      if (
        !current ||
        ["ACTIVE", "EXPIRING_SOON"].includes(
          subscription.status
        )
      ) {
        map.set(
          subscription.member,
          subscription
        );
      }
    });

    return map;
  }, [subscriptions]);

  async function toggleMember(member) {
    try {
      setError("");
      setSuccess("");

      await api.patch(
        `/members/${member.id}/`,
        {
          is_active: !member.is_active,
        }
      );

      setSuccess(
        member.is_active
          ? "Membre désactivé."
          : "Membre réactivé."
      );

      await loadData();
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de modifier le statut du membre."
        )
      );
    }
  }

  async function deleteMember(member) {
    const memberName =
      member.full_name ||
      member.username;

    const confirmed =
      window.confirm(
        `Supprimer définitivement ${memberName} ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/members/${member.id}/`
      );

      setSuccess(
        "Membre supprimé."
      );

      await loadData();
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Impossible de supprimer ce membre."
        )
      );
    }
  }

  return (
    <div className="page">

      <div className="page-toolbar">

        <div>
          <h1 className="page-title">
            Membres
          </h1>

          <p className="muted">
            Gestion des adhérents GymSaaS.
          </p>
        </div>

        <Link
          className="action-button primary"
          to="/members/new"
        >
          + Ajouter un membre
        </Link>

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

      <form
        className="card filter-bar member-search"
        onSubmit={submitSearch}
      >

        <label htmlFor="member-search">

          Rechercher un membre

          <input
            id="member-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Nom, utilisateur, e-mail, téléphone…"
          />

        </label>

        <button
          className="action-button primary"
          type="submit"
          disabled={loading}
        >
          Rechercher
        </button>

        {(search || appliedSearch) && (
          <button
            className="action-button"
            type="button"
            onClick={clearSearch}
            disabled={loading}
          >
            Effacer
          </button>
        )}

        {appliedSearch && (
          <span className="muted search-result-label">
            Résultats pour « {appliedSearch} »
          </span>
        )}

      </form>

      <div className="card table-wrap">

        {loading ? (

          <p className="muted">
            Chargement des membres...
          </p>

        ) : (

          <table>

            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>
                  Téléphone d'urgence
                </th>
                <th>Abonnement</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {members.map((member) => {

                const subscription =
                  subscriptionByMember.get(
                    member.id
                  );

                return (
                  <tr key={member.id}>

                    <td>
                      {member.full_name ||
                        member.username}
                    </td>

                    <td>
                      {member.email || "-"}
                    </td>

                    <td>
                      {member.emergency_phone ||
                        "-"}
                    </td>

                    <td>
                      {subscription?.plan_name ||
                        "Aucun"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          member.is_active
                            ? "active"
                            : "expired"
                        }`}
                      >
                        {member.is_active
                          ? "Actif"
                          : "Inactif"}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        member.joined_at
                      )}
                    </td>

                    <td>

                      <div className="row-actions">

                        <button
                          className={`action-button ${
                            member.is_active
                              ? "warning"
                              : "success"
                          }`}
                          type="button"
                          onClick={() =>
                            toggleMember(member)
                          }
                        >
                          {member.is_active
                            ? "Désactiver"
                            : "Réactiver"}
                        </button>

                        <button
                          className="action-button danger"
                          type="button"
                          onClick={() =>
                            deleteMember(member)
                          }
                        >
                          Supprimer
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })}

              {members.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="muted"
                  >
                    {appliedSearch
                      ? "Aucun membre ne correspond à cette recherche."
                      : "Aucun membre trouvé."}
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "fr-MA",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(new Date(value));
}

export default Members;