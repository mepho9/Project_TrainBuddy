import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";

import AdminReportsSection
  from "../components/AdminReportsSection";

const EMPTY_GYM = {
  name: "",
  type: "",
  address: "",
  latitude: "",
  longitude: "",
};

export default function AdminPage() {
  const currentEmail =
    localStorage.getItem(
      "email"
    );

  const [activeTab, setActiveTab] =
    useState("users");

  const [users, setUsers] =
    useState([]);

  const [gyms, setGyms] =
    useState([]);

  const [sessions, setSessions] =
    useState([]);

  const [reports, setReports] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [
    sessionSearch,
    setSessionSearch,
  ] = useState("");

  const [
    sessionStatus,
    setSessionStatus,
  ] = useState("");

  const [gymForm, setGymForm] =
    useState(EMPTY_GYM);

  const [
    editingGymId,
    setEditingGymId,
  ] = useState(null);

  /*
   * =========================
   * CHARGEMENT
   * =========================
   */

  const fetchUsers =
    async () => {
      const response =
        await api.get(
          "/admin/users"
        );

      setUsers(
        response.data
      );
    };

  const fetchGyms =
    async () => {
      const response =
        await api.get(
          "/admin/gyms"
        );

      setGyms(
        response.data
      );
    };

  const fetchSessions =
    async () => {
      const response =
        await api.get(
          "/admin/sessions"
        );

      setSessions(
        response.data
      );
    };

  const fetchReports =
    async () => {
      const response =
        await api.get(
          "/admin/reports"
        );

      setReports(
        response.data
      );
    };

  const fetchEverything =
    async () => {
      setLoading(true);

      try {
        await Promise.all([
          fetchUsers(),
          fetchGyms(),
          fetchSessions(),
          fetchReports(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de charger l'administration."
        );

        console.error(
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchEverything();
  }, []);

  /*
   * =========================
   * UTILISATEURS
   * =========================
   */

  const banUser =
    async (user) => {
      const confirmed =
        window.confirm(
          `Bannir ${user.email} ?\n\nIl sera retiré de ses sessions et ses futures sessions créées seront annulées.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/users/${user.id}/ban`
        );

        setMessage(
          `${user.email} a été banni.`
        );

        await Promise.all([
          fetchUsers(),
          fetchSessions(),
          fetchReports(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de bannir cet utilisateur."
        );

        console.error(error);
      }
    };

  const unbanUser =
    async (user) => {
      const confirmed =
        window.confirm(
          `Débannir ${user.email} ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/users/${user.id}/unban`
        );

        setMessage(
          `${user.email} a été débanni.`
        );

        await Promise.all([
          fetchUsers(),
          fetchReports(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de débannir cet utilisateur."
        );

        console.error(error);
      }
    };

  /*
   * =========================
   * SALLES
   * =========================
   */

  const saveGym =
    async (event) => {
      event.preventDefault();

      const payload = {
        name:
          gymForm.name.trim(),

        type:
          gymForm.type.trim(),

        address:
          gymForm.address.trim(),

        latitude:
          gymForm.latitude ===
          ""
            ? null
            : Number(
                gymForm.latitude
              ),

        longitude:
          gymForm.longitude ===
          ""
            ? null
            : Number(
                gymForm.longitude
              ),
      };

      try {
        if (editingGymId) {
          await api.put(
            `/admin/gyms/${editingGymId}`,
            payload
          );

          setMessage(
            "Salle modifiée avec succès."
          );
        } else {
          await api.post(
            "/admin/gyms",
            payload
          );

          setMessage(
            "Salle créée avec succès."
          );
        }

        setGymForm(
          EMPTY_GYM
        );

        setEditingGymId(
          null
        );

        await fetchGyms();
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible d'enregistrer la salle."
        );

        console.error(error);
      }
    };

  const editGym =
    (gym) => {
      setEditingGymId(
        gym.id
      );

      setGymForm({
        name:
          gym.name || "",

        type:
          gym.type || "",

        address:
          gym.address ||
          "",

        latitude:
          gym.latitude ??
          "",

        longitude:
          gym.longitude ??
          "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const cancelGymEdition =
    () => {
      setEditingGymId(
        null
      );

      setGymForm(
        EMPTY_GYM
      );
    };

  const toggleGym =
    async (gym) => {
      const newStatus =
        !gym.active;

      const confirmed =
        window.confirm(
          newStatus
            ? `Réactiver ${gym.name} ?`
            : `Désactiver ${gym.name} ? Elle ne sera plus proposée pour les nouvelles sessions.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/gyms/${gym.id}/active`,
          null,
          {
            params: {
              active:
                newStatus,
            },
          }
        );

        setMessage(
          newStatus
            ? "Salle réactivée."
            : "Salle désactivée."
        );

        await fetchGyms();
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de modifier l'état de la salle."
        );

        console.error(error);
      }
    };

  /*
   * =========================
   * SESSIONS
   * =========================
   */

  const cancelSession =
    async (session) => {
      const confirmed =
        window.confirm(
          `Retirer la session "${session.title}" ?\n\nElle passera au statut CANCELLED et ne sera plus visible dans la recherche publique.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/sessions/${session.id}/cancel`
        );

        setMessage(
          "La session a été retirée."
        );

        await Promise.all([
          fetchSessions(),
          fetchReports(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de retirer cette session."
        );

        console.error(error);
      }
    };

  /*
   * =========================
   * SIGNALEMENTS
   * =========================
   */

  const reviewReport =
    async (report) => {
      try {
        await api.patch(
          `/admin/reports/${report.id}/review`
        );

        setMessage(
          "Signalement pris en charge."
        );

        await fetchReports();
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de prendre ce signalement en charge."
        );

        console.error(error);
      }
    };

  const ignoreReport =
    async (report) => {
      const confirmed =
        window.confirm(
          "Fermer ce signalement sans sanction ?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/ignore`
        );

        setMessage(
          "Signalement fermé sans sanction."
        );

        await fetchReports();
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de fermer ce signalement."
        );

        console.error(error);
      }
    };

  const cancelReportedSession =
    async (report) => {
      const confirmed =
        window.confirm(
          `Retirer la session "${report.targetSessionTitle}" à la suite de ce signalement ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/cancel-session`
        );

        setMessage(
          "Session retirée et signalement fermé."
        );

        await Promise.all([
          fetchReports(),
          fetchSessions(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de retirer cette session."
        );

        console.error(error);
      }
    };

  const banReportedUser =
    async (report) => {
      const confirmed =
        window.confirm(
          `Bannir ${report.targetUserEmail} à la suite de ce signalement ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/ban-user`
        );

        setMessage(
          "Utilisateur banni et signalement fermé."
        );

        await Promise.all([
          fetchReports(),
          fetchUsers(),
          fetchSessions(),
        ]);
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de bannir cet utilisateur."
        );

        console.error(error);
      }
    };

  /*
   * =========================
   * FILTRES
   * =========================
   */

  const filteredUsers =
    useMemo(() => {
      const query =
        userSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          user.email
            .toLowerCase()
            .includes(query)
      );
    }, [
      users,
      userSearch,
    ]);

  const filteredSessions =
    useMemo(() => {
      const query =
        sessionSearch
          .trim()
          .toLowerCase();

      return sessions.filter(
        (session) => {
          const matchesSearch =
            !query ||
            session.title
              .toLowerCase()
              .includes(
                query
              ) ||
            session.activityType
              .toLowerCase()
              .includes(
                query
              ) ||
            session.gymName
              .toLowerCase()
              .includes(
                query
              ) ||
            session.creatorEmail
              .toLowerCase()
              .includes(
                query
              );

          const matchesStatus =
            !sessionStatus ||
            session.status ===
              sessionStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      sessions,
      sessionSearch,
      sessionStatus,
    ]);

  return (
    <main className="content">

      <section className="hero-section">

        <p className="eyebrow">
          Back-office
        </p>

        <h2>
          Administration TrainBuddy
        </h2>

        <p>
          Gérez les utilisateurs,
          les salles, les sessions et
          les signalements de la plateforme.
        </p>

      </section>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      <div
        className="nav-tabs"
        style={{
          width:
            "fit-content",

          marginBottom:
            "28px",
        }}
      >

        <button
          className={
            activeTab ===
            "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "users"
            )
          }
        >
          Utilisateurs (
          {users.length})
        </button>

        <button
          className={
            activeTab ===
            "gyms"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "gyms"
            )
          }
        >
          Salles (
          {gyms.length})
        </button>

        <button
          className={
            activeTab ===
            "sessions"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "sessions"
            )
          }
        >
          Sessions (
          {sessions.length})
        </button>

        <button
          className={
            activeTab ===
            "reports"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "reports"
            )
          }
        >
          Signalements (
          {reports.filter(
            (report) =>
              report.status !==
              "CLOSED"
          ).length}
          )
        </button>

      </div>

      {loading ? (

        <section className="session-card">

          <h3>
            Chargement...
          </h3>

          <p className="description">
            Récupération des données
            d'administration.
          </p>

        </section>

      ) : (
        <>

          {activeTab ===
            "users" && (
            <UsersSection
              users={
                filteredUsers
              }
              userSearch={
                userSearch
              }
              setUserSearch={
                setUserSearch
              }
              currentEmail={
                currentEmail
              }
              onBan={
                banUser
              }
              onUnban={
                unbanUser
              }
            />
          )}

          {activeTab ===
            "gyms" && (
            <GymsSection
              gyms={gyms}
              gymForm={
                gymForm
              }
              setGymForm={
                setGymForm
              }
              editingGymId={
                editingGymId
              }
              onSave={
                saveGym
              }
              onEdit={
                editGym
              }
              onCancelEdit={
                cancelGymEdition
              }
              onToggle={
                toggleGym
              }
            />
          )}

          {activeTab ===
            "sessions" && (
            <SessionsSection
              sessions={
                filteredSessions
              }
              sessionSearch={
                sessionSearch
              }
              setSessionSearch={
                setSessionSearch
              }
              sessionStatus={
                sessionStatus
              }
              setSessionStatus={
                setSessionStatus
              }
              onCancel={
                cancelSession
              }
            />
          )}

          {activeTab ===
            "reports" && (
            <AdminReportsSection
              reports={reports}
              onReview={
                reviewReport
              }
              onIgnore={
                ignoreReport
              }
              onCancelSession={
                cancelReportedSession
              }
              onBanUser={
                banReportedUser
              }
            />
          )}

        </>
      )}

    </main>
  );
}

