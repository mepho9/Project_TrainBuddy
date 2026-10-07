import {
  ArrowLeft,
  CircleAlert,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { t } =
    useLanguage();

  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );

  const role =
    localStorage.getItem(
      "role"
    );

  const homePath =
    !token
      ? "/login"
      : role === "ADMIN"
      ? "/admin"
      : "/sessions";

  return (
    <div className="not-found-page">

      <section className="not-found-card">

        <span className="not-found-icon">

          <CircleAlert
            size={30}
          />

        </span>

        <p className="eyebrow">
          {t(
            "notFound.eyebrow"
          )}
        </p>

        <h1>
          {t(
            "notFound.title"
          )}
        </h1>

        <p>
          {t(
            "notFound.description"
          )}
        </p>

        <button
          className="primary-btn compact-btn"
          type="button"
          onClick={() =>
            navigate(
              homePath,
              {
                replace: true,
              }
            )
          }
        >

          <ArrowLeft
            size={17}
          />

          <span>
            {t(
              "notFound.back"
            )}
          </span>

        </button>

      </section>

    </div>
  );
}