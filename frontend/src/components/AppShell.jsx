export default function AppShell({ activePage, onChangePage, onLogout, children }) {
  return (
    <div className="app-page">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon small">🏋️</div>
          <h1>
            Train<span>Buddy</span>
          </h1>
        </div>

        <nav className="nav-tabs">
          <button
            className={activePage === "sessions" ? "active" : ""}
            onClick={() => onChangePage("sessions")}
          >
            Sessions
          </button>

          <button
            className={activePage === "gyms" ? "active" : ""}
            onClick={() => onChangePage("gyms")}
          >
            Salles
          </button>

          <button
            className={activePage === "profile" ? "active" : ""}
            onClick={() => onChangePage("profile")}
          >
            Profil
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Déconnexion
        </button>
      </header>

      {children}
    </div>
  );
}