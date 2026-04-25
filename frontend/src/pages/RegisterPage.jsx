import { useState } from "react";
import api from "../api/axios";

export default function RegisterPage({ onRegisterSuccess, onGoToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/auth/register", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("role", response.data.role);

      setIsSuccess(true);
      setMessage("Compte créé avec succès !");
      onRegisterSuccess();
    } catch (error) {
      setIsSuccess(false);
      setMessage("Erreur lors de la création du compte");
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
          <p>Créez votre compte gratuitement</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <label>Adresse e-mail</label>
          <div className="input-group">
            <span>✉️</span>
            <input
              type="email"
              placeholder="newuser@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Mot de passe</label>
          <div className="input-group">
            <span>🔒</span>
            <input
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit">Créer mon compte</button>
        </form>

        {message && (
          <div className={isSuccess ? "alert success" : "alert error"}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          <span>Déjà un compte ?</span>
          <button className="link-btn" onClick={onGoToLogin}>
            Se connecter
          </button>
        </div>
      </div>

      <p className="copyright">
        © 2026 <strong>TrainBuddy</strong>. Tous droits réservés.
      </p>
    </div>
  );
}