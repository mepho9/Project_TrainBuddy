import {
  useEffect,
  useState,
} from "react";

import api
  from "../api/axios";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function GymsPage() {
  const { t } =
    useLanguage();

  const [
    gyms,
    setGyms,
  ] = useState([]);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    void (async () => {
      try {
        const res =
          await api.get(
            "/gyms"
          );

        if (cancelled) {
          return;
        }

        setGyms(
          res.data
        );

      } catch (err) {
        if (cancelled) {
          return;
        }

        setMessage(
          t(
            "gyms.loadError"
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

  return (
    <main className="content">

      <section className="hero-section">

        <p className="eyebrow">
          {t(
            "gyms.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "gyms.title"
          )}
        </h2>

        <p>
          {t(
            "gyms.description"
          )}
        </p>

      </section>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

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

              <div className="gym-meta">

                <span>
                  {gym.active
                    ? t(
                        "common.active"
                      )
                    : t(
                        "common.inactive"
                      )}
                </span>

                <span>
                  {gym.latitude},{" "}
                  {gym.longitude}
                </span>

              </div>

            </article>
          )
        )}

      </section>

    </main>
  );
}