function UsersSection({
  users,
  userSearch,
  setUserSearch,
  currentEmail,
  onBan,
  onUnban,
}) {
  return (
    <>
      <section className="create-session-form">

        <div className="form-row">

          <label>
            Rechercher un utilisateur
          </label>

          <input
            type="text"
            placeholder="Adresse e-mail..."
            value={
              userSearch
            }
            onChange={(event) =>
              setUserSearch(
                event.target
                  .value
              )
            }
          />

        </div>

      </section>

      <section className="sessions-grid">

        {users.map(
          (user) => {
            const isCurrentAdmin =
              user.email ===
              currentEmail;

            const isAdmin =
              user.role ===
              "ADMIN";

            return (
              <article
                className="session-card"
                key={user.id}
              >

                <div className="session-card-header">

                  <span className="badge">
                    {user.role}
                  </span>

                  <span
                    className="capacity"
                    style={{
                      color:
                        user.banned
                          ? "#dc2626"
                          : "#16a34a",
                    }}
                  >
                    {user.banned
                      ? "BANNI"
                      : "ACTIF"}
                  </span>

                </div>

                <h3>
                  {user.email}
                </h3>

                <div className="session-meta">

                  <span>
                    👤 Rôle :{" "}
                    {user.role}
                  </span>

                  <span>
                    📅 Inscription :{" "}
                    {formatDate(
                      user.createdAt
                    )}
                  </span>

                  <span>
                    🕒 Dernière connexion :{" "}
                    {user.lastLoginAt
                      ? formatDate(
                          user.lastLoginAt
                        )
                      : "Jamais"}
                  </span>

                </div>

                {isCurrentAdmin ? (

                  <button
                    className="secondary-btn"
                    disabled
                  >
                    Votre compte
                  </button>

                ) : isAdmin ? (

                  <button
                    className="secondary-btn"
                    disabled
                  >
                    Administrateur
                  </button>

                ) : user.banned ? (

                  <button
                    className="primary-btn"
                    onClick={() =>
                      onUnban(
                        user
                      )
                    }
                  >
                    Débannir
                  </button>

                ) : (

                  <button
                    className="secondary-btn"
                    style={{
                      background:
                        "#fef2f2",

                      color:
                        "#dc2626",
                    }}
                    onClick={() =>
                      onBan(
                        user
                      )
                    }
                  >
                    Bannir
                  </button>
                )}

              </article>
            );
          }
        )}

      </section>
    </>
  );
}

