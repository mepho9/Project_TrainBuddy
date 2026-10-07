import {
  useState,
} from "react";

import MemberProfileSettings
  from "../components/MemberProfileSettings";

import ProfilePage
  from "./ProfilePage";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function EnhancedProfilePage({
  onLogout,
}) {
  const { t } =
    useLanguage();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "overview"
  );

  const changeTab =
    (tab) => {
      setActiveTab(
        tab
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  return (
    <main className="content">

      <section className="hero-section">

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

      <div
        className="nav-tabs"
        style={{
          width:
            "fit-content",

          margin:
            "0 auto 32px",
        }}
      >

        <button
          className={
            activeTab ===
            "overview"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "overview"
            )
          }
        >
          👤{" "}
          {t(
            "profileTabs.overview"
          )}
        </button>

        <button
          className={
            activeTab ===
            "sessions"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "sessions"
            )
          }
        >
          🏋️{" "}
          {t(
            "profileTabs.sessions"
          )}
        </button>

        <button
          className={
            activeTab ===
            "preferences"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "preferences"
            )
          }
        >
          ⚙️{" "}
          {t(
            "profileTabs.preferences"
          )}
        </button>

        <button
          className={
            activeTab ===
            "account"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "account"
            )
          }
        >
          🔐{" "}
          {t(
            "profileTabs.account"
          )}
        </button>

      </div>

      {activeTab ===
        "overview" && (

        <ProfilePage
          onLogout={
            onLogout
          }
          section="overview"
        />
      )}

      {activeTab ===
        "sessions" && (

        <ProfilePage
          onLogout={
            onLogout
          }
          section="sessions"
        />
      )}

      {activeTab ===
        "preferences" && (

        <MemberProfileSettings
          onLogout={
            onLogout
          }
          section="preferences"
        />
      )}

      {activeTab ===
        "account" && (

        <MemberProfileSettings
          onLogout={
            onLogout
          }
          section="account"
        />
      )}

    </main>
  );
}