import { useEffect, useState } from "react";
import api from "../api/axios";

export default function GymsPage() {
  const [gyms, setGyms] = useState([]);
  const [message, setMessage] = useState("");

  const fetchGyms = async () => {
    try {
      const res = await api.get("/gyms");
      setGyms(res.data);
    } catch (err) {
      setMessage("Impossible de charger les salles.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, []);

  return (
    <main className="content">
      <section className="hero-section">
        <p className="eyebrow">Salles partenaires</p>
        <h2>Choisissez votre salle d’entraînement</h2>
        <p>
          Retrouvez les salles disponibles sur TrainBuddy et consultez les lieux
          où des sessions peuvent être organisées.
        </p>
      </section>

      {message && <div className="page-message">{message}</div>}

      <section className="gyms-grid">
        {gyms.map((gym) => (
          <article className="gym-card" key={gym.id}>
            <div className="gym-icon">📍</div>

            <div>
              <h3>{gym.name}</h3>
              <p className="activity">{gym.type}</p>
              <p className="description">{gym.address}</p>
            </div>

            <div className="gym-meta">
              <span>{gym.active ? "Active" : "Inactive"}</span>
              <span>
                {gym.latitude}, {gym.longitude}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}