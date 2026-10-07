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
  useNavigate,
} from "react-router-dom";

import api
  from "../api/axios";

import LanguageSwitcher
  from "../components/LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function RegisterPage() {
  const { t } =
    useLanguage();

  const navigate =
    useNavigate();

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
  ] = useState("");

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const handleRegister =
    async (event) => {
      event.preventDefault();

      setMessage("");
      setSubmitting(true);

      try {
        const response =
          await api.post(
            "/auth/register",
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

        navigate(
          response.data.role ===
          "ADMIN"
            ? "/admin"
            : "/sessions",
          {
            replace: true,
          }
        );

      } catch (error) {
        setIsSuccess(false);

        setMessage(
          t(
            "auth.registerError"
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
                  "auth.join"
                )}
              </p>

              <h1>
                Train<span>Buddy</span>
              </h1>

              <p className="auth-subtitle">
                {t(
                  "auth.register.subtitle"
                )}
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleRegister
            }
            className="auth-form"
          >

            <label
              htmlFor="register-email"
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
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="newuser@example.com"
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
              htmlFor="register-password"
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
                id="register-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder={t(
                  "auth.passwordRegisterPlaceholder"
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
                      "auth.register"
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
                "auth.alreadyAccount"
              )}
            </span>

            <Link
              className="link-btn"
              to="/login"
            >
              {t(
                "auth.login"
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