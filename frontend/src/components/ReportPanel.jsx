import {
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const REASONS = [
  {
    value: "SPAM",
    label: "Spam",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "Contenu inapproprié",
  },
  {
    value: "HARASSMENT",
    label: "Harcèlement",
  },
  {
    value: "DANGEROUS_BEHAVIOR",
    label: "Comportement dangereux",
  },
  {
    value: "FALSE_INFORMATION",
    label: "Informations trompeuses",
  },
  {
    value: "OTHER",
    label: "Autre",
  },
];

export default function ReportPanel({
  target,
  onCancel,
  onSuccess,
}) {
  const [reason, setReason] =
    useState("SPAM");

  const [details, setDetails] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    setReason("SPAM");
    setDetails("");
    setError("");
  }, [target]);

  if (!target) {
    return null;
  }

  const submitReport =
    async (event) => {
      event.preventDefault();

      setSubmitting(true);
      setError("");

      try {
        const endpoint =
          target.type === "SESSION"
            ? `/reports/sessions/${target.id}`
            : `/reports/participants/${target.id}`;

        await api.post(
          endpoint,
          {
            reason,
            details:
              details.trim() ||
              null,
          }
        );

        onSuccess();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Impossible d'envoyer le signalement."
        );

        console.error(err);
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <section
      className="create-session-form"
      style={{
        marginBottom: "28px",
      }}
    >
      <div>
        <p className="eyebrow">
          Signalement
        </p>

        <h3
          style={{
            marginTop: 0,
          }}
        >
          Signaler {target.label}
        </h3>

        <p className="description">
          Le signalement sera transmis
          aux administrateurs de
          TrainBuddy. Votre identité ne
          sera pas communiquée au membre
          signalé.
        </p>
      </div>

      {error && (
        <div className="page-message">
          {error}
        </div>
      )}

      <form
        onSubmit={submitReport}
      >
        <div className="form-row">
          <label>
            Motif
          </label>

          <select
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
          >
            {REASONS.map(
              (item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="form-row">
          <label>
            Détails
          </label>

          <textarea
            maxLength={1000}
            placeholder="Expliquez brièvement le problème..."
            value={details}
            onChange={(event) =>
              setDetails(
                event.target.value
              )
            }
          />
        </div>

        <div className="card-actions">
          <button
            className="primary-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Envoi..."
              : "Envoyer le signalement"}
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  );
}