function GymsSection({
  gyms,
  gymForm,
  setGymForm,
  editingGymId,
  onSave,
  onEdit,
  onCancelEdit,
  onToggle,
}) {
  return (
    <>
      <form
        className="create-session-form"
        onSubmit={onSave}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          {editingGymId
            ? "Modifier la salle"
            : "Ajouter une salle"}
        </h3>

        <div className="form-grid">

          <div className="form-row">

            <label>
              Nom
            </label>

            <input
              required
              type="text"
              value={
                gymForm.name
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  name:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              Type
            </label>

            <input
              required
              type="text"
              placeholder="Fitness, CrossFit..."
              value={
                gymForm.type
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  type:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              Latitude
            </label>

            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={
                gymForm.latitude
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  latitude:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              Longitude
            </label>

            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={
                gymForm.longitude
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  longitude:
                    event.target
                      .value,
                })
              }
            />

          </div>

        </div>

        <div className="form-row">

          <label>
            Adresse
          </label>

          <input
            required
            type="text"
            value={
              gymForm.address
            }
            onChange={(event) =>
              setGymForm({
                ...gymForm,

                address:
                  event.target
                    .value,
              })
            }
          />

        </div>

        <div className="card-actions">

          <button
            className="primary-btn"
            type="submit"
          >
            {editingGymId
              ? "Enregistrer les modifications"
              : "Ajouter la salle"}
          </button>

          {editingGymId && (

            <button
              className="secondary-btn"
              type="button"
              onClick={
                onCancelEdit
              }
            >
              Annuler la modification
            </button>

          )}

        </div>

      </form>

      <section className="gyms-grid">

        {gyms.map(
          (gym) => (
            <article
              className="gym-card"
              key={gym.id}
            >

              <div className="gym-icon">
                📍
              </div>

              <div>

                <h3>
                  {gym.name}
                </h3>

                <p className="activity">
                  {gym.type}
                </p>

                <p className="description">
                  {gym.address}
                </p>

              </div>

              <div className="session-meta">

                <span>
                  État :{" "}
                  {gym.active
                    ? "Active"
                    : "Inactive"}
                </span>

                <span>
                  Latitude :{" "}
                  {gym.latitude ??
                    "Non définie"}
                </span>

                <span>
                  Longitude :{" "}
                  {gym.longitude ??
                    "Non définie"}
                </span>

              </div>

              <div className="card-actions">

                <button
                  className="secondary-btn"
                  onClick={() =>
                    onEdit(
                      gym
                    )
                  }
                >
                  Modifier
                </button>

                <button
                  className="secondary-btn"
                  style={{
                    background:
                      gym.active
                        ? "#fef2f2"
                        : "#f0fdf4",

                    color:
                      gym.active
                        ? "#dc2626"
                        : "#16a34a",
                  }}
                  onClick={() =>
                    onToggle(
                      gym
                    )
                  }
                >
                  {gym.active
                    ? "Désactiver"
                    : "Réactiver"}
                </button>

              </div>

            </article>
          )
        )}

      </section>
    </>
  );
}

function SessionsSection({
  sessions,
  sessionSearch,
  setSessionSearch,
  sessionStatus,
  setSessionStatus,
  onCancel,
}) {
  return (
    <>
      <section className="create-session-form">

        <div className="form-grid">

          <div className="form-row">

            <label>
              Recherche
            </label>

            <input
              type="text"
              placeholder="Titre, salle, créateur..."
              value={
                sessionSearch
              }
              onChange={(event) =>
                setSessionSearch(
                  event.target
                    .value
                )
              }
            />

          </div>

          <div className="form-row">

            <label>
              Statut
            </label>

            <select
              value={
                sessionStatus
              }
              onChange={(event) =>
                setSessionStatus(
                  event.target
                    .value
                )
              }
            >

              <option value="">
                Tous
              </option>

              <option value="UPCOMING">
                UPCOMING
              </option>

              <option value="COMPLETED">
                COMPLETED
              </option>

              <option value="CANCELLED">
                CANCELLED
              </option>

            </select>

          </div>

        </div>

      </section>

      <section className="sessions-grid">

        {sessions.map(
          (session) => (
            <article
              className="session-card"
              key={session.id}
            >

              <div className="session-card-header">

                <span className="badge">
                  {
                    session.status
                  }
                </span>

                <span className="capacity">
                  {
                    session.participantCount
                  }{" "}
                  /{" "}
                  {
                    session.capacity
                  }
                </span>

              </div>

              <h3>
                {session.title}
              </h3>

              <p className="activity">
                {
                  session.activityType
                }
              </p>

              <div className="session-meta">

                <span>
                  📍{" "}
                  {
                    session.gymName
                  }
                </span>

                <span>
                  🕒{" "}
                  {formatDate(
                    session.startAt
                  )}
                </span>

                <span>
                  ⏱️{" "}
                  {
                    session.durationMin
                  }{" "}
                  min
                </span>

                <span>
                  👤 Créateur :{" "}
                  {
                    session.creatorEmail
                  }
                </span>

              </div>

              {session.status ===
              "UPCOMING" ? (

                <button
                  className="secondary-btn"
                  style={{
                    background:
                      "#fef2f2",

                    color:
                      "#dc2626",
                  }}
                  onClick={() =>
                    onCancel(
                      session
                    )
                  }
                >
                  Retirer la session
                </button>

              ) : (

                <button
                  className="secondary-btn"
                  disabled
                >
                  {session.status ===
                  "COMPLETED"
                    ? "Session terminée"
                    : "Session annulée"}
                </button>
              )}

            </article>
          )
        )}

      </section>
    </>
  );
}

function formatDate(
  value
) {
  if (!value) {
    return "Inconnue";
  }

  return new Date(
    value
  ).toLocaleString(
    "fr-BE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}