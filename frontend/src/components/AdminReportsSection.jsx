import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CircleCheck,
  Dumbbell,
  Flag,
  History,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useLanguage }
  from "../i18n/LanguageContext";

import "../styles/admin.css";

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
    };

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

            <div className="admin-input-with-icon">

              <Search
                size={16}
              />

              <input
                type="text"
                placeholder={t(
                  "admin.reportSearch"
                )}
                value={
                  search
                }
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="form-row">

            <label>
              {t(
                "admin.status"
              )}
            </label>

            <select
              value={
                status
              }
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

      <div className="admin-list-heading">

        <div>

          <p className="eyebrow">
            {t(
              "admin.reports"
            )}
          </p>

          <strong>
            {t(
              "admin.reportCount",
              {
                count:
                  filteredReports.length,
              }
            )}
          </strong>

        </div>

      </div>

      {filteredReports.length ===
      0 ? (

        <section className="admin-empty-state">

          <Flag
            size={24}
          />

          <h3>
            {t(
              "admin.noReports"
            )}
          </h3>

          <p>
            {t(
              "admin.noReportsDescription"
            )}
          </p>

        </section>

      ) : (

        <section className="admin-cards-grid admin-reports-grid">

          {filteredReports.map(
            (report) => (

              <article
                className="admin-card admin-report-card"
                key={
                  report.id
                }
              >

                <div className="admin-card-header">

                  <span
                    className={`admin-report-status status-${report.status.toLowerCase()}`}
                  >
                    {t(
                      `status.${report.status}`
                    )}
                  </span>

                  <span className="admin-target-badge">

                    {report.targetType ===
                    "USER" ? (
                      <UserRound
                        size={13}
                      />
                    ) : (
                      <Dumbbell
                        size={13}
                      />
                    )}

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

                <div className="admin-report-title">

                  <div className="admin-card-icon report-icon">
                    <Flag
                      size={18}
                    />
                  </div>

                  <div>

                    <h3>
                      {t(
                        `reason.${report.reason}`
                      )}
                    </h3>

                    <p>
                      {report.details ||
                        t(
                          "common.unknown"
                        )}
                    </p>

                  </div>

                </div>

                <div className="admin-meta">

                  <ReportMetaRow
                    icon={
                      UserRound
                    }
                    label={t(
                      "admin.author"
                    )}
                    value={
                      report
                        .reporterEmail
                    }
                  />

                  {report.targetType ===
                    "USER" && (
                    <>

                      <ReportMetaRow
                        icon={
                          UserRound
                        }
                        label={t(
                          "admin.reportedAccount"
                        )}
                        value={
                          report
                            .targetUserEmail
                        }
                      />

                      <ReportMetaRow
                        icon={
                          ShieldCheck
                        }
                        label={t(
                          "admin.accountState"
                        )}
                        value={
                          report
                            .targetUserBanned
                            ? t(
                                "admin.ban"
                              )
                            : t(
                                "common.active"
                              )
                        }
                      />

                      {report
                        .targetSessionTitle && (

                        <ReportMetaRow
                          icon={
                            Dumbbell
                          }
                          label={t(
                            "admin.context"
                          )}
                          value={
                            report
                              .targetSessionTitle
                          }
                        />
                      )}

                    </>
                  )}

                  {report.targetType ===
                    "SESSION" && (
                    <>

                      <ReportMetaRow
                        icon={
                          Dumbbell
                        }
                        label={t(
                          "admin.sessions"
                        )}
                        value={
                          report
                            .targetSessionTitle
                        }
                      />

                      <ReportMetaRow
                        icon={
                          ShieldCheck
                        }
                        label={t(
                          "admin.status"
                        )}
                        value={t(
                          `status.${report.targetSessionStatus}`
                        )}
                      />

                    </>
                  )}

                  <ReportMetaRow
                    icon={
                      CalendarDays
                    }
                    label={t(
                      "admin.createdAt"
                    )}
                    value={formatDate(
                      report.createdAt
                    )}
                  />

                  {report.reviewedAt && (

                    <ReportMetaRow
                      icon={
                        CircleCheck
                      }
                      label={t(
                        "admin.reviewedAt"
                      )}
                      value={formatDate(
                        report.reviewedAt
                      )}
                    />
                  )}

                  {report.reviewedByEmail && (

                    <ReportMetaRow
                      icon={
                        ShieldCheck
                      }
                      label={t(
                        "admin.admin"
                      )}
                      value={
                        report
                          .reviewedByEmail
                      }
                    />
                  )}

                </div>

                {report.actions?.length >
                  0 && (

                  <div className="admin-history">

                    <div className="admin-history-title">

                      <History
                        size={15}
                      />

                      <strong>
                        {t(
                          "admin.history"
                        )}
                      </strong>

                    </div>

                    <div className="admin-history-list">

                      {report.actions.map(
                        (action) => (

                          <div
                            className="admin-history-item"
                            key={
                              action.id
                            }
                          >

                            <strong>
                              {t(
                                `action.${action.actionType}`
                              )}
                            </strong>

                            <span>
                              {
                                action.adminEmail
                              }
                            </span>

                            <time>
                              {formatDate(
                                action.createdAt
                              )}
                            </time>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

                <div className="admin-card-actions">

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
                          className="admin-danger-btn"
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
                        !report
                          .targetUserBanned && (

                        <button
                          className="admin-danger-btn"
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

function ReportMetaRow({
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