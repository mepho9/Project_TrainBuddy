import {
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

import ReportPanel
  from "../components/ReportPanel";

import { useLanguage }
  from "../i18n/LanguageContext";

const DEFAULT_FILTERS = {
  q: "",
  gymId: "",
  activityType: "",
  date: "",
  availableOnly: false,
  radiusKm: "10",
};

const STANDARD_SUBSCRIPTION = {
  premium: false,
  maxCapacity: 5,
  maxActiveSessions: 2,
  activeCreatedSessions: 0,
  advancedFilters: false,
  highlightedSessions: false,
};

const ACTIVITIES = [
  "Musculation",
  "Cardio",
  "Crossfit",
  "Fitness",
  "HIIT",
  "Mobilité",
];

export default function SessionsPage() {
  const {
    t,
    locale,
  } = useLanguage();

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    gyms,
    setGyms,
  ] = useState([]);

  const [
    subscription,
    setSubscription,
  ] = useState(
    STANDARD_SUBSCRIPTION
  );

  const [
    selectedSession,
    setSelectedSession,
  ] = useState(null);

  const [
    participants,
    setParticipants,
  ] = useState([]);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    chatText,
    setChatText,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [
    isParticipant,
    setIsParticipant,
  ] = useState(false);

  const [
    myParticipantId,
    setMyParticipantId,
  ] = useState(null);

  const [
    myParticipantCreator,
    setMyParticipantCreator,
  ] = useState(false);

  const [
    reportTarget,
    setReportTarget,
  ] = useState(null);

  const [
    filters,
    setFilters,
  ] = useState(
    DEFAULT_FILTERS
  );

  const [
    userLocation,
    setUserLocation,
  ] = useState(null);

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);

  const [
    newSession,
    setNewSession,
  ] = useState({
    gymId: "",
    title: "",
    activityType:
      "Musculation",
    description: "",
    startAt: "",
    durationMin: 60,
    capacity: 4,
    visibility: "PUBLIC",
  });

  const activeCreatedSessions =
    Number(
      subscription
        .activeCreatedSessions ??
        0
    );

  const maxActiveSessions =
    Number(
      subscription
        .maxActiveSessions ??
        2
    );

  const sessionLimitReached =
    activeCreatedSessions >=
    maxActiveSessions;

  const fetchSubscription =
    async () => {
      try {
        const response =
          await api.get(
            "/subscriptions/me"
          );

        setSubscription(
          response.data
        );

      } catch (error) {
        console.error(
          error
        );
      }
    };

  const fetchSessions =
    async (
      filtersToUse = filters,
      locationToUse = userLocation
    ) => {
      setSearchLoading(
        true
      );

      try {
        const params = {};

        if (
          filtersToUse.q.trim()
        ) {
          params.q =
            filtersToUse.q.trim();
        }

        if (
          filtersToUse.gymId
        ) {
          params.gymId =
            filtersToUse.gymId;
        }

        if (
          filtersToUse.activityType
        ) {
          params.activityType =
            filtersToUse.activityType;
        }

        if (
          filtersToUse.date
        ) {
          params.date =
            filtersToUse.date;
        }

        if (
          filtersToUse.availableOnly
        ) {
          params.availableOnly =
            true;
        }

        if (locationToUse) {
          params.latitude =
            locationToUse.latitude;

          params.longitude =
            locationToUse.longitude;

          params.radiusKm =
            Number(
              filtersToUse.radiusKm
            );

          params.sortByDistance =
            true;
        }

        const res =
          await api.get(
            "/sessions",
            {
              params,
            }
          );

        setSessions(
          res.data
        );

      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            t(
              "sessions.loadError"
            )
        );

        console.error(
          err
        );

      } finally {
        setSearchLoading(
          false
        );
      }
    };

  const fetchParticipants =
    async (id) => {
      const res =
        await api.get(
          `/sessions/${id}/participants`
        );

      setParticipants(
        res.data
      );
    };

  const fetchMessages =
    async (id) => {
      const res =
        await api.get(
          `/sessions/${id}/messages`
        );

      setMessages(
        res.data
      );
    };

  const fetchMembership =
    async (id) => {
      const res =
        await api.get(
          `/sessions/${id}/membership`
        );

      const participating =
        res.data.participating;

      setIsParticipant(
        participating
      );

      setMyParticipantId(
        res.data.participant
          ?.id ?? null
      );

      setMyParticipantCreator(
        res.data.participant
          ?.creator ?? false
      );

      return participating;
    };

  const openSession =
    async (session) => {
      setSelectedSession(
        session
      );

      setMessage("");
      setMessages([]);
      setParticipants([]);
      setIsParticipant(false);
      setMyParticipantId(null);
      setMyParticipantCreator(
        false
      );
      setReportTarget(null);

      try {
        const [
          ,
          participating,
        ] =
          await Promise.all([
            fetchParticipants(
              session.id
            ),

            fetchMembership(
              session.id
            ),
          ]);

        if (participating) {
          await fetchMessages(
            session.id
          );
        }

      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            t(
              "sessions.detailError"
            )
        );

        console.error(
          err
        );
      }
    };

  const joinSession =
    async () => {
      if (!selectedSession) {
        return;
      }

      try {
        const response =
          await api.post(
            `/sessions/${selectedSession.id}/join`
          );

        setIsParticipant(
          true
        );

        setMyParticipantId(
          response.data.id
        );

        setMyParticipantCreator(
          Boolean(
            response.data.creator
          )
        );

        setMessage(
          t(
            "sessions.joinSuccess"
          )
        );

        const currentCount =
          selectedSession
            .participantCount ??
          participants.length;

        const updatedCount =
          currentCount + 1;

        setSelectedSession(
          (prev) =>
            prev
              ? {
                  ...prev,

                  participantCount:
                    updatedCount,

                  availablePlaces:
                    Math.max(
                      prev.capacity -
                        updatedCount,
                      0
                    ),
                }
              : prev
        );

        await Promise.all([
          fetchParticipants(
            selectedSession.id
          ),

          fetchMessages(
            selectedSession.id
          ),
        ]);

      } catch (err) {
        if (
          err.response?.status ===
          409
        ) {
          const participating =
            await fetchMembership(
              selectedSession.id
            );

          setMessage(
            t(
              "sessions.alreadyJoined"
            )
          );

          if (participating) {
            await Promise.all([
              fetchParticipants(
                selectedSession.id
              ),

              fetchMessages(
                selectedSession.id
              ),
            ]);
          }

          return;
        }

        setMessage(
          err.response?.data
            ?.message ||
            t(
              "sessions.joinError"
            )
        );

        console.error(
          err
        );
      }
    };

  const sendMessage =
    async (event) => {
      event.preventDefault();

      if (
        !selectedSession ||
        !chatText.trim()
      ) {
        return;
      }

      try {
        await api.post(
          `/sessions/${selectedSession.id}/messages`,
          {
            message:
              chatText.trim(),
          }
        );

        setChatText("");

        await fetchMessages(
          selectedSession.id
        );

      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            t(
              "chat.sendError"
            )
        );

        console.error(
          err
        );
      }
    };

  const createSession =
    async (event) => {
      event.preventDefault();

      if (
        sessionLimitReached
      ) {
        setMessage(
          subscription.premium
            ? t(
                "subscription.premiumLimit",
                {
                  max:
                    maxActiveSessions,
                }
              )
            : t(
                "subscription.standardLimit"
              )
        );

        return;
      }

      try {
        await api.post(
          "/sessions",
          {
            ...newSession,

            durationMin:
              Number(
                newSession
                  .durationMin
              ),

            capacity:
              Number(
                newSession.capacity
              ),
          }
        );

        setMessage(
          t(
            "sessions.created"
          )
        );

        setShowCreateForm(
          false
        );

        setNewSession({
          gymId:
            gyms[0]?.id ||
            "",

          title: "",

          activityType:
            "Musculation",

          description: "",

          startAt: "",

          durationMin: 60,

          capacity:
            Math.min(
              4,
              subscription
                .maxCapacity ||
                5
            ),

          visibility:
            "PUBLIC",
        });

        await Promise.all([
          fetchSessions(),
          fetchSubscription(),
        ]);

      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            t(
              "sessions.createError"
            )
        );

        console.error(
          err
        );

        await fetchSubscription();
      }
    };

  const searchSessions =
    async (event) => {
      event.preventDefault();

      setMessage("");

      await fetchSessions();
    };

  const resetSearch =
    async () => {
      const resetFilters = {
        ...DEFAULT_FILTERS,
      };

      setFilters(
        resetFilters
      );

      setUserLocation(
        null
      );

      setMessage("");

      await fetchSessions(
        resetFilters,
        null
      );
    };

  const useMyLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setMessage(
          t(
            "sessions.locationUnavailable"
          )
        );

        return;
      }

      setLocationLoading(
        true
      );

      setMessage("");

      navigator.geolocation
        .getCurrentPosition(
          async (
            position
          ) => {
            const location = {
              latitude:
                position.coords
                  .latitude,

              longitude:
                position.coords
                  .longitude,
            };

            setUserLocation(
              location
            );

            setLocationLoading(
              false
            );

            await fetchSessions(
              filters,
              location
            );
          },

          () => {
            setLocationLoading(
              false
            );

            setUserLocation(
              null
            );

            setMessage(
              t(
                "sessions.locationError"
              )
            );
          },

          {
            enableHighAccuracy:
              false,

            timeout:
              10000,

            maximumAge:
              300000,
          }
        );
    };

  /*
   * Chargement initial.
   *
   * Pas d'appel à une fonction qui déclenche
   * immédiatement setState depuis le useEffect.
   */
  useEffect(() => {
    let cancelled =
      false;

    void (async () => {
      try {
        const [
          subscriptionResponse,
          sessionsResponse,
          gymsResponse,
        ] =
          await Promise.all([
            api.get(
              "/subscriptions/me"
            ),

            api.get(
              "/sessions"
            ),

            api.get(
              "/gyms"
            ),
          ]);

        if (cancelled) {
          return;
        }

        setSubscription(
          subscriptionResponse
            .data
        );

        setSessions(
          sessionsResponse
            .data
        );

        setGyms(
          gymsResponse.data
        );

        if (
          gymsResponse.data
            .length > 0
        ) {
          setNewSession(
            (prev) => ({
              ...prev,

              gymId:
                prev.gymId ||
                gymsResponse
                  .data[0].id,
            })
          );
        }

      } catch (err) {
        if (cancelled) {
          return;
        }

        setMessage(
          err.response?.data
            ?.message ||
            t(
              "sessions.loadError"
            )
        );

        console.error(
          err
        );
      }
    })();

    return () => {
      cancelled =
        true;
    };

  }, [t]);

  if (selectedSession) {
    return (
      <div className="app-page">
        <main className="content">

          <button
            className="back-btn"
            onClick={() => {
              setSelectedSession(
                null
              );

              setParticipants(
                []
              );

              setMessages([]);

              setIsParticipant(
                false
              );

              setMyParticipantId(
                null
              );

              setMyParticipantCreator(
                false
              );

              setReportTarget(
                null
              );

              setMessage("");
            }}
          >
            {t(
              "sessions.back"
            )}
          </button>

          {message && (
            <div className="page-message">
              {message}
            </div>
          )}

          <section className="session-detail">

            <div className="session-card-header">

              <span className="badge">
                {t(
                  `status.${selectedSession.status}`
                )}
              </span>

              {selectedSession
                .premiumHighlighted && (

                <span className="capacity">
                  {t(
                    "sessions.premium"
                  )}
                </span>
              )}

            </div>

            <h2>
              {
                selectedSession.title
              }
            </h2>

            <p>
              {selectedSession.description ||
                t(
                  "sessions.noDescription"
                )}
            </p>

            <div className="session-detail-info">

              <span>
                🏋️{" "}
                {t(
                  "sessions.activity"
                )}
                :{" "}
                {activityLabel(
                  selectedSession
                    .activityType,
                  t
                )}
              </span>

              <span>
                📍{" "}
                {t(
                  "sessions.gym"
                )}
                :{" "}
                {
                  selectedSession.gymName
                }
              </span>

              {selectedSession
                .distanceKm !=
                null && (

                <span>
                  🧭{" "}
                  {t(
                    "sessions.distance"
                  )}
                  :{" "}
                  {formatDistance(
                    selectedSession
                      .distanceKm,
                    t
                  )}
                </span>
              )}

              <span>
                🕒{" "}
                {t(
                  "sessions.date"
                )}
                :{" "}
                {formatDate(
                  selectedSession
                    .startAt,
                  locale
                )}
              </span>

              <span>
                ⏱️{" "}
                {t(
                  "sessions.duration"
                )}
                :{" "}
                {
                  selectedSession
                    .durationMin
                }{" "}
                {t(
                  "common.minutes"
                )}
              </span>

              <span>
                👥{" "}
                {t(
                  "sessions.participants"
                )}
                :{" "}
                {
                  selectedSession
                    .participantCount ??
                  participants.length
                }{" "}
                /{" "}
                {
                  selectedSession
                    .capacity
                }
              </span>

              <span>
                🔒{" "}
                {t(
                  "sessions.visibility"
                )}
                :{" "}
                {selectedSession
                  .visibility ===
                "PUBLIC"
                  ? t(
                      "sessions.public"
                    )
                  : t(
                      "sessions.private"
                    )}
              </span>

            </div>

            <div className="card-actions">

              {!isParticipant && (

                <button
                  className="primary-btn"
                  onClick={
                    joinSession
                  }
                  disabled={
                    (
                      selectedSession
                        .availablePlaces ??
                      1
                    ) <= 0
                  }
                >
                  {(
                    selectedSession
                      .availablePlaces ??
                    1
                  ) <= 0
                    ? t(
                        "sessions.full"
                      )
                    : t(
                        "sessions.join"
                      )}
                </button>
              )}

              {isParticipant && (

                <button
                  className="success-btn"
                  disabled
                >
                  {t(
                    "sessions.joined"
                  )}
                </button>
              )}

              {!myParticipantCreator && (

                <button
                  className="secondary-btn"
                  style={{
                    color:
                      "#dc2626",

                    background:
                      "#fef2f2",
                  }}
                  onClick={() =>
                    setReportTarget({
                      type:
                        "SESSION",

                      id:
                        selectedSession.id,

                      label:
                        `"${selectedSession.title}"`,
                    })
                  }
                >
                  {t(
                    "sessions.reportSession"
                  )}
                </button>
              )}

            </div>

          </section>

          <ReportPanel
            target={
              reportTarget
            }
            onCancel={() =>
              setReportTarget(
                null
              )
            }
            onSuccess={() => {
              setReportTarget(
                null
              );

              setMessage(
                t(
                  "report.success"
                )
              );
            }}
          />

          <section className="session-detail-layout">

            <div className="participants-panel">

              <h3>
                {t(
                  "sessions.anonymousParticipants"
                )}
              </h3>

              {participants.length ===
              0 ? (

                <p className="empty-text">
                  {t(
                    "sessions.noParticipants"
                  )}
                </p>

              ) : (

                <div className="participants-list">

                  {participants.map(
                    (
                      participant
                    ) => (

                      <div
                        className="participant-item"
                        key={
                          participant.id
                        }
                      >

                        <div>

                          <strong>
                            {
                              participant
                                .anonymousName
                            }
                          </strong>

                          <p>
                            {t(
                              "sessions.code"
                            )}
                            :{" "}
                            {
                              participant
                                .recognitionCode
                            }
                          </p>

                        </div>

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "8px",
                          }}
                        >

                          <span>
                            {participant.creator
                              ? t(
                                  "common.creator"
                                )
                              : t(
                                  "common.member"
                                )}
                          </span>

                          {isParticipant &&
                            participant.id !==
                              myParticipantId && (

                            <button
                              className="secondary-btn"
                              style={{
                                padding:
                                  "7px 10px",

                                color:
                                  "#dc2626",

                                background:
                                  "#fef2f2",
                              }}
                              onClick={() =>
                                setReportTarget({
                                  type:
                                    "PARTICIPANT",

                                  id:
                                    participant.id,

                                  label:
                                    participant
                                      .anonymousName,
                                })
                              }
                            >
                              {t(
                                "sessions.report"
                              )}
                            </button>
                          )}

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {isParticipant && (

              <div className="chat-panel">

                <div className="chat-header">

                  <h3>
                    {t(
                      "chat.title"
                    )}
                  </h3>

                  <span>
                    {t(
                      "chat.messageCount",
                      {
                        count:
                          messages.length,
                      }
                    )}
                  </span>

                </div>

                <div className="chat-messages">

                  {messages.length ===
                  0 ? (

                    <p className="empty-text">
                      {t(
                        "chat.none"
                      )}
                    </p>

                  ) : (

                    messages.map(
                      (msg) => (

                        <div
                          className="chat-message"
                          key={
                            msg.id
                          }
                        >

                          <div className="chat-author">
                            {
                              msg.anonymousAuthor
                            }
                          </div>

                          <p>
                            {
                              msg.message
                            }
                          </p>

                          <span>
                            {formatDate(
                              msg.sentAt,
                              locale
                            )}
                          </span>

                        </div>
                      )
                    )
                  )}

                </div>

                <form
                  className="chat-form"
                  onSubmit={
                    sendMessage
                  }
                >

                  <input
                    type="text"
                    placeholder={t(
                      "chat.placeholder"
                    )}
                    value={
                      chatText
                    }
                    onChange={(
                      event
                    ) =>
                      setChatText(
                        event.target
                          .value
                      )
                    }
                  />

                  <button
                    type="submit"
                  >
                    {t(
                      "chat.send"
                    )}
                  </button>

                </form>

              </div>
            )}

          </section>

        </main>
      </div>
    );
  }

  const radiusOptions =
    subscription.premium
      ? [
          5,
          10,
          25,
          50,
          100,
          200,
        ]
      : [
          5,
          10,
          25,
        ];

  return (
    <div className="app-page">
      <main className="content">

        <section className="hero-section">

          <p className="eyebrow">
            {t(
              "sessions.eyebrow"
            )}
          </p>

          <h2>
            {t(
              "sessions.title"
            )}
          </h2>

          <p>
            {t(
              "sessions.description"
            )}
          </p>

          {subscription.premium ? (

            <p>
              {t(
                "sessions.premiumInfo"
              )}
            </p>

          ) : (

            <p>
              {t(
                "sessions.standardInfo"
              )}
            </p>
          )}

        </section>

        {message && (
          <div className="page-message">
            {message}
          </div>
        )}

        <form
          className="create-session-form"
          onSubmit={
            searchSessions
          }
        >

          <div className="form-row">

            <label>
              {t(
                "sessions.searchLabel"
              )}
            </label>

            <input
              type="text"
              placeholder={
                subscription.premium
                  ? t(
                      "sessions.searchPremiumPlaceholder"
                    )
                  : t(
                      "sessions.searchStandardPlaceholder"
                    )
              }
              value={
                filters.q
              }
              onChange={(event) =>
                setFilters({
                  ...filters,

                  q:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-grid">

            <div className="form-row">

              <label>
                {t(
                  "sessions.activity"
                )}
              </label>

              <select
                value={
                  filters.activityType
                }
                onChange={(event) =>
                  setFilters({
                    ...filters,

                    activityType:
                      event.target
                        .value,
                  })
                }
              >

                <option value="">
                  {t(
                    "sessions.allActivities"
                  )}
                </option>

                {ACTIVITIES.map(
                  (
                    activity
                  ) => (

                    <option
                      key={
                        activity
                      }
                      value={
                        activity
                      }
                    >
                      {activityLabel(
                        activity,
                        t
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.gym"
                )}
              </label>

              <select
                value={
                  filters.gymId
                }
                onChange={(event) =>
                  setFilters({
                    ...filters,

                    gymId:
                      event.target
                        .value,
                  })
                }
              >

                <option value="">
                  {t(
                    "sessions.allGyms"
                  )}
                </option>

                {gyms.map(
                  (gym) => (

                    <option
                      key={
                        gym.id
                      }
                      value={
                        gym.id
                      }
                    >
                      {
                        gym.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.date"
                )}
              </label>

              <input
                type="date"
                value={
                  filters.date
                }
                onChange={(event) =>
                  setFilters({
                    ...filters,

                    date:
                      event.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.radius"
                )}

                {subscription.premium &&
                  " ⭐"}
              </label>

              <select
                value={
                  filters.radiusKm
                }
                disabled={
                  !userLocation
                }
                onChange={(event) =>
                  setFilters({
                    ...filters,

                    radiusKm:
                      event.target
                        .value,
                  })
                }
              >

                {radiusOptions.map(
                  (
                    radius
                  ) => (

                    <option
                      key={
                        radius
                      }
                      value={
                        radius
                      }
                    >
                      {radius} km
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <label
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "10px",

              color:
                "#334155",

              fontWeight:
                700,
            }}
          >

            <input
              type="checkbox"
              checked={
                filters.availableOnly
              }
              onChange={(event) =>
                setFilters({
                  ...filters,

                  availableOnly:
                    event.target
                      .checked,
                })
              }
              style={{
                width:
                  "auto",
              }}
            />

            {t(
              "sessions.availableOnly"
            )}

          </label>

          <div className="card-actions">

            <button
              className="primary-btn"
              type="submit"
            >
              {searchLoading
                ? t(
                    "sessions.searchLoading"
                  )
                : t(
                    "common.search"
                  )}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={
                useMyLocation
              }
              disabled={
                locationLoading
              }
            >
              {locationLoading
                ? t(
                    "sessions.locationLoading"
                  )
                : userLocation
                ? t(
                    "sessions.locationActive"
                  )
                : t(
                    "sessions.location"
                  )}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={
                resetSearch
              }
            >
              {t(
                "common.reset"
              )}
            </button>

          </div>

        </form>

        <div className="create-session-actions">

          <button
            className="primary-btn"
            onClick={() =>
              setShowCreateForm(
                !showCreateForm
              )
            }
          >
            {showCreateForm
              ? t(
                  "sessions.closeForm"
                )
              : t(
                  "sessions.create"
                )}
          </button>

        </div>

        {showCreateForm && (

          <form
            className="create-session-form"
            onSubmit={
              createSession
            }
          >

            <div
              style={{
                padding:
                  "18px 20px",

                borderRadius:
                  "14px",

                border:
                  sessionLimitReached
                    ? "1px solid #fdba74"
                    : "1px solid #bfdbfe",

                background:
                  sessionLimitReached
                    ? "#fff7ed"
                    : "#eff6ff",

                color:
                  sessionLimitReached
                    ? "#9a3412"
                    : "#1d4ed8",

                fontWeight:
                  800,

                textAlign:
                  "center",
              }}
            >

              <div>

                {subscription.premium
                  ? t(
                      "sessions.premium"
                    )
                  : t(
                      "sessions.standard"
                    )}

                {" — "}

                {t(
                  "sessions.activeCreated",
                  {
                    current:
                      activeCreatedSessions,

                    max:
                      maxActiveSessions,
                  }
                )}

              </div>

              <div
                style={{
                  marginTop:
                    "6px",

                  fontWeight:
                    600,
                }}
              >

                {t(
                  "sessions.maxCapacity",
                  {
                    count:
                      subscription
                        .maxCapacity,
                  }
                )}

              </div>

              {sessionLimitReached && (

                <div
                  style={{
                    marginTop:
                      "10px",
                  }}
                >
                  {subscription.premium
                    ? t(
                        "sessions.premiumLimit"
                      )
                    : t(
                        "sessions.standardLimit"
                      )}
                </div>
              )}

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.gymLabel"
                )}
              </label>

              <select
                value={
                  newSession.gymId
                }
                onChange={(event) =>
                  setNewSession({
                    ...newSession,

                    gymId:
                      event.target
                        .value,
                  })
                }
              >

                {gyms.map(
                  (gym) => (

                    <option
                      key={
                        gym.id
                      }
                      value={
                        gym.id
                      }
                    >
                      {
                        gym.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.titleLabel"
                )}
              </label>

              <input
                type="text"
                value={
                  newSession.title
                }
                onChange={(event) =>
                  setNewSession({
                    ...newSession,

                    title:
                      event.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.activity"
                )}
              </label>

              <select
                value={
                  newSession
                    .activityType
                }
                onChange={(event) =>
                  setNewSession({
                    ...newSession,

                    activityType:
                      event.target
                        .value,
                  })
                }
              >

                {ACTIVITIES.map(
                  (
                    activity
                  ) => (

                    <option
                      key={
                        activity
                      }
                      value={
                        activity
                      }
                    >
                      {activityLabel(
                        activity,
                        t
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                {t(
                  "sessions.descriptionLabel"
                )}
              </label>

              <textarea
                value={
                  newSession.description
                }
                onChange={(event) =>
                  setNewSession({
                    ...newSession,

                    description:
                      event.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-grid">

              <div className="form-row">

                <label>
                  {t(
                    "sessions.start"
                  )}
                </label>

                <input
                  type="datetime-local"
                  value={
                    newSession.startAt
                  }
                  onChange={(event) =>
                    setNewSession({
                      ...newSession,

                      startAt:
                        event.target
                          .value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <label>
                  {t(
                    "sessions.duration"
                  )}
                </label>

                <input
                  type="number"
                  min="15"
                  max="300"
                  value={
                    newSession.durationMin
                  }
                  onChange={(event) =>
                    setNewSession({
                      ...newSession,

                      durationMin:
                        event.target
                          .value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <label>
                  {t(
                    "sessions.capacity"
                  )}
                </label>

                <input
                  type="number"
                  min="2"
                  max={
                    subscription
                      .maxCapacity ||
                    5
                  }
                  value={
                    newSession.capacity
                  }
                  onChange={(event) =>
                    setNewSession({
                      ...newSession,

                      capacity:
                        event.target
                          .value,
                    })
                  }
                />

              </div>

              <div className="form-row">

                <label>
                  {t(
                    "sessions.visibility"
                  )}
                </label>

                <select
                  value={
                    newSession.visibility
                  }
                  onChange={(event) =>
                    setNewSession({
                      ...newSession,

                      visibility:
                        event.target
                          .value,
                    })
                  }
                >

                  <option value="PUBLIC">
                    {t(
                      "sessions.public"
                    )}
                  </option>

                  <option value="PRIVATE">
                    {t(
                      "sessions.private"
                    )}
                  </option>

                </select>

              </div>

            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={
                sessionLimitReached
              }
              style={
                sessionLimitReached
                  ? {
                      opacity:
                        0.5,

                      cursor:
                        "not-allowed",
                    }
                  : undefined
              }
            >
              {sessionLimitReached
                ? t(
                    "sessions.limitButton",
                    {
                      current:
                        activeCreatedSessions,

                      max:
                        maxActiveSessions,
                    }
                  )
                : t(
                    "sessions.save"
                  )}
            </button>

          </form>
        )}

        <p className="empty-text">
          {t(
            "sessions.found",
            {
              count:
                sessions.length,
            }
          )}
        </p>

        {sessions.length ===
        0 ? (

          <section className="session-card">

            <h3>
              {t(
                "sessions.none"
              )}
            </h3>

            <p className="description">
              {t(
                "sessions.changeFilters"
              )}
            </p>

          </section>

        ) : (

          <section className="sessions-grid">

            {sessions.map(
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
                      .premiumHighlighted ? (

                      <span className="capacity">
                        {t(
                          "sessions.premium"
                        )}
                      </span>

                    ) : (

                      <span className="capacity">
                        {t(
                          "sessions.places",
                          {
                            count:
                              session
                                .availablePlaces,
                          }
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

                    {session.distanceKm !=
                      null && (

                      <span>
                        🧭{" "}
                        {formatDistance(
                          session
                            .distanceKm,
                          t
                        )}
                      </span>
                    )}

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
                        session
                          .participantCount
                      }{" "}
                      /{" "}
                      {
                        session.capacity
                      }
                    </span>

                  </div>

                  <button
                    className="secondary-btn"
                    onClick={() =>
                      openSession(
                        session
                      )
                    }
                  >
                    {t(
                      "sessions.details"
                    )}
                  </button>

                </article>
              )
            )}

          </section>
        )}

      </main>
    </div>
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

function formatDistance(
  distanceKm,
  t
) {
  if (
    distanceKm == null
  ) {
    return t(
      "common.unknown"
    );
  }

  if (
    distanceKm < 1
  ) {
    return `${Math.round(
      distanceKm * 1000
    )} m`;
  }

  return `${distanceKm.toFixed(
    1
  )} km`;
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