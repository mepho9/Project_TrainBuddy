import {
  useState,
} from "react";

import api
  from "../api/axios";

import { useLanguage }
  from "../i18n/LanguageContext";

const REASONS = [
  "SPAM",
  "INAPPROPRIATE_CONTENT",
  "HARASSMENT",
  "DANGEROUS_BEHAVIOR",
  "FALSE_INFORMATION",
  "OTHER",
];

export default function ReportPanel({
  target,
  onCancel,
  onSuccess,
}) {
  if (!target) {
    return null;
  }

  /*
   * Le formulaire reçoit une key basée sur
   * la cible.
   *
   * Lorsqu'un autre signalement est ouvert,
   * React recrée automatiquement le formulaire
   * avec un état propre.
   *
   * On évite ainsi de devoir réinitialiser le
   * state dans un useEffect.
   */
  return (
    <ReportForm
      key={`${target.type}-${target.id}`}
      target={target}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
}

function ReportForm({
  target,
  onCancel,
  onSuccess,
}) {
  const { t } =
    useLanguage();

  const [
    reason,
    setReason,
  ] = useState(
    "SPAM"
  );

  const [
    details,
    setDetails,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const submitReport =
    async (event) => {
      event.preventDefault();

      setSubmitting(true);

      setError("");

      try {
        const endpoint =
          target.type ===
          "SESSION"
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
          t(
            "report.error"
          )
        );

        console.error(
          err
        );

      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <section
      className="create-session-form"
      style={{
        marginBottom:
          "28px",
      }}
    >

      <div>

        <p className="eyebrow">
          {t(
            "report.title"
          )}
        </p>

        <h3
          style={{
            marginTop: 0,
          }}
        >
          {t(
            "report.report",
            {
              target:
                target.label,
            }
          )}
        </h3>

        <p className="description">
          {t(
            "report.description"
          )}
        </p>

      </div>

      {error && (
        <div className="page-message">
          {error}
        </div>
      )}

      <form
        onSubmit={
          submitReport
        }
      >

        <div className="form-row">

          <label>
            {t(
              "report.reason"
            )}
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
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {t(
                    `reason.${value}`
                  )}
                </option>
              )
            )}

          </select>

        </div>

        <div className="form-row">

          <label>
            {t(
              "report.details"
            )}
          </label>

          <textarea
            maxLength={1000}
            placeholder={t(
              "report.detailsPlaceholder"
            )}
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
            disabled={
              submitting
            }
          >
            {submitting
              ? t(
                  "report.sending"
                )
              : t(
                  "report.send"
                )}
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={
              onCancel
            }
            disabled={
              submitting
            }
          >
            {t(
              "common.cancel"
            )}
          </button>

        </div>

      </form>

    </section>
  );
}