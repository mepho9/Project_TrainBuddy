import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api
  from "../api/axios";

import AdminReportsSection
  from "../components/AdminReportsSection";

import { useLanguage }
  from "../i18n/LanguageContext";

const EMPTY_GYM = {
  name: "",
  type: "",
  address: "",
  latitude: "",
  longitude: "",
};

export default function AdminPage() {
  const { t } =
    useLanguage();

  const currentEmail =
    localStorage.getItem(
      "email"
    );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "users"
  );

  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    gyms,
    setGyms,
  ] = useState([]);

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [
    sessionSearch,
    setSessionSearch,
  ] = useState("");

  const [
    sessionStatus,
    setSessionStatus,
  ] = useState("");

  const [
    gymForm,
    setGymForm,
  ] = useState(
    EMPTY_GYM
  );

  const [
    editingGymId,
    setEditingGymId,
  ] = useState(null);

  /*
   * =========================
   * CHARGEMENT
   * =========================
   */

  const fetchUsers =
    async () => {
      const response =
        await api.get(
          "/admin/users"
        );

      setUsers(
        response.data
      );
    };

  const fetchGyms =
    async () => {
      const response =
        await api.get(
          "/admin/gyms"
        );

      setGyms(
        response.data
      );
    };

  const fetchSessions =
    async () => {
      const response =
        await api.get(
          "/admin/sessions"
        );

      setSessions(
        response.data
      );
    };

  const fetchReports =
    async () => {
      const response =
        await api.get(
          "/admin/reports"
        );

      setReports(
        response.data
      );
    };

  /*
   * Chargement initial directement depuis
   * les API.
   *
   * Les setState arrivent uniquement après
   * les await et non synchroniquement dans
   * le corps du useEffect.
   */
  useEffect(() => {
    let cancelled =
      false;

    void (async () => {
      try {
        const [
          usersResponse,
          gymsResponse,
          sessionsResponse,
          reportsResponse,
        ] =
          await Promise.all([
            api.get(
              "/admin/users"
            ),

            api.get(
              "/admin/gyms"
            ),

            api.get(
              "/admin/sessions"
            ),

            api.get(
              "/admin/reports"
            ),
          ]);

        if (cancelled) {
          return;
        }

        setUsers(
          usersResponse.data
        );

        setGyms(
          gymsResponse.data
        );

        setSessions(
          sessionsResponse.data
        );

        setReports(
          reportsResponse.data
        );

      } catch (error) {
        if (cancelled) {
          return;
        }

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.loadError"
            )
        );

        console.error(
          error
        );

      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    })();

    return () => {
      cancelled =
        true;
    };

  }, [t]);

  /*
   * =========================
   * UTILISATEURS
   * =========================
   */

  const banUser =
    async (user) => {
      const confirmed =
        window.confirm(
          t(
            "admin.banConfirm",
            {
              email:
                user.email,
            }
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/users/${user.id}/ban`
        );

        setMessage(
          t(
            "admin.banned",
            {
              email:
                user.email,
            }
          )
        );

        await Promise.all([
          fetchUsers(),
          fetchSessions(),
          fetchReports(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.banError"
            )
        );

        console.error(
          error
        );
      }
    };

  const unbanUser =
    async (user) => {
      const confirmed =
        window.confirm(
          t(
            "admin.unbanConfirm",
            {
              email:
                user.email,
            }
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/users/${user.id}/unban`
        );

        setMessage(
          t(
            "admin.unbanned",
            {
              email:
                user.email,
            }
          )
        );

        await Promise.all([
          fetchUsers(),
          fetchReports(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.unbanError"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * =========================
   * SALLES
   * =========================
   */

  const saveGym =
    async (event) => {
      event.preventDefault();

      const payload = {
        name:
          gymForm.name.trim(),

        type:
          gymForm.type.trim(),

        address:
          gymForm.address.trim(),

        latitude:
          gymForm.latitude ===
          ""
            ? null
            : Number(
                gymForm.latitude
              ),

        longitude:
          gymForm.longitude ===
          ""
            ? null
            : Number(
                gymForm.longitude
              ),
      };

      try {
        if (
          editingGymId
        ) {
          await api.put(
            `/admin/gyms/${editingGymId}`,
            payload
          );

          setMessage(
            t(
              "admin.gymUpdated"
            )
          );

        } else {
          await api.post(
            "/admin/gyms",
            payload
          );

          setMessage(
            t(
              "admin.gymCreated"
            )
          );
        }

        setGymForm(
          EMPTY_GYM
        );

        setEditingGymId(
          null
        );

        await fetchGyms();

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.gymError"
            )
        );

        console.error(
          error
        );
      }
    };

  const editGym =
    (gym) => {
      setEditingGymId(
        gym.id
      );

      setGymForm({
        name:
          gym.name || "",

        type:
          gym.type || "",

        address:
          gym.address ||
          "",

        latitude:
          gym.latitude ??
          "",

        longitude:
          gym.longitude ??
          "",
      });

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  const cancelGymEdition =
    () => {
      setEditingGymId(
        null
      );

      setGymForm(
        EMPTY_GYM
      );
    };

  const toggleGym =
    async (gym) => {
      const newStatus =
        !gym.active;

      const confirmed =
        window.confirm(
          `${
            newStatus
              ? t(
                  "admin.enable"
                )
              : t(
                  "admin.disable"
                )
          } ${gym.name} ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/gyms/${gym.id}/active`,
          null,
          {
            params: {
              active:
                newStatus,
            },
          }
        );

        setMessage(
          newStatus
            ? t(
                "admin.gymEnabled"
              )
            : t(
                "admin.gymDisabled"
              )
        );

        await fetchGyms();

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.gymStateError"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * =========================
   * SESSIONS
   * =========================
   */

  const cancelSession =
    async (session) => {
      const confirmed =
        window.confirm(
          t(
            "admin.removeSessionConfirm",
            {
              title:
                session.title,
            }
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/sessions/${session.id}/cancel`
        );

        setMessage(
          t(
            "admin.sessionRemoved"
          )
        );

        await Promise.all([
          fetchSessions(),
          fetchReports(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.sessionRemoveError"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * =========================
   * SIGNALEMENTS
   * =========================
   */

  const reviewReport =
    async (report) => {
      try {
        await api.patch(
          `/admin/reports/${report.id}/review`
        );

        setMessage(
          t(
            "admin.reviewSuccess"
          )
        );

        await fetchReports();

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.reviewError"
            )
        );

        console.error(
          error
        );
      }
    };

  const ignoreReport =
    async (report) => {
      const confirmed =
        window.confirm(
          `${t(
            "admin.ignore"
          )} ?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/ignore`
        );

        setMessage(
          t(
            "admin.ignoreSuccess"
          )
        );

        await fetchReports();

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.ignoreError"
            )
        );

        console.error(
          error
        );
      }
    };

  const cancelReportedSession =
    async (report) => {
      const confirmed =
        window.confirm(
          t(
            "admin.removeSessionConfirm",
            {
              title:
                report
                  .targetSessionTitle,
            }
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/cancel-session`
        );

        setMessage(
          t(
            "admin.cancelReportSuccess"
          )
        );

        await Promise.all([
          fetchReports(),
          fetchSessions(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.sessionRemoveError"
            )
        );

        console.error(
          error
        );
      }
    };

  const banReportedUser =
    async (report) => {
      const confirmed =
        window.confirm(
          t(
            "admin.banConfirm",
            {
              email:
                report
                  .targetUserEmail,
            }
          )
        );

      if (!confirmed) {
        return;
      }

      try {
        await api.patch(
          `/admin/reports/${report.id}/ban-user`
        );

        setMessage(
          t(
            "admin.banReportSuccess"
          )
        );

        await Promise.all([
          fetchReports(),
          fetchUsers(),
          fetchSessions(),
        ]);

      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            t(
              "admin.banError"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * =========================
   * FILTRES
   * =========================
   */

  const filteredUsers =
    useMemo(() => {
      const query =
        userSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          user.email
            .toLowerCase()
            .includes(
              query
            )
      );

    }, [
      users,
      userSearch,
    ]);

  const filteredSessions =
    useMemo(() => {
      const query =
        sessionSearch
          .trim()
          .toLowerCase();

      return sessions.filter(
        (session) => {
          const matchesSearch =
            !query ||

            session.title
              .toLowerCase()
              .includes(
                query
              ) ||

            session.activityType
              .toLowerCase()
              .includes(
                query
              ) ||

            session.gymName
              .toLowerCase()
              .includes(
                query
              ) ||

            session.creatorEmail
              .toLowerCase()
              .includes(
                query
              );

          const matchesStatus =
            !sessionStatus ||
            session.status ===
              sessionStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      sessions,
      sessionSearch,
      sessionStatus,
    ]);

  return (
    <main className="content">

      <section className="hero-section">

        <p className="eyebrow">
          {t(
            "admin.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "admin.title"
          )}
        </h2>

        <p>
          {t(
            "admin.description"
          )}
        </p>

      </section>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      <div
        className="nav-tabs"
        style={{
          width:
            "fit-content",

          marginBottom:
            "28px",
        }}
      >

        <button
          className={
            activeTab ===
            "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "users"
            )
          }
        >
          {t(
            "admin.users"
          )}{" "}
          ({users.length})
        </button>

        <button
          className={
            activeTab ===
            "gyms"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "gyms"
            )
          }
        >
          {t(
            "admin.gyms"
          )}{" "}
          ({gyms.length})
        </button>

        <button
          className={
            activeTab ===
            "sessions"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "sessions"
            )
          }
        >
          {t(
            "admin.sessions"
          )}{" "}
          ({sessions.length})
        </button>

        <button
          className={
            activeTab ===
            "reports"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "reports"
            )
          }
        >
          {t(
            "admin.reports"
          )}{" "}
          (
          {
            reports.filter(
              (report) =>
                report.status !==
                "CLOSED"
            ).length
          }
          )
        </button>

      </div>

      {loading ? (

        <section className="session-card">

          <h3>
            {t(
              "common.loading"
            )}
          </h3>

          <p className="description">
            {t(
              "common.loading"
            )}
          </p>

        </section>

      ) : (
        <>

          {activeTab ===
            "users" && (

            <UsersSection
              users={
                filteredUsers
              }
              userSearch={
                userSearch
              }
              setUserSearch={
                setUserSearch
              }
              currentEmail={
                currentEmail
              }
              onBan={
                banUser
              }
              onUnban={
                unbanUser
              }
            />
          )}

          {activeTab ===
            "gyms" && (

            <GymsSection
              gyms={
                gyms
              }
              gymForm={
                gymForm
              }
              setGymForm={
                setGymForm
              }
              editingGymId={
                editingGymId
              }
              onSave={
                saveGym
              }
              onEdit={
                editGym
              }
              onCancelEdit={
                cancelGymEdition
              }
              onToggle={
                toggleGym
              }
            />
          )}

          {activeTab ===
            "sessions" && (

            <SessionsSection
              sessions={
                filteredSessions
              }
              sessionSearch={
                sessionSearch
              }
              setSessionSearch={
                setSessionSearch
              }
              sessionStatus={
                sessionStatus
              }
              setSessionStatus={
                setSessionStatus
              }
              onCancel={
                cancelSession
              }
            />
          )}

          {activeTab ===
            "reports" && (

            <AdminReportsSection
              reports={
                reports
              }
              onReview={
                reviewReport
              }
              onIgnore={
                ignoreReport
              }
              onCancelSession={
                cancelReportedSession
              }
              onBanUser={
                banReportedUser
              }
            />
          )}

        </>
      )}

    </main>
  );
}

function UsersSection({
  users,
  userSearch,
  setUserSearch,
  currentEmail,
  onBan,
  onUnban,
}) {
  const {
    t,
    locale,
  } = useLanguage();

  return (
    <>

      <section className="create-session-form">

        <div className="form-row">

          <label>
            {t(
              "admin.searchUser"
            )}
          </label>

          <input
            type="text"
            placeholder={t(
              "admin.emailPlaceholder"
            )}
            value={
              userSearch
            }
            onChange={(event) =>
              setUserSearch(
                event.target
                  .value
              )
            }
          />

        </div>

      </section>

      <section className="sessions-grid">

        {users.map(
          (user) => {
            const isCurrentAdmin =
              user.email ===
              currentEmail;

            const isAdmin =
              user.role ===
              "ADMIN";

            return (

              <article
                className="session-card"
                key={
                  user.id
                }
              >

                <div className="session-card-header">

                  <span className="badge">
                    {user.role ===
                    "ADMIN"
                      ? t(
                          "admin.administrator"
                        )
                      : t(
                          "common.member"
                        )}
                  </span>

                  <span
                    className="capacity"
                    style={{
                      color:
                        user.banned
                          ? "#dc2626"
                          : "#16a34a",
                    }}
                  >
                    {user.banned
                      ? t(
                          "common.inactive"
                        )
                      : t(
                          "common.active"
                        )}
                  </span>

                </div>

                <h3>
                  {
                    user.email
                  }
                </h3>

                <div className="session-meta">

                  <span>
                    👤{" "}
                    {t(
                      "admin.role"
                    )}
                    :{" "}
                    {user.role ===
                    "ADMIN"
                      ? t(
                          "admin.administrator"
                        )
                      : t(
                          "common.member"
                        )}
                  </span>

                  <span>
                    📅{" "}
                    {t(
                      "admin.registration"
                    )}
                    :{" "}
                    {formatDate(
                      user.createdAt,
                      locale,
                      t
                    )}
                  </span>

                  <span>
                    🕒{" "}
                    {t(
                      "admin.lastLogin"
                    )}
                    :{" "}
                    {user.lastLoginAt
                      ? formatDate(
                          user.lastLoginAt,
                          locale,
                          t
                        )
                      : t(
                          "admin.never"
                        )}
                  </span>

                </div>

                {isCurrentAdmin ? (

                  <button
                    className="secondary-btn"
                    disabled
                  >
                    {t(
                      "admin.yourAccount"
                    )}
                  </button>

                ) : isAdmin ? (

                  <button
                    className="secondary-btn"
                    disabled
                  >
                    {t(
                      "admin.administrator"
                    )}
                  </button>

                ) : user.banned ? (

                  <button
                    className="primary-btn"
                    onClick={() =>
                      onUnban(
                        user
                      )
                    }
                  >
                    {t(
                      "admin.unban"
                    )}
                  </button>

                ) : (

                  <button
                    className="secondary-btn"
                    style={{
                      background:
                        "#fef2f2",

                      color:
                        "#dc2626",
                    }}
                    onClick={() =>
                      onBan(
                        user
                      )
                    }
                  >
                    {t(
                      "admin.ban"
                    )}
                  </button>
                )}

              </article>
            );
          }
        )}

      </section>

    </>
  );
}

function GymsSection({
  gyms,
  gymForm,
  setGymForm,
  editingGymId,
  onSave,
  onEdit,
  onCancelEdit,
  onToggle,
}) {
  const { t } =
    useLanguage();

  return (
    <>

      <form
        className="create-session-form"
        onSubmit={
          onSave
        }
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          {editingGymId
            ? t(
                "admin.editGym"
              )
            : t(
                "admin.addGym"
              )}
        </h3>

        <div className="form-grid">

          <div className="form-row">

            <label>
              {t(
                "admin.name"
              )}
            </label>

            <input
              required
              type="text"
              value={
                gymForm.name
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  name:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "admin.type"
              )}
            </label>

            <input
              required
              type="text"
              placeholder="Fitness, CrossFit..."
              value={
                gymForm.type
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  type:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "admin.latitude"
              )}
            </label>

            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={
                gymForm.latitude
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  latitude:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "admin.longitude"
              )}
            </label>

            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={
                gymForm.longitude
              }
              onChange={(event) =>
                setGymForm({
                  ...gymForm,

                  longitude:
                    event.target
                      .value,
                })
              }
            />

          </div>

        </div>

        <div className="form-row">

          <label>
            {t(
              "admin.address"
            )}
          </label>

          <input
            required
            type="text"
            value={
              gymForm.address
            }
            onChange={(event) =>
              setGymForm({
                ...gymForm,

                address:
                  event.target
                    .value,
              })
            }
          />

        </div>

        <div className="card-actions">

          <button
            className="primary-btn"
            type="submit"
          >
            {editingGymId
              ? t(
                  "admin.saveChanges"
                )
              : t(
                  "admin.add"
                )}
          </button>

          {editingGymId && (

            <button
              className="secondary-btn"
              type="button"
              onClick={
                onCancelEdit
              }
            >
              {t(
                "admin.cancelEdit"
              )}
            </button>
          )}

        </div>

      </form>

      <section className="gyms-grid">

        {gyms.map(
          (gym) => (

            <article
              className="gym-card"
              key={
                gym.id
              }
            >

              <div className="gym-icon">
                📍
              </div>

              <div>

                <h3>
                  {
                    gym.name
                  }
                </h3>

                <p className="activity">
                  {
                    gym.type
                  }
                </p>

                <p className="description">
                  {
                    gym.address
                  }
                </p>

              </div>

              <div className="session-meta">

                <span>
                  {t(
                    "admin.accountState"
                  )}
                  :{" "}
                  {gym.active
                    ? t(
                        "common.active"
                      )
                    : t(
                        "common.inactive"
                      )}
                </span>

                <span>
                  {t(
                    "admin.latitude"
                  )}
                  :{" "}
                  {gym.latitude ??
                    t(
                      "common.unknown"
                    )}
                </span>

                <span>
                  {t(
                    "admin.longitude"
                  )}
                  :{" "}
                  {gym.longitude ??
                    t(
                      "common.unknown"
                    )}
                </span>

              </div>

              <div className="card-actions">

                <button
                  className="secondary-btn"
                  onClick={() =>
                    onEdit(
                      gym
                    )
                  }
                >
                  {t(
                    "admin.edit"
                  )}
                </button>

                <button
                  className="secondary-btn"
                  style={{
                    background:
                      gym.active
                        ? "#fef2f2"
                        : "#f0fdf4",

                    color:
                      gym.active
                        ? "#dc2626"
                        : "#16a34a",
                  }}
                  onClick={() =>
                    onToggle(
                      gym
                    )
                  }
                >
                  {gym.active
                    ? t(
                        "admin.disable"
                      )
                    : t(
                        "admin.enable"
                      )}
                </button>

              </div>

            </article>
          )
        )}

      </section>

    </>
  );
}

function SessionsSection({
  sessions,
  sessionSearch,
  setSessionSearch,
  sessionStatus,
  setSessionStatus,
  onCancel,
}) {
  const {
    t,
    locale,
  } = useLanguage();

  return (
    <>

      <section className="create-session-form">

        <div className="form-grid">

          <div className="form-row">

            <label>
              {t(
                "common.search"
              )}
            </label>

            <input
              type="text"
              placeholder={t(
                "admin.sessionSearch"
              )}
              value={
                sessionSearch
              }
              onChange={(event) =>
                setSessionSearch(
                  event.target
                    .value
                )
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "admin.status"
              )}
            </label>

            <select
              value={
                sessionStatus
              }
              onChange={(event) =>
                setSessionStatus(
                  event.target
                    .value
                )
              }
            >

              <option value="">
                {t(
                  "common.all"
                )}
              </option>

              <option value="UPCOMING">
                {t(
                  "status.UPCOMING"
                )}
              </option>

              <option value="COMPLETED">
                {t(
                  "status.COMPLETED"
                )}
              </option>

              <option value="CANCELLED">
                {t(
                  "status.CANCELLED"
                )}
              </option>

            </select>

          </div>

        </div>

      </section>

      <section className="sessions-grid">

        {sessions.map(
          (session) => (

            <article
              className="session-card"
              key={
                session.id
              }
            >

              <div className="session-card-header">

                <span className="badge">
                  {t(
                    `status.${session.status}`
                  )}
                </span>

                <span className="capacity">
                  {
                    session.participantCount
                  }{" "}
                  /{" "}
                  {
                    session.capacity
                  }
                </span>

              </div>

              <h3>
                {
                  session.title
                }
              </h3>

              <p className="activity">
                {activityLabel(
                  session.activityType,
                  t
                )}
              </p>

              <div className="session-meta">

                <span>
                  📍{" "}
                  {
                    session.gymName
                  }
                </span>

                <span>
                  🕒{" "}
                  {formatDate(
                    session.startAt,
                    locale,
                    t
                  )}
                </span>

                <span>
                  ⏱️{" "}
                  {
                    session.durationMin
                  }{" "}
                  {t(
                    "common.minutes"
                  )}
                </span>

                <span>
                  👤{" "}
                  {t(
                    "admin.creator"
                  )}
                  :{" "}
                  {
                    session.creatorEmail
                  }
                </span>

              </div>

              {session.status ===
              "UPCOMING" ? (

                <button
                  className="secondary-btn"
                  style={{
                    background:
                      "#fef2f2",

                    color:
                      "#dc2626",
                  }}
                  onClick={() =>
                    onCancel(
                      session
                    )
                  }
                >
                  {t(
                    "admin.removeSession"
                  )}
                </button>

              ) : (

                <button
                  className="secondary-btn"
                  disabled
                >
                  {session.status ===
                  "COMPLETED"
                    ? t(
                        "profile.completed"
                      )
                    : t(
                        "profile.cancelled"
                      )}
                </button>
              )}

            </article>
          )
        )}

      </section>

    </>
  );
}

function formatDate(
  value,
  locale,
  t
) {
  if (!value) {
    return t(
      "common.unknown"
    );
  }

  return new Date(
    value
  ).toLocaleString(
    locale,
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

function activityLabel(
  activity,
  t
) {
  const key =
    `activity.${activity}`;

  const translated =
    t(key);

  return translated === key
    ? activity
    : translated;
}