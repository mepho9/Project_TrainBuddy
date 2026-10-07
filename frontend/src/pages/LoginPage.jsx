import {
  ArrowRight,
  Dumbbell,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api
  from "../api/axios";

import LanguageSwitcher
  from "../components/LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function LoginPage() {
  const { t } =
    useLanguage();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [searchParams] =
    useSearchParams();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState(
    searchParams.get(
      "expired"
    ) === "1"
      ? t(
          "auth.sessionExpired"
        )
      : ""
  );

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const handleLogin =
    async (event) => {
      event.preventDefault();

      setMessage("");
      setSubmitting(true);

      try {
        const response =
          await api.post(
            "/auth/login",
            {
              email,
              password,
            }
          );

        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "email",
          response.data.email
        );

        localStorage.setItem(
          "role",
          response.data.role
        );

        setIsSuccess(true);

        const requestedPath =
          location.state?.from;

        const target =
          requestedPath ||
          (
            response.data.role ===
            "ADMIN"
              ? "/admin"
              : "/sessions"
          );

        navigate(
          target,
          {
            replace: true,
          }
        );

      } catch (error) {
        setIsSuccess(false);

        setMessage(
          t(
            "auth.loginError"
          )
        );

        console.error(
          error
        );

      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="auth-page">

      <div className="auth-shell">

        <div className="auth-language">
          <LanguageSwitcher />
        </div>

        <section className="auth-card">

          <div className="brand auth-brand">

            <span className="brand-mark">

              <Dumbbell
                size={25}
                strokeWidth={2.2}
              />

            </span>

            <div>

              <p className="auth-kicker">
                {t(
                  "auth.welcome"
                )}
              </p>

              <h1>
                Train<span>Buddy</span>
              </h1>

              <p className="auth-subtitle">
                {t(
                  "auth.login.subtitle"
                )}
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleLogin
            }
            className="auth-form"
          >

            <label
              htmlFor="login-email"
            >
              {t(
                "auth.email"
              )}
            </label>

            <div className="input-group">

              <Mail
                size={18}
                aria-hidden="true"
              />

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
              />

            </div>

            <label
              htmlFor="login-password"
            >
              {t(
                "auth.password"
              )}
            </label>

            <div className="input-group">

              <LockKeyhole
                size={18}
                aria-hidden="true"
              />

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder={t(
                  "auth.passwordPlaceholder"
                )}
                value={
                  password
                }
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
              />

            </div>

            <button
              type="submit"
              disabled={
                submitting
              }
            >

              <span>

                {submitting
                  ? t(
                      "common.loading"
                    )
                  : t(
                      "auth.login"
                    )}

              </span>

              {!submitting && (
                <ArrowRight
                  size={18}
                />
              )}

            </button>

          </form>

          {message && (

            <div
              className={
                isSuccess
                  ? "alert success"
                  : "alert error"
              }
            >
              {message}
            </div>

          )}

          <div className="auth-footer">

            <span>
              {t(
                "auth.noAccount"
              )}
            </span>

            <Link
              className="link-btn"
              to="/register"
            >
              {t(
                "auth.createAccount"
              )}
            </Link>

          </div>

        </section>

        <p className="copyright">
          © 2026 TrainBuddy.{" "}
          {t(
            "auth.rights"
          )}
        </p>

      </div>

    </div>
  );
}