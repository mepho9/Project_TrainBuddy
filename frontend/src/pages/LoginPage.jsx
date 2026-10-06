import { useState }
  from "react";

import api
  from "../api/axios";

import LanguageSwitcher
  from "../components/LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function LoginPage({
  onLoginSuccess,
  onGoToRegister,
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

  const handleLogin =
    async (event) => {
      event.preventDefault();

      setMessage("");

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

        setMessage(
          t(
            "auth.loginSuccess"
          )
        );

        onLoginSuccess();

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
              "auth.login.subtitle"
            )}
          </p>

        </div>

        <form
          onSubmit={
            handleLogin
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

          <button type="submit">
            {t(
              "auth.login"
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

          <button
            className="link-btn"
            onClick={
              onGoToRegister
            }
          >
            {t(
              "auth.createAccount"
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