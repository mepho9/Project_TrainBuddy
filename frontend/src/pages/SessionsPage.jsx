import {
  useEffect,
  useState,
} from "react";

import api from "../api/axios";
import ReportPanel from "../components/ReportPanel";

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
  const [sessions, setSessions] =
    useState([]);

  const [gyms, setGyms] =
    useState([]);

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

  const [messages, setMessages] =
    useState([]);

  const [chatText, setChatText] =
    useState("");

  const [message, setMessage] =
    useState("");

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

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

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
            "Impossible de charger les sessions."
        );

        console.error(err);
      } finally {
        setSearchLoading(
          false
        );
      }
    };

  const fetchGyms =
    async () => {
      try {
        const res =
          await api.get(
            "/gyms"
          );

        setGyms(
          res.data
        );

        if (
          res.data.length >
          0
        ) {
          setNewSession(
            (prev) => ({
              ...prev,

              gymId:
                prev.gymId ||
                res.data[0].id,
            })
          );
        }
      } catch (err) {
        setMessage(
          "Impossible de charger les salles."
        );

        console.error(err);
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
      setMyParticipantCreator(false);
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
            "Impossible de charger les détails."
        );

        console.error(err);
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
          "Session rejointe avec succès !"
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
            "Vous êtes déjà inscrit à cette session."
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
            "Erreur lors de l'inscription."
        );

        console.error(err);
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
            "Impossible d’envoyer le message."
        );

        console.error(err);
      }
    };

  const createSession =
    async (event) => {
      event.preventDefault();

      /*
       * Blocage UX.
       *
       * Le backend vérifie toujours lui-même
       * la limite : ceci n'est qu'un confort
       * supplémentaire pour le membre.
       */
      if (sessionLimitReached) {
        setMessage(
          subscription.premium
            ? `Vous avez déjà atteint la limite Premium de ${maxActiveSessions} sessions actives.`
            : "Vous avez déjà atteint votre limite Standard de 2 sessions actives. Passez Premium pour en créer jusqu'à 10."
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
          "Session créée avec succès !"
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

          capacity: Math.min(
            4,
            subscription.maxCapacity ||
              5
          ),

          visibility:
            "PUBLIC",
        });

        /*
         * Très important :
         * après création, on recharge
         * également l'abonnement pour
         * faire évoluer immédiatement :
         *
         * 0/2 → 1/2
         * 1/2 → 2/2
         * 4/10 → 5/10
         */
        await Promise.all([
          fetchSessions(),
          fetchSubscription(),
        ]);

      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            "Impossible de créer la session."
        );

        console.error(err);

        /*
         * Si le backend nous a refusé
         * parce que l'état local était
         * légèrement en retard, on
         * resynchronise le compteur.
         */
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
          "La géolocalisation n'est pas disponible dans ce navigateur."
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
              "Impossible de récupérer votre position. La recherche classique reste disponible."
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

  useEffect(() => {
    fetchSubscription();

    fetchSessions(
      DEFAULT_FILTERS,
      null
    );

    fetchGyms();
  }, []);

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
            ← Retour aux sessions
          </button>

          {message && (
            <div className="page-message">
              {message}
            </div>
          )}

          <section className="session-detail">

            <div className="session-card-header">

              <span className="badge">
                {
                  selectedSession.status
                }
              </span>

              {selectedSession
                .premiumHighlighted && (

                <span className="capacity">
                  ⭐ SESSION PREMIUM
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
                "Aucune description disponible."}
            </p>

            <div className="session-detail-info">

              <span>
                🏋️ Activité :{" "}
                {
                  selectedSession.activityType
                }
              </span>

              <span>
                📍 Salle :{" "}
                {
                  selectedSession.gymName
                }
              </span>

              {selectedSession
                .distanceKm !=
                null && (

                <span>
                  🧭 Distance :{" "}
                  {formatDistance(
                    selectedSession
                      .distanceKm
                  )}
                </span>
              )}

              <span>
                🕒 Date :{" "}
                {formatDate(
                  selectedSession
                    .startAt
                )}
              </span>

              <span>
                ⏱️ Durée :{" "}
                {
                  selectedSession.durationMin
                }{" "}
                min
              </span>

              <span>
                👥 Participants :{" "}
                {
                  selectedSession
                    .participantCount ??
                  participants.length
                }{" "}
                /{" "}
                {
                  selectedSession.capacity
                }
              </span>

              <span>
                🔒 Visibilité :{" "}
                {
                  selectedSession.visibility
                }
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
                    ? "Session complète"
                    : "Rejoindre la session"}
                </button>
              )}

              {isParticipant && (

                <button
                  className="success-btn"
                  disabled
                >
                  Session rejointe
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
                        `la session "${selectedSession.title}"`,
                    })
                  }
                >
                  Signaler cette session
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
                "Signalement envoyé."
              );
            }}
          />

          <section className="session-detail-layout">

            <div className="participants-panel">

              <h3>
                Participants anonymes
              </h3>

              {participants.length ===
              0 ? (

                <p className="empty-text">
                  Aucun participant.
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
                              participant.anonymousName
                            }
                          </strong>

                          <p>
                            Code :{" "}
                            {
                              participant.recognitionCode
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
                              ? "Créateur"
                              : "Membre"}
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
                                    participant.anonymousName,
                                })
                              }
                            >
                              Signaler
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
                    Chat anonyme
                  </h3>

                  <span>
                    {
                      messages.length
                    }{" "}
                    message(s)
                  </span>

                </div>

                <div className="chat-messages">

                  {messages.length ===
                  0 ? (

                    <p className="empty-text">
                      Aucun message.
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
                              msg.sentAt
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
                    placeholder="Écrire un message anonyme..."
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
                    Envoyer
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
            Sessions proches
          </p>

          <h2>
            Trouvez votre prochain partenaire d’entraînement
          </h2>

          <p>
            Recherchez une séance par
            activité, salle ou date.
          </p>

          {subscription.premium ? (

            <p>
              ⭐ Premium actif :
              rayon jusqu'à 200 km,
              recherche avancée avec
              <strong> -mot</strong> et
              sessions mises en avant.
            </p>

          ) : (

            <p>
              Formule Standard :
              rayon maximal 25 km.
              Les filtres avancés sont
              disponibles avec Premium.
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
              Recherche
            </label>

            <input
              type="text"
              placeholder={
                subscription.premium
                  ? "Ex: musculation -cardio"
                  : "Ex: musculation Basic-Fit"
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
                Activité
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
                  Toutes
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
                      {activity}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                Salle
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
                  Toutes les salles
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
                Date
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
                Rayon
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

            Afficher uniquement les
            sessions avec des places
            disponibles

          </label>

          <div className="card-actions">

            <button
              className="primary-btn"
              type="submit"
            >
              {searchLoading
                ? "Recherche..."
                : "Rechercher"}
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
                ? "Localisation..."
                : userLocation
                ? "📍 Position activée"
                : "📍 Utiliser ma position"}
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={
                resetSearch
              }
            >
              Réinitialiser
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
              ? "Fermer le formulaire"
              : "Créer une session"}
          </button>

        </div>

        {showCreateForm && (

          <form
            className="create-session-form"
            onSubmit={
              createSession
            }
          >

            {/*
             * Nouveau compteur permanent.
             */}
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
                  ? "⭐ PREMIUM"
                  : "STANDARD"}
                {" — "}
                {
                  activeCreatedSessions
                }
                {" / "}
                {
                  maxActiveSessions
                }
                {" sessions actives créées"}
              </div>

              <div
                style={{
                  marginTop:
                    "6px",

                  fontWeight:
                    600,
                }}
              >
                Capacité maximale :{" "}
                {
                  subscription.maxCapacity
                }{" "}
                participants par session
              </div>

              {sessionLimitReached && (

                <div
                  style={{
                    marginTop:
                      "10px",
                  }}
                >
                  {subscription.premium
                    ? `Limite Premium atteinte. Vous devez attendre la fin d'une session ou en annuler une avant d'en créer une nouvelle.`
                    : "Limite Standard atteinte. Premium permet jusqu'à 10 sessions actives simultanément."}
                </div>
              )}

            </div>

            <div className="form-row">

              <label>
                Salle de sport
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
                Titre
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
                Activité
              </label>

              <select
                value={
                  newSession.activityType
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
                      {
                        activity
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                Description
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
                  Date et heure
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
                  Durée
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
                  Capacité
                </label>

                <input
                  type="number"
                  min="2"
                  max={
                    subscription.maxCapacity ||
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
                  Visibilité
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
                    PUBLIC
                  </option>

                  <option value="PRIVATE">
                    PRIVATE
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
                ? `Limite atteinte (${activeCreatedSessions}/${maxActiveSessions})`
                : "Enregistrer la session"}
            </button>

          </form>
        )}

        <p className="empty-text">
          {sessions.length} session(s) trouvée(s)
        </p>

        {sessions.length ===
        0 ? (

          <section className="session-card">

            <h3>
              Aucune session trouvée
            </h3>

            <p className="description">
              Modifiez vos filtres.
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
                      {
                        session.status
                      }
                    </span>

                    {session
                      .premiumHighlighted ? (

                      <span className="capacity">
                        ⭐ PREMIUM
                      </span>

                    ) : (

                      <span className="capacity">
                        {
                          session.availablePlaces
                        }{" "}
                        place(s) libre(s)
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

                    {session.distanceKm !=
                      null && (

                      <span>
                        🧭{" "}
                        {formatDistance(
                          session
                            .distanceKm
                        )}
                      </span>
                    )}

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

                  <button
                    className="secondary-btn"
                    onClick={() =>
                      openSession(
                        session
                      )
                    }
                  >
                    Voir détails
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

function formatDistance(
  distanceKm
) {
  if (
    distanceKm == null
  ) {
    return "Distance inconnue";
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