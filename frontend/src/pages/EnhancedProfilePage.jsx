import {
  CalendarDays,
  LayoutDashboard,
  LockKeyhole,
  SlidersHorizontal,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import MemberProfileSettings
  from "../components/MemberProfileSettings";

import ProfilePage
  from "./ProfilePage";

import { useLanguage }
  from "../i18n/LanguageContext";

const ALLOWED_TABS =
  new Set([
    "overview",
    "sessions",
    "preferences",
    "account",
  ]);

export default function EnhancedProfilePage() {
  const { t } =
    useLanguage();

  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedTab =
    searchParams.get(
      "tab"
    );

  const activeTab =
    ALLOWED_TABS.has(
      requestedTab
    )
      ? requestedTab
      : "overview";

  const handleLogout = () => {
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

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  const changeTab = (
    tab
  ) => {
    if (
      tab === "overview"
    ) {
      setSearchParams({});
    } else {
      setSearchParams({
        tab,
      });
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const tabs = [
    {
      id: "overview",
      label: t(
        "profileTabs.overview"
      ),
      icon: LayoutDashboard,
    },

    {
      id: "sessions",
      label: t(
        "profileTabs.sessions"
      ),
      icon: CalendarDays,
    },

    {
      id: "preferences",
      label: t(
        "profileTabs.preferences"
      ),
      icon: SlidersHorizontal,
    },

    {
      id: "account",
      label: t(
        "profileTabs.account"
      ),
      icon: LockKeyhole,
    },
  ];

  return (
    <main className="content">

      <section className="hero-section profile-hero">

        <p className="eyebrow">
          {t(
            "profile.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "profile.title"
          )}
        </h2>

        <p>
          {t(
            "profile.description"
          )}
        </p>

      </section>

      <div className="nav-tabs profile-tabs">

        {tabs.map(
          (tab) => {
            const Icon =
              tab.icon;

            return (
              <button
                key={
                  tab.id
                }
                type="button"
                className={
                  activeTab ===
                  tab.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeTab(
                    tab.id
                  )
                }
              >

                <Icon
                  size={17}
                />

                <span>
                  {tab.label}
                </span>

              </button>
            );
          }
        )}

      </div>

      <div className="profile-tab-content">

        {activeTab ===
          "overview" && (

          <ProfilePage
            onLogout={
              handleLogout
            }
            section="overview"
          />

        )}

        {activeTab ===
          "sessions" && (

          <ProfilePage
            onLogout={
              handleLogout
            }
            section="sessions"
          />

        )}

        {activeTab ===
          "preferences" && (

          <MemberProfileSettings
            onLogout={
              handleLogout
            }
            section="preferences"
          />

        )}

        {activeTab ===
          "account" && (

          <MemberProfileSettings
            onLogout={
              handleLogout
            }
            section="account"
          />

        )}

      </div>

    </main>
  );
}