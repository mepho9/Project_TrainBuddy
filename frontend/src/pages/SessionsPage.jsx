import { useEffect, useState } from "react";
import api from "../api/axios";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [participantId, setParticipantId] = useState(null);

  const [newSession, setNewSession] = useState({
    gymId: "",
    title: "",
    activityType: "Musculation",
    description: "",
    startAt: "",
    durationMin: 60,
    capacity: 4,
    visibility: "PUBLIC",
  });

  const userEmail = localStorage.getItem("email");

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data);
    } catch (err) {
      setMessage("Impossible de charger les sessions.");
      console.error(err);
    }
  };

  const fetchGyms = async () => {
    try {
      const res = await api.get("/gyms");
      setGyms(res.data);

      if (res.data.length > 0) {
        setNewSession((prev) => ({
          ...prev,
          gymId: prev.gymId || res.data[0].id,
        }));
      }
    } catch (err) {
      setMessage("Impossible de charger les salles.");
      console.error(err);
    }
  };

  const fetchParticipants = async (id) => {
    const res = await api.get(`/sessions/${id}/participants`);
    setParticipants(res.data);
  };

  const fetchMessages = async (id) => {
    const res = await api.get(`/sessions/${id}/messages`);
    setMessages(res.data);
  };

  const openSession = async (session) => {
    setSelectedSession(session);
    setMessage("");

    try {
        await fetchParticipants(session.id);

        const storedParticipantIds = JSON.parse(
        localStorage.getItem("participantIds") || "{}"
        );

        const currentParticipantId = storedParticipantIds[session.id];

        setParticipantId(currentParticipantId || null);

        if (currentParticipantId) {
        await fetchMessages(session.id);
        } else {
        setMessages([]);
        }
    } catch (err) {
        setMessage("Impossible de charger les détails.");
        console.error(err);
    }
  };

  const joinSession = async () => {
    try {
      const res = await api.post(`/sessions/${selectedSession.id}/join`, {
        email: userEmail,
      });

      const id = res.data.id;
      const storedParticipantIds = JSON.parse(
      localStorage.getItem("participantIds") || "{}"
      );

      storedParticipantIds[selectedSession.id] = id;

      localStorage.setItem(
      "participantIds",
      JSON.stringify(storedParticipantIds)
      );

      setParticipantId(id);

      setMessage("Session rejointe avec succès !");
      await fetchParticipants(selectedSession.id);
      await fetchMessages(selectedSession.id);
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage("Vous êtes déjà inscrit à cette session.");

        await fetchParticipants(selectedSession.id);

        const matchingParticipant = participants.find(
            (participant) => participantId === participant.id
        );

        if (matchingParticipant || participantId) {
            await fetchMessages(selectedSession.id);
        }

        return;
      }

      setMessage(err.response?.data?.message || "Erreur lors de l'inscription.");
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!chatText.trim()) return;

    try {
      await api.post(`/sessions/${selectedSession.id}/messages`, {
        participantId,
        message: chatText,
      });

      setChatText("");
      await fetchMessages(selectedSession.id);
    } catch (err) {
      setMessage(err.response?.data?.message || "Impossible d’envoyer le message.");
      console.error(err);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();

    try {
      await api.post("/sessions", {
        ...newSession,
        durationMin: Number(newSession.durationMin),
        capacity: Number(newSession.capacity),
      });

      setMessage("Session créée avec succès !");
      setShowCreateForm(false);

      setNewSession({
        gymId: gyms[0]?.id || "",
        title: "",
        activityType: "Musculation",
        description: "",
        startAt: "",
        durationMin: 60,
        capacity: 4,
        visibility: "PUBLIC",
      });

      await fetchSessions();
    } catch (err) {
      setMessage(err.response?.data?.message || "Impossible de créer la session.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchGyms();
  }, []);

  if (selectedSession) {
    return (
      <div className="app-page">

        <main className="content">
          {message && <div className="page-message">{message}</div>}

          <section className="session-detail">
            <div className="session-card-header">
              <span className="badge">{selectedSession.status}</span>
              <span className="capacity">{selectedSession.capacity} places</span>
            </div>

            <h2>{selectedSession.title}</h2>
            <p>{selectedSession.description || "Aucune description disponible."}</p>

            <div className="session-detail-info">
              <span>🏋️ Activité : {selectedSession.activityType}</span>
              <span>📍 Salle : {selectedSession.gymName}</span>
              <span>🕒 Date : {formatDate(selectedSession.startAt)}</span>
              <span>⏱️ Durée : {selectedSession.durationMin} min</span>
              <span>🔒 Visibilité : {selectedSession.visibility}</span>
            </div>

            {!participantId && (
              <button className="primary-btn" onClick={joinSession}>
                Rejoindre la session
              </button>
            )}

            {participantId && (
              <button className="success-btn" disabled>
                Session rejointe
              </button>
            )}
          </section>

          <section className="session-detail-layout">
            <div className="participants-panel">
              <h3>Participants anonymes</h3>

              {participants.length === 0 ? (
                <p className="empty-text">Aucun participant pour le moment.</p>
              ) : (
                <div className="participants-list">
                  {participants.map((participant) => (
                    <div className="participant-item" key={participant.id}>
                      <div>
                        <strong>{participant.anonymousName}</strong>
                        <p>Code : {participant.recognitionCode}</p>
                      </div>
                      <span>{participant.creator ? "Créateur" : "Membre"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {participantId && (
              <div className="chat-panel">
                <div className="chat-header">
                  <h3>Chat anonyme</h3>
                  <span>{messages.length} message(s)</span>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <p className="empty-text">Aucun message pour le moment.</p>
                  ) : (
                    messages.map((msg) => (
                      <div className="chat-message" key={msg.id}>
                        <div className="chat-author">{msg.anonymousAuthor}</div>
                        <p>{msg.message}</p>
                        <span>{formatDate(msg.sentAt)}</span>
                      </div>
                    ))
                  )}
                </div>

                <form className="chat-form" onSubmit={sendMessage}>
                  <input
                    type="text"
                    placeholder="Écrire un message anonyme..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                  <button type="submit">Envoyer</button>
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
          <p className="eyebrow">Sessions proches</p>
          <h2>Trouvez votre prochain partenaire d’entraînement</h2>
          <p>
            Consultez les sessions disponibles, choisissez celle qui vous convient,
            puis rejoignez-la pour accéder au chat anonyme.
          </p>
        </section>

        {message && <div className="page-message">{message}</div>}

        <div className="create-session-actions">
          <button
            className="primary-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Fermer le formulaire" : "Créer une session"}
          </button>
        </div>

        {showCreateForm && (
          <form className="create-session-form" onSubmit={createSession}>
            <div className="form-row">
              <label>Salle de sport</label>
              <select
                value={newSession.gymId}
                onChange={(e) =>
                  setNewSession({ ...newSession, gymId: e.target.value })
                }
              >
                {gyms.map((gym) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Titre</label>
              <input
                type="text"
                placeholder="Ex: Session haut du corps"
                value={newSession.title}
                onChange={(e) =>
                  setNewSession({ ...newSession, title: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <label>Activité</label>
              <select
                value={newSession.activityType}
                onChange={(e) =>
                  setNewSession({ ...newSession, activityType: e.target.value })
                }
              >
                <option>Musculation</option>
                <option>Cardio</option>
                <option>Crossfit</option>
                <option>Fitness</option>
                <option>HIIT</option>
                <option>Mobilité</option>
              </select>
            </div>

            <div className="form-row">
              <label>Description</label>
              <textarea
                placeholder="Décrivez rapidement la séance..."
                value={newSession.description}
                onChange={(e) =>
                  setNewSession({ ...newSession, description: e.target.value })
                }
              />
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Date et heure</label>
                <input
                  type="datetime-local"
                  value={newSession.startAt}
                  onChange={(e) =>
                    setNewSession({ ...newSession, startAt: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <label>Durée</label>
                <input
                  type="number"
                  min="15"
                  max="300"
                  value={newSession.durationMin}
                  onChange={(e) =>
                    setNewSession({ ...newSession, durationMin: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <label>Capacité</label>
                <input
                  type="number"
                  min="2"
                  value={newSession.capacity}
                  onChange={(e) =>
                    setNewSession({ ...newSession, capacity: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <label>Visibilité</label>
                <select
                  value={newSession.visibility}
                  onChange={(e) =>
                    setNewSession({ ...newSession, visibility: e.target.value })
                  }
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PRIVATE">PRIVATE</option>
                </select>
              </div>
            </div>

            <button className="primary-btn" type="submit">
              Enregistrer la session
            </button>
          </form>
        )}

        <section className="sessions-grid">
          {sessions.map((session) => (
            <article className="session-card" key={session.id}>
              <div className="session-card-header">
                <span className="badge">{session.status}</span>
                <span className="capacity">{session.capacity} places</span>
              </div>

              <h3>{session.title}</h3>
              <p className="activity">{session.activityType}</p>
              <p className="description">
                {session.description || "Aucune description."}
              </p>

              <div className="session-meta">
                <span>📍 {session.gymName}</span>
                <span>🕒 {formatDate(session.startAt)}</span>
                <span>⏱️ {session.durationMin} min</span>
              </div>

              <button className="secondary-btn" onClick={() => openSession(session)}>
                Voir détails
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Date inconnue";

  return new Date(value).toLocaleString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}