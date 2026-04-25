import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SessionsPage from "./pages/SessionsPage";
import GymsPage from "./pages/GymsPage";
import ProfilePage from "./pages/ProfilePage";
import AppShell from "./components/AppShell";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [authMode, setAuthMode] = useState("login");
  const [activePage, setActivePage] = useState("sessions");

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setActivePage("sessions");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("participantIds");

    setIsAuthenticated(false);
    setAuthMode("login");
  };

  if (!isAuthenticated) {
    return authMode === "login" ? (
      <LoginPage
        onLoginSuccess={handleAuthSuccess}
        onGoToRegister={() => setAuthMode("register")}
      />
    ) : (
      <RegisterPage
        onRegisterSuccess={handleAuthSuccess}
        onGoToLogin={() => setAuthMode("login")}
      />
    );
  }

  return (
    <AppShell
      activePage={activePage}
      onChangePage={setActivePage}
      onLogout={handleLogout}
    >
      {activePage === "sessions" && <SessionsPage />}
      {activePage === "gyms" && <GymsPage />}
      {activePage === "profile" && <ProfilePage onLogout={handleLogout} />}
    </AppShell>
  );
}

export default App;