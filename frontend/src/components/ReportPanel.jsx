import {
  AlertTriangle,
  Send,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import api
  from "../api/axios";

import { useLanguage }
  from "../i18n/LanguageContext";

import "../styles/admin.css";

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

  return (
    <ReportForm
      key={`${target.type}-${target.id}`}
      target={
        target
      }
      onCancel={
        onCancel
      }
      onSuccess={
        onSuccess
      }
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

      setSubmitting(
        true
      );

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
    <section className="report-panel">

      <div className="report-panel-heading">

        <div className="report-panel-icon">

          <AlertTriangle
            size={20}
          />

        </div>

        <div>

          <p className="eyebrow">
            {t(
              "report.title"
            )}
          </p>

          <h3>
            {t(
              "report.report",
              {
                target:
                  target.label,
              }
            )}
          </h3>

          <p>
            {t(
              "report.description"
            )}
          </p>

        </div>

      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <form
        className="report-form"
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
            value={
              reason
            }
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
          >

            {REASONS.map(
              (value) => (

                <option
                  key={
                    value
                  }
                  value={
                    value
                  }
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
            value={
              details
            }
            onChange={(event) =>
              setDetails(
                event.target.value
              )
            }
          />

        </div>

        <div className="report-form-actions">

          <button
            className="admin-danger-btn"
            type="submit"
            disabled={
              submitting
            }
          >

            <Send
              size={16}
            />

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

            <X
              size={16}
            />

            {t(
              "common.cancel"
            )}

          </button>

        </div>

      </form>

    </section>
  );
}