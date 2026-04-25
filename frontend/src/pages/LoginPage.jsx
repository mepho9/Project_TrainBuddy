import { useState } from "react";
import api from "../api/axios";

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("role", response.data.role);

      setIsSuccess(true);
      setMessage("Connexion réussie !");
      onLoginSuccess();
    } catch (error) {
      setIsSuccess(false);
      setMessage("Erreur de connexion");
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-icon">🏋️</div>
          <h1>
            Train<span>Buddy</span>
          </h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <label>Adresse e-mail</label>
          <div className="input-group">
            <span>✉️</span>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Mot de passe</label>
          <div className="input-group">
            <span>🔒</span>
            <input
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit">Se connecter</button>
        </form>

        {message && (
          <div className={isSuccess ? "alert success" : "alert error"}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          <span>Pas encore de compte ?</span>
          <button className="link-btn" onClick={onGoToRegister}>
            Créer un compte
          </button>
        </div>
      </div>

      <p className="copyright">
        © 2026 <strong>TrainBuddy</strong>. Tous droits réservés.
      </p>
    </div>
  );
}