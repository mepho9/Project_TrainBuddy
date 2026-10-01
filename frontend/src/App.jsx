import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SessionsPage from "./pages/SessionsPage";
import GymsPage from "./pages/GymsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

import AppShell from "./components/AppShell";

import "./App.css";

function App() {
  const initialRole =
    localStorage.getItem("role");

  const [isAuthenticated, setIsAuthenticated] =
    useState(
      Boolean(
        localStorage.getItem("token")
      )
    );

  const [role, setRole] =
    useState(initialRole);

  const [authMode, setAuthMode] =
    useState("login");

  const [activePage, setActivePage] =
    useState(
      initialRole === "ADMIN"
        ? "admin"
        : "sessions"
    );

  const handleAuthSuccess = () => {
    const authenticatedRole =
      localStorage.getItem("role");

    setRole(
      authenticatedRole
    );

    setIsAuthenticated(true);

    setActivePage(
      authenticatedRole === "ADMIN"
        ? "admin"
        : "sessions"
    );
  };

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

    /*
     * Nettoyage de données provenant
     * d'anciennes versions de TrainBuddy.
     */
    localStorage.removeItem(
      "participantIds"
    );

    localStorage.removeItem(
      "participantId"
    );

    localStorage.removeItem(
      "joinedSessionId"
    );

    setRole(null);

    setIsAuthenticated(
      false
    );

    setAuthMode(
      "login"
    );

    setActivePage(
      "sessions"
    );
  };

  if (!isAuthenticated) {
    return authMode === "login" ? (
      <LoginPage
        onLoginSuccess={
          handleAuthSuccess
        }
        onGoToRegister={() =>
          setAuthMode(
            "register"
          )
        }
      />
    ) : (
      <RegisterPage
        onRegisterSuccess={
          handleAuthSuccess
        }
        onGoToLogin={() =>
          setAuthMode(
            "login"
          )
        }
      />
    );
  }

  return (
    <AppShell
      activePage={
        activePage
      }
      onChangePage={
        setActivePage
      }
      onLogout={
        handleLogout
      }
      role={
        role
      }
    >

      {role === "ADMIN" && (
        <>
          {activePage ===
            "admin" && (
            <AdminPage />
          )}
        </>
      )}

      {role !== "ADMIN" && (
        <>
          {activePage ===
            "sessions" && (
            <SessionsPage />
          )}

          {activePage ===
            "gyms" && (
            <GymsPage />
          )}

          {activePage ===
            "profile" && (
            <ProfilePage
              onLogout={
                handleLogout
              }
            />
          )}
        </>
      )}

    </AppShell>
  );
}

export default App;