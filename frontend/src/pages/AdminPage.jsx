import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  CalendarDays,
  Dumbbell,
  Flag,
  MapPin,
  Navigation,
  ShieldCheck,
  UserRound,
  UsersRound,
  Warehouse,
} from "lucide-react";

import api
  from "../api/axios";

import AdminReportsSection
  from "../components/AdminReportsSection";

import { useLanguage }
  from "../i18n/LanguageContext";

import "../styles/admin.css";

const EMPTY_GYM = {
  name: "",
  type: "",
  address: "",
  latitude: "",
  longitude: "",
};

function isDeletedAccount(
  email
) {
  return (
    typeof email ===
      "string" &&
    email.startsWith(
      "deleted+"
    ) &&
    email.endsWith(
      "@trainbuddy.invalid"
    )
  );
}

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
        if (!cancelled) {
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

  const banUser =
    async (user) => {
      if (
        isDeletedAccount(
          user.email
        )
      ) {
        return;
      }

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
      if (
        isDeletedAccount(
          user.email
        )
      ) {
        return;
      }

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
        if (editingGymId) {
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
          gym.address || "",

        latitude:
          gym.latitude ?? "",

        longitude:
          gym.longitude ?? "",
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
      if (
        isDeletedAccount(
          report
            .targetUserEmail
        )
      ) {
        return;
      }

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
        (user) => {
          const deleted =
            isDeletedAccount(
              user.email
            );

          const searchable =
            deleted
              ? t(
                  "admin.deletedAccount"
                )
              : user.email;

          return searchable
            .toLowerCase()
            .includes(
              query
            );
        }
      );

    }, [
      users,
      userSearch,
      t,
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
              ?.toLowerCase()
              .includes(
                query
              ) ||
            session.activityType
              ?.toLowerCase()
              .includes(
                query
              ) ||
            session.gymName
              ?.toLowerCase()
              .includes(
                query
              ) ||
            session.creatorEmail
              ?.toLowerCase()
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

  const openReportsCount =
    reports.filter(
      (report) =>
        report.status !==
        "CLOSED"
    ).length;

  const tabs = [
    {
      id: "users",
      label:
        t(
          "admin.users"
        ),
      count:
        users.length,
      icon:
        UsersRound,
    },
    {
      id: "gyms",
      label:
        t(
          "admin.gyms"
        ),
      count:
        gyms.length,
      icon:
        Warehouse,
    },
    {
      id: "sessions",
      label:
        t(
          "admin.sessions"
        ),
      count:
        sessions.length,
      icon:
        Dumbbell,
    },
    {
      id: "reports",
      label:
        t(
          "admin.reports"
        ),
      count:
        openReportsCount,
      icon:
        Flag,
    },
  ];

  return (
    <main className="content admin-page">

      <section className="hero-section admin-hero">

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

      <div className="nav-tabs admin-tabs">

        {tabs.map(
          (tab) => {
            const Icon =
              tab.icon;

            return (
              <button
                key={
                  tab.id
                }
                type="button"
                className={
                  activeTab ===
                  tab.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
              >

                <Icon
                  size={16}
                />

                <span>
                  {tab.label}
                </span>

                <span className="admin-tab-count">
                  {tab.count}
                </span>

              </button>
            );
          }
        )}

      </div>

      {loading ? (

        <section className="admin-empty-state">

          <ShieldCheck
            size={24}
          />

          <h3>
            {t(
              "common.loading"
            )}
          </h3>

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

      <section className="admin-filter-panel">

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
                event.target.value
              )
            }
          />

        </div>

      </section>

      {users.length === 0 ? (

        <AdminEmptyState
          icon={UserRound}
          title={t(
            "admin.users"
          )}
        />

      ) : (

        <section className="admin-cards-grid">

          {users.map(
            (user) => {
              const deleted =
                isDeletedAccount(
                  user.email
                );

              const isCurrentAdmin =
                !deleted &&
                user.email ===
                  currentEmail;

              const isAdmin =
                user.role ===
                "ADMIN";

              return (
                <article
                  className={`admin-card${
                    deleted
                      ? " deleted-account"
                      : ""
                  }`}
                  key={
                    user.id
                  }
                >

                  <div className="admin-card-header">

                    <span className="admin-role-badge">

                      <ShieldCheck
                        size={13}
                      />

                      {isAdmin
                        ? t(
                            "admin.administrator"
                          )
                        : t(
                            "common.member"
                          )}

                    </span>

                    {deleted ? (

                      <span className="admin-status-badge deleted">

                        <span className="admin-status-dot" />

                        {t(
                          "admin.deleted"
                        )}

                      </span>

                    ) : (

                      <StatusBadge
                        active={
                          !user.banned
                        }
                        activeLabel={t(
                          "common.active"
                        )}
                        inactiveLabel={t(
                          "common.inactive"
                        )}
                      />
                    )}

                  </div>

                  <div className="admin-card-title">

                    <div className="admin-card-icon">

                      <UserRound
                        size={19}
                      />

                    </div>

                    <div>

                      <h3>
                        {deleted
                          ? t(
                              "admin.deletedAccount"
                            )
                          : user.email}
                      </h3>

                      <p>
                        {deleted
                          ? t(
                              "admin.formerMember"
                            )
                          : isAdmin
                          ? t(
                              "admin.administrator"
                            )
                          : t(
                              "common.member"
                            )}
                      </p>

                    </div>

                  </div>

                  <div className="admin-meta">

                    <MetaRow
                      icon={
                        CalendarDays
                      }
                      label={t(
                        "admin.registration"
                      )}
                      value={formatDate(
                        user.createdAt,
                        locale,
                        t
                      )}
                    />

                    <MetaRow
                      icon={
                        CalendarClock
                      }
                      label={t(
                        "admin.lastLogin"
                      )}
                      value={
                        deleted
                          ? "—"
                          : user.lastLoginAt
                          ? formatDate(
                              user.lastLoginAt,
                              locale,
                              t
                            )
                          : t(
                              "admin.never"
                            )
                      }
                    />

                  </div>

                  <div className="admin-card-actions">

                    {deleted ? (

                      <button
                        className="secondary-btn"
                        disabled
                      >
                        {t(
                          "admin.deletedAccountAction"
                        )}
                      </button>

                    ) : isCurrentAdmin ? (

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
                        className="admin-success-btn"
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
                        className="admin-danger-btn"
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

                  </div>

                </article>
              );
            }
          )}

        </section>
      )}

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
        className="admin-form-card"
        onSubmit={
          onSave
        }
      >

        <div className="admin-section-heading">

          <div className="admin-section-icon">
            <Warehouse
              size={19}
            />
          </div>

          <div>

            <h3>
              {editingGymId
                ? t(
                    "admin.editGym"
                  )
                : t(
                    "admin.addGym"
                  )}
            </h3>

            <p>
              {t(
                "admin.gyms"
              )}
            </p>

          </div>

        </div>

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

        <div className="admin-form-actions">

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

      {gyms.length === 0 ? (

        <AdminEmptyState
          icon={Warehouse}
          title={t(
            "admin.gyms"
          )}
        />

      ) : (

        <section className="admin-cards-grid">

          {gyms.map(
            (gym) => (

              <article
                className="admin-card"
                key={
                  gym.id
                }
              >

                <div className="admin-card-header">

                  <div className="admin-card-icon">
                    <MapPin
                      size={19}
                    />
                  </div>

                  <StatusBadge
                    active={
                      gym.active
                    }
                    activeLabel={t(
                      "common.active"
                    )}
                    inactiveLabel={t(
                      "common.inactive"
                    )}
                  />

                </div>

                <div className="admin-card-title admin-card-title-simple">

                  <div>

                    <h3>
                      {
                        gym.name
                      }
                    </h3>

                    <p>
                      {
                        gym.type
                      }
                    </p>

                  </div>

                </div>

                <p className="admin-card-description">
                  {
                    gym.address
                  }
                </p>

                <div className="admin-meta admin-meta-compact">

                  <MetaRow
                    icon={
                      Navigation
                    }
                    label={t(
                      "admin.latitude"
                    )}
                    value={
                      gym.latitude ??
                      t(
                        "common.unknown"
                      )
                    }
                  />

                  <MetaRow
                    icon={
                      Navigation
                    }
                    label={t(
                      "admin.longitude"
                    )}
                    value={
                      gym.longitude ??
                      t(
                        "common.unknown"
                      )
                    }
                  />

                </div>

                <div className="admin-card-actions admin-card-actions-split">

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
                    className={
                      gym.active
                        ? "admin-danger-btn"
                        : "admin-success-btn"
                    }
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
      )}

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

      <section className="admin-filter-panel">

        <div className="admin-filter-grid">

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
                  event.target.value
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
                  event.target.value
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

      {sessions.length === 0 ? (

        <AdminEmptyState
          icon={Dumbbell}
          title={t(
            "admin.sessions"
          )}
        />

      ) : (

        <section className="admin-cards-grid">

          {sessions.map(
            (session) => (

              <article
                className="admin-card"
                key={
                  session.id
                }
              >

                <div className="admin-card-header">

                  <span className="badge">
                    {t(
                      `status.${session.status}`
                    )}
                  </span>

                  <span className="admin-participant-count">

                    <UsersRound
                      size={14}
                    />

                    {
                      session
                        .participantCount
                    }
                    {" / "}
                    {
                      session.capacity
                    }

                  </span>

                </div>

                <div className="admin-card-title">

                  <div className="admin-card-icon">
                    <Dumbbell
                      size={19}
                    />
                  </div>

                  <div>

                    <h3>
                      {
                        session.title
                      }
                    </h3>

                    <p>
                      {activityLabel(
                        session.activityType,
                        t
                      )}
                    </p>

                  </div>

                </div>

                <div className="admin-meta">

                  <MetaRow
                    icon={
                      MapPin
                    }
                    label={t(
                      "sessions.gym"
                    )}
                    value={
                      session.gymName
                    }
                  />

                  <MetaRow
                    icon={
                      CalendarClock
                    }
                    label={t(
                      "sessions.date"
                    )}
                    value={formatDate(
                      session.startAt,
                      locale,
                      t
                    )}
                  />

                  <MetaRow
                    icon={
                      UserRound
                    }
                    label={t(
                      "admin.creator"
                    )}
                    value={
                      isDeletedAccount(
                        session
                          .creatorEmail
                      )
                        ? t(
                            "admin.deletedAccount"
                          )
                        : session
                            .creatorEmail
                    }
                  />

                </div>

                <div className="admin-card-actions">

                  {session.status ===
                  "UPCOMING" ? (

                    <button
                      className="admin-danger-btn"
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

                </div>

              </article>
            )
          )}

        </section>
      )}

    </>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="admin-meta-row">

      <Icon
        size={15}
      />

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}) {
  return (
    <span
      className={
        active
          ? "admin-status-badge"
          : "admin-status-badge inactive"
      }
    >

      <span className="admin-status-dot" />

      {active
        ? activeLabel
        : inactiveLabel}

    </span>
  );
}

function AdminEmptyState({
  icon: Icon,
  title,
}) {
  return (
    <section className="admin-empty-state">

      <Icon
        size={24}
      />

      <h3>
        {title}
      </h3>

    </section>
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