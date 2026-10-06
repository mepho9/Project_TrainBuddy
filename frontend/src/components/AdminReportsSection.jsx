import {
  useMemo,
  useState,
} from "react";

import { useLanguage }
  from "../i18n/LanguageContext";

export default function AdminReportsSection({
  reports,
  onReview,
  onIgnore,
  onCancelSession,
  onBanUser,
}) {
  const {
    t,
    locale,
  } = useLanguage();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const filteredReports =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {
          const searchable =
            [
              report.reporterEmail,
              report.targetUserEmail,
              report.targetSessionTitle,
              report.reason,
              report.details,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesStatus =
            !status ||
            report.status ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      reports,
      search,
      status,
    ]);

  const formatDate =
    (value) => {
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
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    };

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
                "admin.reportSearch"
              )}
              value={search}
              onChange={(event) =>
                setSearch(
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
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >

              <option value="">
                {t(
                  "common.all"
                )}
              </option>

              <option value="OPEN">
                {t(
                  "status.OPEN"
                )}
              </option>

              <option value="REVIEWED">
                {t(
                  "status.REVIEWED"
                )}
              </option>

              <option value="CLOSED">
                {t(
                  "status.CLOSED"
                )}
              </option>

            </select>

          </div>

        </div>

      </section>

      <p className="empty-text">
        {t(
          "admin.reportCount",
          {
            count:
              filteredReports.length,
          }
        )}
      </p>

      {filteredReports.length ===
      0 ? (

        <section className="session-card">

          <h3>
            {t(
              "admin.noReports"
            )}
          </h3>

          <p className="description">
            {t(
              "admin.noReportsDescription"
            )}
          </p>

        </section>

      ) : (

        <section className="sessions-grid">

          {filteredReports.map(
            (report) => (

              <article
                className="session-card"
                key={report.id}
              >

                <div className="session-card-header">

                  <span className="badge">
                    {t(
                      `status.${report.status}`
                    )}
                  </span>

                  <span className="capacity">
                    {report.targetType ===
                    "USER"
                      ? t(
                          "admin.users"
                        )
                      : t(
                          "admin.sessions"
                        )}
                  </span>

                </div>

                <h3>
                  {t(
                    `reason.${report.reason}`
                  )}
                </h3>

                <p className="description">
                  {report.details ||
                    "—"}
                </p>

                <div className="session-meta">

                  <span>
                    🚩{" "}
                    {t(
                      "admin.author"
                    )}
                    :{" "}
                    {
                      report.reporterEmail
                    }
                  </span>

                  {report.targetType ===
                    "USER" && (
                    <>
                      <span>
                        👤{" "}
                        {t(
                          "admin.reportedAccount"
                        )}
                        :{" "}
                        {
                          report.targetUserEmail
                        }
                      </span>

                      <span>
                        {t(
                          "admin.accountState"
                        )}
                        :{" "}
                        {report.targetUserBanned
                          ? t(
                              "admin.ban"
                            )
                          : t(
                              "common.active"
                            )}
                      </span>

                      {report.targetSessionTitle && (
                        <span>
                          🏋️{" "}
                          {t(
                            "admin.context"
                          )}
                          :{" "}
                          {
                            report.targetSessionTitle
                          }
                        </span>
                      )}
                    </>
                  )}

                  {report.targetType ===
                    "SESSION" && (
                    <>
                      <span>
                        🏋️{" "}
                        {
                          report.targetSessionTitle
                        }
                      </span>

                      <span>
                        {t(
                          "admin.status"
                        )}
                        :{" "}
                        {t(
                          `status.${report.targetSessionStatus}`
                        )}
                      </span>
                    </>
                  )}

                  <span>
                    📅{" "}
                    {t(
                      "admin.createdAt"
                    )}
                    :{" "}
                    {formatDate(
                      report.createdAt
                    )}
                  </span>

                  {report.reviewedAt && (
                    <span>
                      🔎{" "}
                      {t(
                        "admin.reviewedAt"
                      )}
                      :{" "}
                      {formatDate(
                        report.reviewedAt
                      )}
                    </span>
                  )}

                  {report.reviewedByEmail && (
                    <span>
                      🛡️{" "}
                      {t(
                        "admin.admin"
                      )}
                      :{" "}
                      {
                        report.reviewedByEmail
                      }
                    </span>
                  )}

                </div>

                {report.actions?.length >
                  0 && (

                  <div
                    style={{
                      marginTop:
                        "18px",
                      padding:
                        "14px",
                      background:
                        "#f8fafc",
                      borderRadius:
                        "12px",
                    }}
                  >

                    <strong>
                      {t(
                        "admin.history"
                      )}
                    </strong>

                    {report.actions.map(
                      (action) => (

                        <p
                          key={
                            action.id
                          }
                          style={{
                            margin:
                              "8px 0 0",
                          }}
                        >
                          {t(
                            `action.${action.actionType}`
                          )}
                          {" — "}
                          {
                            action.adminEmail
                          }
                          {" — "}
                          {formatDate(
                            action.createdAt
                          )}
                        </p>
                      )
                    )}

                  </div>
                )}

                <div
                  className="card-actions"
                  style={{
                    marginTop:
                      "18px",
                  }}
                >

                  {report.status ===
                    "OPEN" && (

                    <button
                      className="primary-btn"
                      onClick={() =>
                        onReview(
                          report
                        )
                      }
                    >
                      {t(
                        "admin.review"
                      )}
                    </button>
                  )}

                  {report.status ===
                    "REVIEWED" && (
                    <>
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          onIgnore(
                            report
                          )
                        }
                      >
                        {t(
                          "admin.ignore"
                        )}
                      </button>

                      {report.targetType ===
                        "SESSION" &&
                        report.targetSessionStatus ===
                          "UPCOMING" && (

                        <button
                          className="secondary-btn"
                          style={{
                            color:
                              "#dc2626",
                            background:
                              "#fef2f2",
                          }}
                          onClick={() =>
                            onCancelSession(
                              report
                            )
                          }
                        >
                          {t(
                            "admin.removeSession"
                          )}
                        </button>
                      )}

                      {report.targetType ===
                        "USER" &&
                        !report.targetUserBanned && (

                        <button
                          className="secondary-btn"
                          style={{
                            color:
                              "#dc2626",
                            background:
                              "#fef2f2",
                          }}
                          onClick={() =>
                            onBanUser(
                              report
                            )
                          }
                        >
                          {t(
                            "admin.banMember"
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {report.status ===
                    "CLOSED" && (

                    <button
                      className="secondary-btn"
                      disabled
                    >
                      {t(
                        "admin.treatmentFinished"
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