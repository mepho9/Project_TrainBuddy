import {
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const EMPTY_SUBSCRIPTION = {
  planCode: "STANDARD",
  planName:
    "TrainBuddy Standard",
  premium: false,
  status: "STANDARD",
  priceCents: 0,
  currency: "EUR",
  maxActiveSessions: 2,
  activeCreatedSessions: 0,
  maxCapacity: 5,
  advancedFilters: false,
  highlightedSessions: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

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

  const [
    subscription,
    setSubscription,
  ] = useState(
    EMPTY_SUBSCRIPTION
  );

  const [activeTab, setActiveTab] =
    useState("created");

  const [loading, setLoading] =
    useState(true);

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true);

  const [message, setMessage] =
    useState("");

  const fetchMySessions =
    async () => {
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
          error.response?.data
            ?.message ||
            "Impossible de charger vos sessions."
        );

        console.error(error);
      }
    };

  const fetchSubscription =
    async () => {
      setSubscriptionLoading(
        true
      );

      try {
        const response =
          await api.get(
            "/subscriptions/me"
          );

        setSubscription(
          response.data
        );
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de charger votre abonnement."
        );

        console.error(error);
      } finally {
        setSubscriptionLoading(
          false
        );
      }
    };

  const fetchEverything =
    async () => {
      setLoading(true);

      await Promise.all([
        fetchMySessions(),
        fetchSubscription(),
      ]);

      setLoading(false);
    };

  const startPremiumCheckout =
    async () => {
      try {
        const response =
          await api.post(
            "/subscriptions/checkout"
          );

        window.location.href =
          response.data.url;
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible de démarrer le paiement Stripe."
        );

        console.error(error);
      }
    };

  const cancelPremium =
    async () => {
      const confirmed =
        window.confirm(
          "Annuler Premium à la fin de la période déjà payée ? Vous conserverez vos avantages jusqu'à cette date."
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await api.post(
            "/subscriptions/cancel"
          );

        setSubscription(
          response.data
        );

        setMessage(
          "L'annulation est programmée. Premium reste actif jusqu'à la fin de la période en cours."
        );
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible d'annuler l'abonnement."
        );

        console.error(error);
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

        /*
         * On recharge à la fois les sessions
         * ET l'abonnement afin que le compteur
         * passe immédiatement de 2/2 à 1/2,
         * par exemple.
         */
        await Promise.all([
          fetchMySessions(),
          fetchSubscription(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Impossible d'annuler la session."
        );

        console.error(error);
      }
    };

  const leaveSession =
    async (sessionId) => {
      const confirmed =
        window.confirm(
          "Voulez-vous vraiment quitter cette session ?"
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
          error.response?.data
            ?.message ||
            "Impossible de quitter la session."
        );

        console.error(error);
      }
    };

  useEffect(() => {
    fetchEverything();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const checkout =
      params.get(
        "checkout"
      );

    let timer;

    if (
      checkout === "success"
    ) {
      setMessage(
        "Paiement Stripe terminé. Activation de Premium en cours..."
      );

      timer =
        window.setTimeout(
          async () => {
            await fetchSubscription();

            setMessage(
              "Paiement terminé. Votre statut d'abonnement a été actualisé."
            );
          },
          2000
        );
    }

    if (
      checkout ===
      "cancelled"
    ) {
      setMessage(
        "Paiement annulé. Votre compte reste en formule Standard."
      );
    }

    if (checkout) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }

    return () => {
      if (timer) {
        window.clearTimeout(
          timer
        );
      }
    };
  }, []);

  const displayedSessions =
    activeTab ===
    "created"
      ? mySessions.created
      : mySessions.joined;

  const premiumPrice =
    (
      subscription
        .priceCents / 100
    ).toFixed(2);

  const sessionLimitReached =
    subscription.activeCreatedSessions >=
    subscription.maxActiveSessions;

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
          Gérez votre compte,
          votre abonnement et vos
          sessions TrainBuddy.
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
          marginBottom:
            "28px",
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

          {subscription.premium && (
            <p
              style={{
                fontWeight: 700,
              }}
            >
              ⭐ Membre Premium
            </p>
          )}
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
          Mon abonnement
        </p>

        <h2>
          {subscription.premium
            ? "⭐ TrainBuddy Premium"
            : "TrainBuddy Standard"}
        </h2>

        <p>
          {subscription.premium
            ? "Votre compte bénéficie actuellement des fonctionnalités Premium."
            : "Passez à Premium pour créer davantage de sessions et accéder aux fonctionnalités avancées."}
        </p>

      </section>

      {subscriptionLoading ? (

        <section className="session-card">
          <h3>
            Chargement de l'abonnement...
          </h3>
        </section>

      ) : (

        <section
          className="session-card"
          style={{
            marginBottom:
              "32px",
          }}
        >

          <div className="session-card-header">

            <span className="badge">
              {
                subscription.planCode
              }
            </span>

            <span className="capacity">
              {subscription.premium
                ? `${premiumPrice} € / mois`
                : "Gratuit"}
            </span>

          </div>

          <h3>
            {
              subscription.planName
            }
          </h3>

          <div className="session-meta">

            <span
              style={{
                fontWeight:
                  sessionLimitReached
                    ? 800
                    : 600,
              }}
            >
              📅 Sessions actives créées :{" "}
              {
                subscription.activeCreatedSessions
              }
              {" / "}
              {
                subscription.maxActiveSessions
              }
            </span>

            <span>
              👥 Capacité maximale :{" "}
              {
                subscription.maxCapacity
              }
            </span>

            <span>
              🔎 Filtres avancés :{" "}
              {subscription.advancedFilters
                ? "Oui"
                : "Non"}
            </span>

            <span>
              ⭐ Mise en avant :{" "}
              {subscription.highlightedSessions
                ? "Oui"
                : "Non"}
            </span>

            {subscription
              .currentPeriodEnd && (
              <span>
                🗓️ Fin de période :{" "}
                {formatDate(
                  subscription
                    .currentPeriodEnd
                )}
              </span>
            )}

          </div>

          {sessionLimitReached && (
            <div
              className="page-message"
              style={{
                marginTop:
                  "18px",
              }}
            >
              {subscription.premium
                ? `Vous avez atteint la limite Premium de ${subscription.maxActiveSessions} sessions actives.`
                : "Vous avez atteint la limite Standard. Premium permet jusqu'à 10 sessions actives."}
            </div>
          )}

          {!subscription.premium && (

            <div
              style={{
                marginTop:
                  "20px",
              }}
            >

              <h4>
                Premium — 4,99 € / mois
              </h4>

              <p className="description">
                Jusqu'à 10 sessions actives,
                12 participants par session,
                rayon jusqu'à 200 km,
                recherche avec -mot et
                mise en avant de vos sessions.
              </p>

              <button
                className="primary-btn"
                onClick={
                  startPremiumCheckout
                }
              >
                Passer Premium — 4,99 €/mois
              </button>

            </div>
          )}

          {subscription.premium &&
            !subscription
              .cancelAtPeriodEnd && (

            <button
              className="secondary-btn"
              style={{
                marginTop:
                  "20px",
              }}
              onClick={
                cancelPremium
              }
            >
              Annuler l'abonnement
            </button>
          )}

          {subscription.premium &&
            subscription
              .cancelAtPeriodEnd && (

            <div
              className="page-message"
              style={{
                marginTop:
                  "20px",
              }}
            >
              Annulation programmée.
              Premium reste actif jusqu'à
              la fin de la période payée.
            </div>
          )}

        </section>
      )}

      <section className="hero-section">

        <p className="eyebrow">
          Mes sessions
        </p>

        <h2>
          Vos entraînements
        </h2>

        <p>
          Retrouvez les séances
          que vous avez créées et
          celles que vous avez rejointes.
        </p>

      </section>

      <div
        className="nav-tabs"
        style={{
          width:
            "fit-content",

          marginBottom:
            "24px",
        }}
      >

        <button
          className={
            activeTab ===
            "created"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "created"
            )
          }
        >
          Créées (
          {
            mySessions
              .created
              .length
          })
        </button>

        <button
          className={
            activeTab ===
            "joined"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "joined"
            )
          }
        >
          Rejointes (
          {
            mySessions
              .joined
              .length
          })
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

      ) : displayedSessions.length ===
        0 ? (

        <section className="session-card">

          <h3>
            Aucune session
          </h3>

          <p className="description">
            {activeTab ===
            "created"
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
                key={
                  session.id
                }
              >

                <div className="session-card-header">

                  <span className="badge">
                    {formatStatus(
                      session.status
                    )}
                  </span>

                  {session
                    .premiumHighlighted && (

                    <span className="capacity">
                      ⭐ PREMIUM
                    </span>
                  )}

                </div>

                <h3>
                  {
                    session.title
                  }
                </h3>

                <p className="activity">
                  {
                    session.activityType
                  }
                </p>

                <p className="description">
                  {session.description ||
                    "Aucune description."}
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
                    👥{" "}
                    {
                      session.participantCount
                    }{" "}
                    /{" "}
                    {
                      session.capacity
                    }
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
                      width:
                        "100%",
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

function formatDate(
  value
) {
  if (!value) {
    return "Date inconnue";
  }

  return new Date(
    value
  ).toLocaleString(
    "fr-BE",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function formatStatus(
  status
) {
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