import { useEffect, useState } from "react";
import api from "../api/axios";

const DEFAULT_FILTERS = {
  q: "",
  gymId: "",
  activityType: "",
  date: "",
  availableOnly: false,
  radiusKm: "10",
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
  const [sessions, setSessions] = useState([]);
  const [gyms, setGyms] = useState([]);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const [participants, setParticipants] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [chatText, setChatText] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [isParticipant, setIsParticipant] =
    useState(false);

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [userLocation, setUserLocation] =
    useState(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [newSession, setNewSession] =
    useState({
      gymId: "",
      title: "",
      activityType: "Musculation",
      description: "",
      startAt: "",
      durationMin: 60,
      capacity: 4,
      visibility: "PUBLIC",
    });

  const fetchSessions = async (
    filtersToUse = filters,
    locationToUse = userLocation
  ) => {
    setSearchLoading(true);

    try {
      const params = {};

      if (filtersToUse.q.trim()) {
        params.q =
          filtersToUse.q.trim();
      }

      if (filtersToUse.gymId) {
        params.gymId =
          filtersToUse.gymId;
      }

      if (filtersToUse.activityType) {
        params.activityType =
          filtersToUse.activityType;
      }

      if (filtersToUse.date) {
        params.date =
          filtersToUse.date;
      }

      if (filtersToUse.availableOnly) {
        params.availableOnly = true;
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

        params.sortByDistance = true;
      }

      const res =
        await api.get(
          "/sessions",
          {
            params,
          }
        );

      setSessions(res.data);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Impossible de charger les sessions."
      );

      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchGyms = async () => {
    try {
      const res =
        await api.get(
          "/gyms"
        );

      setGyms(res.data);

      if (res.data.length > 0) {
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

      setIsParticipant(
        res.data.participating
      );

      return res.data
        .participating;
    };

  const openSession =
    async (session) => {
      setSelectedSession(
        session
      );

      setMessage("");

      setMessages([]);

      setParticipants([]);

      setIsParticipant(
        false
      );

      try {
        const [, participating] =
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
        await api.post(
          `/sessions/${selectedSession.id}/join`
        );

        setIsParticipant(
          true
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
    async (e) => {
      e.preventDefault();

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
    async (e) => {
      e.preventDefault();

      try {
        await api.post(
          "/sessions",
          {
            ...newSession,

            durationMin:
              Number(
                newSession.durationMin
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

          capacity: 4,

          visibility:
            "PUBLIC",
        });

        await fetchSessions();
      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            "Impossible de créer la session."
        );

        console.error(err);
      }
    };

  const searchSessions =
    async (e) => {
      e.preventDefault();

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

  const useMyLocation = () => {
    if (
      !navigator.geolocation
    ) {
      setMessage(
        "La géolocalisation n'est pas disponible dans ce navigateur. La recherche classique reste utilisable."
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

          setMessage(
            "Position détectée. Les sessions sont maintenant filtrées et triées par proximité."
          );

          await fetchSessions(
            filters,
            location
          );
        },

        (error) => {
          setLocationLoading(
            false
          );

          setUserLocation(
            null
          );

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            setMessage(
              "Vous avez refusé la géolocalisation. Aucun problème : la recherche par salle, activité et date reste disponible."
            );
          } else {
            setMessage(
              "Impossible de récupérer votre position. La recherche classique reste disponible."
            );
          }
        },

        {
          enableHighAccuracy:
            false,

          timeout: 10000,

          maximumAge:
            300000,
        }
      );
  };

  useEffect(() => {
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

              setMessages(
                []
              );

              setIsParticipant(
                false
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

              <span className="capacity">
                {
                  selectedSession
                    .availablePlaces ??
                  selectedSession
                    .capacity
                }{" "}
                place(s) disponible(s)
              </span>

            </div>

            <h2>
              {
                selectedSession.title
              }
            </h2>

            <p>
              {
                selectedSession.description ||
                "Aucune description disponible."
              }
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

          </section>

          <section className="session-detail-layout">

            <div className="participants-panel">

              <h3>
                Participants anonymes
              </h3>

              {participants.length ===
              0 ? (
                <p className="empty-text">
                  Aucun participant pour le moment.
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

                        <span>
                          {
                            participant.creator
                              ? "Créateur"
                              : "Membre"
                          }
                        </span>

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
                      Aucun message pour le moment.
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
                      e
                    ) =>
                      setChatText(
                        e.target
                          .value
                      )
                    }
                  />

                  <button type="submit">
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
            Recherchez une séance par activité,
            salle ou date. Vous pouvez aussi
            utiliser votre position afin
            d’afficher les entraînements
            réellement proches de vous.
          </p>

        </section>

        {message && (
          <div className="page-message">
            {message}
          </div>
        )}

        {/* RECHERCHE */}

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
              placeholder="Ex: jambes Basic-Fit ou musculation -cardio"
              value={
                filters.q
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  q:
                    e.target
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
                onChange={(e) =>
                  setFilters({
                    ...filters,

                    activityType:
                      e.target
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
                Salle
              </label>

              <select
                value={
                  filters.gymId
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,

                    gymId:
                      e.target
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
                onChange={(e) =>
                  setFilters({
                    ...filters,

                    date:
                      e.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-row">

              <label>
                Rayon
              </label>

              <select
                value={
                  filters.radiusKm
                }
                disabled={
                  !userLocation
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,

                    radiusKm:
                      e.target
                        .value,
                  })
                }
              >

                <option value="5">
                  5 km
                </option>

                <option value="10">
                  10 km
                </option>

                <option value="25">
                  25 km
                </option>

                <option value="50">
                  50 km
                </option>

                <option value="100">
                  100 km
                </option>

              </select>

            </div>

          </div>

          <label
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "10px",

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
              onChange={(e) =>
                setFilters({
                  ...filters,

                  availableOnly:
                    e.target
                      .checked,
                })
              }
              style={{
                width: "auto",
              }}
            />

            Afficher uniquement les sessions avec
            des places disponibles

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
                ? "Localisation en cours..."
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
              Réinitialiser les filtres
            </button>

          </div>

          {userLocation && (

            <p
              className="empty-text"
              style={{
                margin: 0,
              }}
            >
              Géolocalisation active. Les résultats
              sont limités à{" "}
              {
                filters.radiusKm
              }{" "}
              km et triés du plus proche au plus
              éloigné.
            </p>

          )}

        </form>

        {/* CRÉATION */}

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

            <div className="form-row">

              <label>
                Salle de sport
              </label>

              <select
                value={
                  newSession.gymId
                }
                onChange={(e) =>
                  setNewSession({
                    ...newSession,

                    gymId:
                      e.target
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
                placeholder="Ex: Session haut du corps"
                value={
                  newSession.title
                }
                onChange={(e) =>
                  setNewSession({
                    ...newSession,

                    title:
                      e.target
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
                onChange={(e) =>
                  setNewSession({
                    ...newSession,

                    activityType:
                      e.target
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
                placeholder="Décrivez rapidement la séance..."
                value={
                  newSession.description
                }
                onChange={(e) =>
                  setNewSession({
                    ...newSession,

                    description:
                      e.target
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
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,

                      startAt:
                        e.target
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
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,

                      durationMin:
                        e.target
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
                  value={
                    newSession.capacity
                  }
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,

                      capacity:
                        e.target
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
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,

                      visibility:
                        e.target
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
            >
              Enregistrer la session
            </button>

          </form>

        )}

        <p className="empty-text">
          {sessions.length} session(s) trouvée(s)
        </p>

        {sessions.length === 0 ? (

          <section className="session-card">

            <h3>
              Aucune session trouvée
            </h3>

            <p className="description">
              Modifiez les filtres ou augmentez
              le rayon de recherche.
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

                    <span className="capacity">
                      {
                        session.availablePlaces
                      }{" "}
                      /{" "}
                      {
                        session.capacity
                      }{" "}
                      place(s) libre(s)
                    </span>

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
                    {
                      session.description ||
                      "Aucune description."
                    }
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
                          session.distanceKm
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
                      }{" "}
                      participant(s)
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

function formatDistance(
  distanceKm
) {
  if (distanceKm == null) {
    return "Distance inconnue";
  }

  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000
    )} m`;
  }

  return `${distanceKm.toFixed(
    1
  )} km`;
}