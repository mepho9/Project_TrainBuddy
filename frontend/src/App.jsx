import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import AppShell
  from "./components/AppShell";

import AdminPage
  from "./pages/AdminPage";

import EnhancedProfilePage
  from "./pages/EnhancedProfilePage";

import GymsPage
  from "./pages/GymsPage";

import LoginPage
  from "./pages/LoginPage";

import NotFoundPage
  from "./pages/NotFoundPage";

import RegisterPage
  from "./pages/RegisterPage";

import SessionsPage
  from "./pages/SessionsPage";

import "./App.css";

import "./styles/professional.css";

import "./styles/polish.css";

function getAuthState() {
  return {
    token:
      localStorage.getItem(
        "token"
      ),

    role:
      localStorage.getItem(
        "role"
      ),
  };
}

function defaultPathForRole(
  role
) {
  return role ===
    "ADMIN"
    ? "/admin"
    : "/sessions";
}

function HomeRedirect() {
  const {
    token,
    role,
  } = getAuthState();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to={
        defaultPathForRole(
          role
        )
      }
      replace
    />
  );
}

function GuestOnlyRoute() {
  const {
    token,
    role,
  } = getAuthState();

  if (token) {
    return (
      <Navigate
        to={
          defaultPathForRole(
            role
          )
        }
        replace
      />
    );
  }

  return <Outlet />;
}

function ProtectedRoute({
  allowedRoles,
}) {
  const location =
    useLocation();

  const {
    token,
    role,
  } = getAuthState();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(
      role
    )
  ) {
    return (
      <Navigate
        to={
          defaultPathForRole(
            role
          )
        }
        replace
      />
    );
  }

  return <Outlet />;
}

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <HomeRedirect />
        }
      />

      <Route
        element={
          <GuestOnlyRoute />
        }
      >

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/register"
          element={
            <RegisterPage />
          }
        />

      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "MEMBER",
            ]}
          />
        }
      >

        <Route
          element={
            <AppShell />
          }
        >

          <Route
            path="/sessions"
            element={
              <SessionsPage />
            }
          />

          <Route
            path="/gyms"
            element={
              <GymsPage />
            }
          />

          <Route
            path="/profile"
            element={
              <EnhancedProfilePage />
            }
          />

        </Route>

      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          />
        }
      >

        <Route
          element={
            <AppShell />
          }
        >

          <Route
            path="/admin"
            element={
              <AdminPage />
            }
          />

        </Route>

      </Route>

      <Route
        path="*"
        element={
          <NotFoundPage />
        }
      />

    </Routes>
  );
}

export default App;