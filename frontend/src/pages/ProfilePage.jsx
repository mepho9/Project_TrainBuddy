import {
  useEffect,
  useState,
} from "react";

import api
  from "../api/axios";

import { useLanguage }
  from "../i18n/LanguageContext";

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
  const {
    t,
    locale,
  } = useLanguage();

  const email =
    localStorage.getItem(
      "email"
    );

  const role =
    localStorage.getItem(
      "role"
    );

  const [
    mySessions,
    setMySessions,
  ] = useState({
    created: [],
    joined: [],
  });

  const [
    subscription,
    setSubscription,
  ] = useState(
    EMPTY_SUBSCRIPTION
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "created"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

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
            t(
              "profile.sessionsLoadError"
            )
        );

        console.error(
          error
        );
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
            t(
              "subscription.loadError"
            )
        );

        console.error(
          error
        );

      } finally {
        setSubscriptionLoading(
          false
        );
      }
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
            t(
              "subscription.checkoutError"
            )
        );

        console.error(
          error
        );
      }
    };

  const cancelPremium =
    async () => {
      const confirmed =
        window.confirm(
          t(
            "subscription.cancelConfirm"
          )
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
          t(
            "subscription.cancelScheduled"
          )
        );

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "subscription.cancelError"
            )
        );

        console.error(
          error
        );
      }
    };

  const cancelSession =
    async (
      sessionId
    ) => {
      const confirmed =
        window.confirm(
          t(
            "profile.cancelConfirm"
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/sessions/${sessionId}/cancel`
        );

        setMessage(
          t(
            "profile.cancelSuccess"
          )
        );

        await Promise.all([
          fetchMySessions(),
          fetchSubscription(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "profile.cancelError"
            )
        );

        console.error(
          error
        );
      }
    };

  const leaveSession =
    async (
      sessionId
    ) => {
      const confirmed =
        window.confirm(
          t(
            "profile.leaveConfirm"
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(
          `/sessions/${sessionId}/leave`
        );

        setMessage(
          t(
            "profile.leaveSuccess"
          )
        );

        await fetchMySessions();

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "profile.leaveError"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * Chargement initial.
   *
   * On fait les appels réseau directement
   * dans la tâche asynchrone du useEffect.
   *
   * Les setState arrivent après les await.
   */
  useEffect(() => {
    let cancelled =
      false;

    let timer =
      null;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const checkout =
      params.get(
        "checkout"
      );

    if (checkout) {
      window.history
        .replaceState(
          {},
          "",
          window.location.pathname
        );
    }

    void (async () => {
      try {
        const [
          sessionsResponse,
          subscriptionResponse,
        ] =
          await Promise.all([
            api.get(
              "/sessions/my"
            ),

            api.get(
              "/subscriptions/me"
            ),
          ]);

        if (cancelled) {
          return;
        }

        setMySessions({
          created:
            sessionsResponse
              .data.created ||
            [],

          joined:
            sessionsResponse
              .data.joined ||
            [],
        });

        setSubscription(
          subscriptionResponse.data
        );

        if (
          checkout ===
          "success"
        ) {
          setMessage(
            t(
              "subscription.checkoutProcessing"
            )
          );

          timer =
            window.setTimeout(
              async () => {
                try {
                  const response =
                    await api.get(
                      "/subscriptions/me"
                    );

                  if (
                    cancelled
                  ) {
                    return;
                  }

                  setSubscription(
                    response.data
                  );

                  setMessage(
                    t(
                      "subscription.checkoutUpdated"
                    )
                  );

                } catch (error) {
                  if (
                    cancelled
                  ) {
                    return;
                  }

                  setMessage(
                    error.response
                      ?.data
                      ?.message ||
                    t(
                      "subscription.loadError"
                    )
                  );

                  console.error(
                    error
                  );
                }
              },

              2000
            );
        }

        if (
          checkout ===
          "cancelled"
        ) {
          setMessage(
            t(
              "subscription.checkoutCancelled"
            )
          );
        }

      } catch (error) {
        if (cancelled) {
          return;
        }

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "profile.sessionsLoadError"
            )
        );

        console.error(
          error
        );

      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );

          setSubscriptionLoading(
            false
          );
        }
      }
    })();

    return () => {
      cancelled =
        true;

      if (timer) {
        window.clearTimeout(
          timer
        );
      }
    };

  }, [t]);

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
    subscription
      .activeCreatedSessions >=
    subscription
      .maxActiveSessions;

  return (
    <main className="content">

      <section className="hero-section">

        <p className="eyebrow">
          {t(
            "profile.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "profile.title"
          )}
        </h2>

        <p>
          {t(
            "profile.description"
          )}
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
            {t(
              "profile.role"
            )}
            : {role}
          </p>

          {subscription.premium && (

            <p
              style={{
                fontWeight:
                  700,
              }}
            >
              {t(
                "profile.premiumMember"
              )}
            </p>
          )}

        </div>

        <button
          className="logout-btn"
          onClick={
            onLogout
          }
        >
          {t(
            "nav.logout"
          )}
        </button>

      </section>

      <section className="hero-section">

        <p className="eyebrow">
          {t(
            "subscription.eyebrow"
          )}
        </p>

        <h2>
          {subscription.premium
            ? t(
                "subscription.premiumName"
              )
            : t(
                "subscription.standardName"
              )}
        </h2>

        <p>
          {subscription.premium
            ? t(
                "subscription.premiumDescription"
              )
            : t(
                "subscription.standardDescription"
              )}
        </p>

      </section>

      {subscriptionLoading ? (

        <section className="session-card">

          <h3>
            {t(
              "common.loading"
            )}
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
                ? `${premiumPrice} € / ${t(
                    "subscription.month"
                  )}`
                : t(
                    "subscription.free"
                  )}

            </span>

          </div>

          <h3>
            {subscription.premium
              ? t(
                  "subscription.premiumName"
                )
              : t(
                  "subscription.standardName"
                )}
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

              {t(
                "subscription.activeSessions",
                {
                  current:
                    subscription
                      .activeCreatedSessions,

                  max:
                    subscription
                      .maxActiveSessions,
                }
              )}

            </span>

            <span>

              {t(
                "subscription.capacity",
                {
                  count:
                    subscription
                      .maxCapacity,
                }
              )}

            </span>

            <span>

              {t(
                "subscription.filters",
                {
                  value:
                    subscription
                      .advancedFilters
                      ? t(
                          "common.yes"
                        )
                      : t(
                          "common.no"
                        ),
                }
              )}

            </span>

            <span>

              {t(
                "subscription.highlight",
                {
                  value:
                    subscription
                      .highlightedSessions
                      ? t(
                          "common.yes"
                        )
                      : t(
                          "common.no"
                        ),
                }
              )}

            </span>

            {subscription
              .currentPeriodEnd && (

              <span>

                {t(
                  "subscription.periodEnd",
                  {
                    date:
                      formatDate(
                        subscription
                          .currentPeriodEnd,
                        locale
                      ),
                  }
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
                ? t(
                    "subscription.premiumLimit",
                    {
                      max:
                        subscription
                          .maxActiveSessions,
                    }
                  )
                : t(
                    "subscription.standardLimit"
                  )}

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
                {t(
                  "subscription.offer"
                )}
              </h4>

              <p className="description">
                {t(
                  "subscription.offerDescription"
                )}
              </p>

              <button
                className="primary-btn"
                onClick={
                  startPremiumCheckout
                }
              >
                {t(
                  "subscription.upgrade"
                )}
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
              {t(
                "subscription.cancel"
              )}
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
              {t(
                "subscription.cancelScheduled"
              )}
            </div>
          )}

        </section>
      )}

      <section className="hero-section">

        <p className="eyebrow">
          {t(
            "profile.sessionsEyebrow"
          )}
        </p>

        <h2>
          {t(
            "profile.sessionsTitle"
          )}
        </h2>

        <p>
          {t(
            "profile.sessionsDescription"
          )}
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
          {t(
            "profile.created"
          )}{" "}
          (
          {
            mySessions
              .created
              .length
          }
          )
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
          {t(
            "profile.joined"
          )}{" "}
          (
          {
            mySessions
              .joined
              .length
          }
          )
        </button>

      </div>

      {loading ? (

        <section className="session-card">

          <h3>
            {t(
              "common.loading"
            )}
          </h3>

          <p className="description">
            {t(
              "common.loading"
            )}
          </p>

        </section>

      ) : displayedSessions.length ===
        0 ? (

        <section className="session-card">

          <h3>
            {t(
              "sessions.none"
            )}
          </h3>

          <p className="description">

            {activeTab ===
            "created"
              ? t(
                  "profile.noCreated"
                )
              : t(
                  "profile.noJoined"
                )}

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

                    {t(
                      `status.${session.status}`
                    )}

                  </span>

                  {session
                    .premiumHighlighted && (

                    <span className="capacity">

                      {t(
                        "sessions.premium"
                      )}

                    </span>
                  )}

                </div>

                <h3>
                  {
                    session.title
                  }
                </h3>

                <p className="activity">

                  {activityLabel(
                    session.activityType,
                    t
                  )}

                </p>

                <p className="description">

                  {session.description ||
                    t(
                      "sessions.noDescription"
                    )}

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
                      session.startAt,
                      locale
                    )}
                  </span>

                  <span>
                    ⏱️{" "}
                    {
                      session.durationMin
                    }{" "}
                    {t(
                      "common.minutes"
                    )}
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
                    {t(
                      "profile.cancelSession"
                    )}
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
                    {t(
                      "profile.leaveSession"
                    )}
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
                    {t(
                      "profile.completed"
                    )}
                  </button>
                )}

                {session.status ===
                  "CANCELLED" && (

                  <button
                    className="secondary-btn"
                    disabled
                  >
                    {t(
                      "profile.cancelled"
                    )}
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
  value,
  locale
) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleString(
    locale,
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

function activityLabel(
  activity,
  t
) {
  const key =
    `activity.${activity}`;

  const translated =
    t(key);

  return translated === key
    ? activity
    : translated;
}