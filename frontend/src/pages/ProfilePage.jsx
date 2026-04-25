export default function ProfilePage({ onLogout }) {
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");

  return (
    <main className="content">
      <section className="hero-section">
        <p className="eyebrow">Profil membre</p>
        <h2>Votre espace personnel</h2>
        <p>
          Consultez les informations de votre compte et gérez votre session de
          connexion.
        </p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar">👤</div>

        <div>
          <h3>{email}</h3>
          <p>Rôle : {role}</p>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Se déconnecter
        </button>
      </section>
    </main>
  );
}