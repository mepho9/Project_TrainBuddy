import {
  Dumbbell,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import LanguageSwitcher
  from "./LanguageSwitcher";

import { useLanguage }
  from "../i18n/LanguageContext";

function clearAuthStorage() {
  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "email"
  );

  localStorage.removeItem(
    "role"
  );

  localStorage.removeItem(
    "participantIds"
  );

  localStorage.removeItem(
    "participantId"
  );

  localStorage.removeItem(
    "joinedSessionId"
  );
}

export default function AppShell() {
  const { t } =
    useLanguage();

  const navigate =
    useNavigate();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const role =
    localStorage.getItem(
      "role"
    );

  const email =
    localStorage.getItem(
      "email"
    );

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    clearAuthStorage();

    closeMenu();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  const navLinkClass = ({
    isActive,
  }) =>
    `app-nav-link${
      isActive
        ? " active"
        : ""
    }`;

  return (
    <div className="app-page">

      <header className="topbar">

        <div className="topbar-inner">

          <NavLink
            to={
              role === "ADMIN"
                ? "/admin"
                : "/sessions"
            }
            className="topbar-brand"
            onClick={closeMenu}
          >

            <span className="brand-mark brand-mark-small">

              <Dumbbell
                size={20}
                strokeWidth={2.2}
              />

            </span>

            <span className="brand-wordmark">
              Train<span>Buddy</span>
            </span>

          </NavLink>

          <button
            className="mobile-menu-btn"
            type="button"
            aria-label={t(
              "nav.menu"
            )}
            aria-expanded={
              menuOpen
            }
            onClick={() =>
              setMenuOpen(
                (current) =>
                  !current
              )
            }
          >

            {menuOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}

          </button>

          <div
            className={`topbar-panel${
              menuOpen
                ? " open"
                : ""
            }`}
          >

            <nav className="app-nav">

              {role ===
              "ADMIN" ? (

                <NavLink
                  to="/admin"
                  className={
                    navLinkClass
                  }
                  onClick={
                    closeMenu
                  }
                >

                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    {t(
                      "nav.admin"
                    )}
                  </span>

                </NavLink>

              ) : (
                <>

                  <NavLink
                    to="/sessions"
                    className={
                      navLinkClass
                    }
                    onClick={
                      closeMenu
                    }
                  >

                    <Dumbbell
                      size={17}
                    />

                    <span>
                      {t(
                        "nav.sessions"
                      )}
                    </span>

                  </NavLink>

                  <NavLink
                    to="/gyms"
                    className={
                      navLinkClass
                    }
                    onClick={
                      closeMenu
                    }
                  >

                    <MapPin
                      size={17}
                    />

                    <span>
                      {t(
                        "nav.gyms"
                      )}
                    </span>

                  </NavLink>

                  <NavLink
                    to="/profile"
                    className={
                      navLinkClass
                    }
                    onClick={
                      closeMenu
                    }
                  >

                    <UserRound
                      size={17}
                    />

                    <span>
                      {t(
                        "nav.profile"
                      )}
                    </span>

                  </NavLink>

                </>
              )}

            </nav>

            <div className="topbar-actions">

              <div className="topbar-account">

                <span className="topbar-account-label">

                  {role ===
                  "ADMIN"
                    ? t(
                        "shell.admin"
                      )
                    : t(
                        "shell.member"
                      )}

                </span>

                <span className="topbar-account-email">
                  {email}
                </span>

              </div>

              <LanguageSwitcher />

              <button
                className="logout-btn"
                type="button"
                onClick={
                  handleLogout
                }
              >

                <LogOut
                  size={17}
                />

                <span>
                  {t(
                    "nav.logout"
                  )}
                </span>

              </button>

            </div>

          </div>

        </div>

      </header>

      <Outlet />

    </div>
  );
}