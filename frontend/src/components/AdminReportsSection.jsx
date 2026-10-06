import {
  useMemo,
  useState,
} from "react";

export default function AdminReportsSection({
  reports,
  onReview,
  onIgnore,
  onCancelSession,
  onBanUser,
}) {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

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

  return (
    <>
      <section className="create-session-form">

        <div className="form-grid">

          <div className="form-row">
            <label>
              Recherche
            </label>

            <input
              type="text"
              placeholder="Membre, session, motif..."
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
              Statut
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
                Tous
              </option>

              <option value="OPEN">
                OPEN
              </option>

              <option value="REVIEWED">
                REVIEWED
              </option>

              <option value="CLOSED">
                CLOSED
              </option>
            </select>
          </div>

        </div>

      </section>

      <p className="empty-text">
        {filteredReports.length} signalement(s)
      </p>

      {filteredReports.length ===
      0 ? (
        <section className="session-card">
          <h3>
            Aucun signalement
          </h3>

          <p className="description">
            Aucun signalement ne correspond
            aux filtres sélectionnés.
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
                    {
                      report.status
                    }
                  </span>

                  <span className="capacity">
                    {report.targetType ===
                    "USER"
                      ? "UTILISATEUR"
                      : "SESSION"}
                  </span>

                </div>

                <h3>
                  {reasonLabel(
                    report.reason
                  )}
                </h3>

                <p className="description">
                  {report.details ||
                    "Aucun détail supplémentaire."}
                </p>

                <div className="session-meta">

                  <span>
                    🚩 Auteur :{" "}
                    {
                      report.reporterEmail
                    }
                  </span>

                  {report.targetType ===
                    "USER" && (
                    <>
                      <span>
                        👤 Compte signalé :{" "}
                        {
                          report.targetUserEmail
                        }
                      </span>

                      <span>
                        État :{" "}
                        {report.targetUserBanned
                          ? "Banni"
                          : "Actif"}
                      </span>

                      {report.targetSessionTitle && (
                        <span>
                          🏋️ Contexte :{" "}
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
                        🏋️ Session :{" "}
                        {
                          report.targetSessionTitle
                        }
                      </span>

                      <span>
                        Statut session :{" "}
                        {
                          report.targetSessionStatus
                        }
                      </span>
                    </>
                  )}

                  <span>
                    📅 Créé :{" "}
                    {formatDate(
                      report.createdAt
                    )}
                  </span>

                  {report.reviewedAt && (
                    <span>
                      🔎 Pris en charge :{" "}
                      {formatDate(
                        report.reviewedAt
                      )}
                    </span>
                  )}

                  {report.reviewedByEmail && (
                    <span>
                      🛡️ Admin :{" "}
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
                      Historique
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
                          {actionLabel(
                            action.actionType
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
                      Prendre en charge
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
                        Ignorer / fermer
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
                          Retirer la session
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
                          Bannir le membre
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
                      Traitement terminé
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

function reasonLabel(
  reason
) {
  switch (reason) {
    case "SPAM":
      return "Spam";

    case "INAPPROPRIATE_CONTENT":
      return "Contenu inapproprié";

    case "HARASSMENT":
      return "Harcèlement";

    case "DANGEROUS_BEHAVIOR":
      return "Comportement dangereux";

    case "FALSE_INFORMATION":
      return "Informations trompeuses";

    case "OTHER":
      return "Autre";

    default:
      return reason;
  }
}

function actionLabel(
  actionType
) {
  switch (actionType) {
    case "MARK_REVIEWED":
      return "Signalement pris en charge";

    case "IGNORE_REPORT":
      return "Signalement fermé sans sanction";

    case "CANCEL_SESSION":
      return "Session retirée";

    case "BAN_USER":
      return "Utilisateur banni";

    default:
      return actionType;
  }
}

function formatDate(
  value
) {
  if (!value) {
    return "Inconnue";
  }

  return new Date(
    value
  ).toLocaleString(
    "fr-BE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}