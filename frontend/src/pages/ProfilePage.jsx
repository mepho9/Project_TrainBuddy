import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProfilePage({
  onLogout,
}) {
  const email =
    localStorage.getItem("email");

  const role =
    localStorage.getItem("role");

  const [mySessions, setMySessions] =
    useState({
      created: [],
      joined: [],
    });

  const [activeTab, setActiveTab] =
    useState("created");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const fetchMySessions = async () => {
    setLoading(true);

    try {
      const response =
        await api.get(
          "/sessions/my"
        );

      setMySessions({
        created:
          response.data.created ||
          [],

        joined:
          response.data.joined ||
          [],
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger vos sessions."
      );

      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSession =
    async (sessionId) => {
      const confirmed =
        window.confirm(
          "Voulez-vous vraiment annuler cette session ? Les autres membres ne pourront plus la rejoindre."
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/sessions/${sessionId}/cancel`
        );

        setMessage(
          "La session a été annulée."
        );

        await fetchMySessions();
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Impossible d'annuler la session."
        );

        console.error(error);
      }
    };

  const leaveSession =
    async (sessionId) => {
      const confirmed =
        window.confirm(
          "Voulez-vous vraiment quitter cette session ? Vous perdrez l'accès au chat tant que vous ne la rejoignez pas à nouveau."
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(
          `/sessions/${sessionId}/leave`
        );

        setMessage(
          "Vous avez quitté la session."
        );

        await fetchMySessions();
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Impossible de quitter la session."
        );

        console.error(error);
      }
    };

  useEffect(() => {
    fetchMySessions();
  }, []);

  const displayedSessions =
    activeTab === "created"
      ? mySessions.created
      : mySessions.joined;

  return (
    <main className="content">
      <section className="hero-section">
        <p className="eyebrow">
          Profil membre
        </p>

        <h2>
          Votre espace personnel
        </h2>

        <p>
          Consultez les informations de votre
          compte ainsi que les sessions que vous
          avez créées ou rejointes.
        </p>
      </section>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      <section
        className="profile-card"
        style={{
          marginBottom: "28px",
        }}
      >
        <div className="profile-avatar">
          👤
        </div>

        <div
          style={{
            flex: 1,
          }}
        >
          <h3>
            {email}
          </h3>

          <p>
            Rôle : {role}
          </p>
        </div>

        <button
          className="logout-btn"
          onClick={onLogout}
        >
          Se déconnecter
        </button>
      </section>

      <section className="hero-section">
        <p className="eyebrow">
          Mes sessions
        </p>

        <h2>
          Vos entraînements
        </h2>

        <p>
          Retrouvez les séances que vous avez
          créées et celles que vous avez
          rejointes.
        </p>
      </section>

      <div
        className="nav-tabs"
        style={{
          width: "fit-content",
          marginBottom: "24px",
        }}
      >
        <button
          className={
            activeTab === "created"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("created")
          }
        >
          Créées (
          {mySessions.created.length})
        </button>

        <button
          className={
            activeTab === "joined"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("joined")
          }
        >
          Rejointes (
          {mySessions.joined.length})
        </button>
      </div>

      {loading ? (
        <section className="session-card">
          <h3>
            Chargement...
          </h3>

          <p className="description">
            Récupération de vos sessions.
          </p>
        </section>
      ) : displayedSessions.length === 0 ? (
        <section className="session-card">
          <h3>
            Aucune session
          </h3>

          <p className="description">
            {activeTab === "created"
              ? "Vous n'avez encore créé aucune session."
              : "Vous n'avez rejoint aucune session."}
          </p>
        </section>
      ) : (
        <section className="sessions-grid">
          {displayedSessions.map(
            (session) => (
              <article
                className="session-card"
                key={session.id}
              >
                <div className="session-card-header">
                  <span className="badge">
                    {formatStatus(
                      session.status
                    )}
                  </span>

                  <span className="capacity">
                    {
                      session.availablePlaces
                    }{" "}
                    place(s) libre(s)
                  </span>
                </div>

                <h3>
                  {session.title}
                </h3>

                <p className="activity">
                  {session.activityType}
                </p>

                <p className="description">
                  {session.description ||
                    "Aucune description."}
                </p>

                <div className="session-meta">
                  <span>
                    📍 {session.gymName}
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
                    👥{" "}
                    {
                      session.participantCount
                    }{" "}
                    / {session.capacity}
                  </span>
                </div>

                {activeTab ===
                  "created" &&
                  session.status ===
                    "UPCOMING" && (
                    <button
                      className="secondary-btn"
                      style={{
                        color:
                          "#dc2626",

                        background:
                          "#fef2f2",
                      }}
                      onClick={() =>
                        cancelSession(
                          session.id
                        )
                      }
                    >
                      Annuler la session
                    </button>
                  )}

                {activeTab ===
                  "joined" &&
                  session.status ===
                    "UPCOMING" && (
                    <button
                      className="secondary-btn"
                      style={{
                        color:
                          "#dc2626",

                        background:
                          "#fef2f2",
                      }}
                      onClick={() =>
                        leaveSession(
                          session.id
                        )
                      }
                    >
                      Quitter la session
                    </button>
                  )}

                {session.status ===
                  "COMPLETED" && (
                  <button
                    className="success-btn"
                    disabled
                    style={{
                      width: "100%",
                    }}
                  >
                    Session terminée
                  </button>
                )}

                {session.status ===
                  "CANCELLED" && (
                  <button
                    className="secondary-btn"
                    disabled
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    Session annulée
                  </button>
                )}
              </article>
            )
          )}
        </section>
      )}
    </main>
  );
}

function formatDate(value) {
  if (!value) {
    return "Date inconnue";
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

function formatStatus(status) {
  switch (status) {
    case "UPCOMING":
      return "À venir";

    case "COMPLETED":
      return "Terminée";

    case "CANCELLED":
      return "Annulée";

    default:
      return status;
  }
}