import { useState }
  from "react";

import api
  from "../api/axios";

import LanguageSwitcher
  from "../components/LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function RegisterPage({
  onRegisterSuccess,
  onGoToLogin,
}) {
  const { t } =
    useLanguage();

  const [email, setEmail] =
    useState("");

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

  const handleRegister =
    async (event) => {
      event.preventDefault();

      setMessage("");

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

        setMessage(
          t(
            "auth.registerSuccess"
          )
        );

        onRegisterSuccess();

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
      }
    };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            marginBottom:
              "10px",
          }}
        >
          <LanguageSwitcher />
        </div>

        <div className="brand">

          <div className="brand-icon">
            🏋️
          </div>

          <h1>
            Train<span>Buddy</span>
          </h1>

          <p>
            {t(
              "auth.register.subtitle"
            )}
          </p>

        </div>

        <form
          onSubmit={
            handleRegister
          }
          className="auth-form"
        >

          <label>
            {t(
              "auth.email"
            )}
          </label>

          <div className="input-group">

            <span>
              ✉️
            </span>

            <input
              type="email"
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

          <label>
            {t(
              "auth.password"
            )}
          </label>

          <div className="input-group">

            <span>
              🔒
            </span>

            <input
              type="password"
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

          <button type="submit">
            {t(
              "auth.register"
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

          <button
            className="link-btn"
            onClick={
              onGoToLogin
            }
          >
            {t(
              "auth.login"
            )}
          </button>

        </div>

      </div>

      <p className="copyright">
        © 2026{" "}
        <strong>
          TrainBuddy
        </strong>
        .{" "}
        {t(
          "auth.rights"
        )}
      </p>

    </div>
  );
}