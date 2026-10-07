import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env
      .VITE_API_URL ||
    "http://localhost:8080/api/v1",
});

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

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) =>
    response,

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url ||
      "";

    const isAuthRequest =
      requestUrl.startsWith(
        "/auth/"
      );

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      clearAuthStorage();

      const currentPath =
        window.location.pathname;

      if (
        currentPath !==
        "/login"
      ) {
        window.location.assign(
          "/login?expired=1"
        );
      }
    }

    return Promise.reject(
      error
    );
  }
);

export default api;