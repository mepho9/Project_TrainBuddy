import LanguageSwitcher
  from "./LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function AppShell({
  activePage,
  onChangePage,
  onLogout,
  role,
  children,
}) {
  const { t } =
    useLanguage();

  return (
    <div className="app-page">

      <header className="topbar">

        <div className="topbar-brand">

          <div className="brand-icon small">
            🏋️
          </div>

          <h1>
            Train<span>Buddy</span>
          </h1>

        </div>

        <nav className="nav-tabs">

          {role === "ADMIN" ? (

            <button
              className={
                activePage ===
                "admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChangePage(
                  "admin"
                )
              }
            >
              {t(
                "nav.admin"
              )}
            </button>

          ) : (
            <>
              <button
                className={
                  activePage ===
                  "sessions"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onChangePage(
                    "sessions"
                  )
                }
              >
                {t(
                  "nav.sessions"
                )}
              </button>

              <button
                className={
                  activePage ===
                  "gyms"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onChangePage(
                    "gyms"
                  )
                }
              >
                {t(
                  "nav.gyms"
                )}
              </button>

              <button
                className={
                  activePage ===
                  "profile"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onChangePage(
                    "profile"
                  )
                }
              >
                {t(
                  "nav.profile"
                )}
              </button>
            </>
          )}

        </nav>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems:
              "center",
          }}
        >
          <LanguageSwitcher />

          <button
            className="logout-btn"
            onClick={
              onLogout
            }
          >
            {t(
              "nav.logout"
            )}
          </button>
        </div>

      </header>

      {children}

    </div>
  );
}