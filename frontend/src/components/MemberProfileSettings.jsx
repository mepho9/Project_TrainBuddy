import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api
  from "../api/axios";

import { useLanguage }
  from "../i18n/LanguageContext";

const ACTIVITIES = [
  "Musculation",
  "Cardio",
  "Crossfit",
  "Fitness",
  "HIIT",
  "Mobilité",
];

const EMPTY_PROFILE = {
  sportsPreferences: [],
  goals: "",
  availability: "",
  preferredLanguage: "fr",
  favoriteGyms: [],
};

export default function MemberProfileSettings({
  onLogout,
  section = "preferences",
}) {
  const {
    t,
    setLanguage,
  } = useLanguage();

  const [
    profile,
    setProfile,
  ] = useState(
    EMPTY_PROFILE
  );

  const [
    gyms,
    setGyms,
  ] = useState([]);

  const [
    selectedGymId,
    setSelectedGymId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(
    section ===
    "preferences"
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  /*
   * Les données du profil ne sont chargées
   * que pour l'onglet Préférences.
   *
   * L'onglet Compte n'a pas besoin
   * d'appels réseau au chargement.
   */
  useEffect(() => {

    if (
      section !==
      "preferences"
    ) {
      return undefined;
    }

    let cancelled =
      false;

    void (async () => {

      try {
        const [
          profileResponse,
          gymsResponse,
        ] =
          await Promise.all([
            api.get(
              "/profile/me"
            ),

            api.get(
              "/gyms"
            ),
          ]);

        if (cancelled) {
          return;
        }

        setProfile(
          profileResponse.data
        );

        setGyms(
          gymsResponse.data
        );

        /*
         * La préférence sauvegardée en DB
         * devient aussi la langue active.
         */
        if (
          profileResponse
            .data
            .preferredLanguage
        ) {
          setLanguage(
            profileResponse
              .data
              .preferredLanguage
          );
        }

        setMessage("");

      } catch (error) {

        if (cancelled) {
          return;
        }

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "memberProfile.loadError"
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

  }, [
    section,
    setLanguage,
    t,
  ]);

  const favoriteIds =
    useMemo(
      () =>
        new Set(
          profile.favoriteGyms.map(
            (gym) =>
              gym.id
          )
        ),

      [
        profile.favoriteGyms,
      ]
    );

  const availableGyms =
    useMemo(
      () =>
        gyms.filter(
          (gym) =>
            !favoriteIds.has(
              gym.id
            )
        ),

      [
        gyms,
        favoriteIds,
      ]
    );

  const toggleSport =
    (activity) => {

      setProfile(
        (current) => {

          const selected =
            current
              .sportsPreferences
              .includes(
                activity
              );

          return {
            ...current,

            sportsPreferences:
              selected
                ? current
                    .sportsPreferences
                    .filter(
                      (value) =>
                        value !==
                        activity
                    )
                : [
                    ...current
                      .sportsPreferences,

                    activity,
                  ],
          };
        }
      );
    };

  const saveProfile =
    async (event) => {

      event.preventDefault();

      setMessage("");

      try {
        const response =
          await api.put(
            "/profile/me",
            {
              sportsPreferences:
                profile
                  .sportsPreferences,

              goals:
                profile.goals,

              availability:
                profile.availability,

              preferredLanguage:
                profile
                  .preferredLanguage,
            }
          );

        setProfile(
          response.data
        );

        setLanguage(
          response.data
            .preferredLanguage
        );

        setMessage(
          t(
            "memberProfile.saved"
          )
        );

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "memberProfile.saveError"
            )
        );

        console.error(
          error
        );
      }
    };

  const addFavorite =
    async () => {

      if (!selectedGymId) {
        return;
      }

      setMessage("");

      try {
        const response =
          await api.post(
            `/profile/favorites/${selectedGymId}`
          );

        setProfile(
          response.data
        );

        setSelectedGymId(
          ""
        );

        setMessage(
          t(
            "memberProfile.favoriteAdded"
          )
        );

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "memberProfile.favoriteError"
            )
        );

        console.error(
          error
        );
      }
    };

  const removeFavorite =
    async (
      gymId
    ) => {

      setMessage("");

      try {
        const response =
          await api.delete(
            `/profile/favorites/${gymId}`
          );

        setProfile(
          response.data
        );

        setMessage(
          t(
            "memberProfile.favoriteRemoved"
          )
        );

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "memberProfile.favoriteError"
            )
        );

        console.error(
          error
        );
      }
    };

  const changePassword =
    async (event) => {

      event.preventDefault();

      setMessage("");

      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {

        setMessage(
          t(
            "accountSecurity.passwordMismatch"
          )
        );

        return;
      }

      try {
        await api.patch(
          "/profile/password",
          {
            currentPassword:
              passwordForm
                .currentPassword,

            newPassword:
              passwordForm
                .newPassword,
          }
        );

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setMessage(
          t(
            "accountSecurity.passwordChanged"
          )
        );

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "accountSecurity.passwordError"
            )
        );

        console.error(
          error
        );
      }
    };

  const deleteAccount =
    async () => {

      if (!deletePassword) {
        return;
      }

      const confirmed =
        window.confirm(
          t(
            "accountDelete.confirm"
          )
        );

      if (!confirmed) {
        return;
      }

      setMessage("");

      try {
        await api.delete(
          "/profile/me",
          {
            data: {
              currentPassword:
                deletePassword,
            },
          }
        );

        onLogout();

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
            t(
              "accountDelete.error"
            )
        );

        console.error(
          error
        );
      }
    };

  /*
   * =========================
   * ONGLET PRÉFÉRENCES
   * =========================
   */
  if (
    section ===
    "preferences"
  ) {

    if (loading) {
      return (
        <section className="session-card">

          <h3>
            {t(
              "memberProfile.loading"
            )}
          </h3>

        </section>
      );
    }

    return (
      <>

        {message && (
          <div className="page-message">
            {message}
          </div>
        )}

        <section
          className="session-card"
          style={{
            marginBottom:
              "24px",
          }}
        >

          <p className="eyebrow">
            {t(
              "memberProfile.eyebrow"
            )}
          </p>

          <h2>
            {t(
              "memberProfile.title"
            )}
          </h2>

          <p className="description">
            {t(
              "memberProfile.description"
            )}
          </p>

        </section>

        <form
          className="create-session-form"
          onSubmit={
            saveProfile
          }
        >

          <div className="form-row">

            <label>
              {t(
                "memberProfile.sports"
              )}
            </label>

            <p className="description">
              {t(
                "memberProfile.sportsHelp"
              )}
            </p>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(170px, 1fr))",

                gap:
                  "10px",
              }}
            >

              {ACTIVITIES.map(
                (activity) => (

                  <label
                    key={
                      activity
                    }
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        "10px",

                      padding:
                        "12px",

                      border:
                        "1px solid #dbe4f0",

                      borderRadius:
                        "12px",

                      cursor:
                        "pointer",
                    }}
                  >

                    <input
                      type="checkbox"
                      checked={
                        profile
                          .sportsPreferences
                          .includes(
                            activity
                          )
                      }
                      onChange={() =>
                        toggleSport(
                          activity
                        )
                      }
                      style={{
                        width:
                          "auto",
                      }}
                    />

                    {t(
                      `activity.${activity}`
                    )}

                  </label>
                )
              )}

            </div>

          </div>

          <div className="form-row">

            <label>
              {t(
                "memberProfile.goals"
              )}
            </label>

            <textarea
              maxLength={255}
              placeholder={t(
                "memberProfile.goalsPlaceholder"
              )}
              value={
                profile.goals
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  goals:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "memberProfile.availability"
              )}
            </label>

            <textarea
              maxLength={255}
              placeholder={t(
                "memberProfile.availabilityPlaceholder"
              )}
              value={
                profile.availability
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  availability:
                    event.target
                      .value,
                })
              }
            />

          </div>

          <div className="form-row">

            <label>
              {t(
                "memberProfile.language"
              )}
            </label>

            <select
              value={
                profile
                  .preferredLanguage
              }
              onChange={(event) =>
                setProfile({
                  ...profile,

                  preferredLanguage:
                    event.target
                      .value,
                })
              }
            >

              <option value="fr">
                Français
              </option>

              <option value="en">
                English
              </option>

              <option value="nl">
                Nederlands
              </option>

            </select>

          </div>

          <button
            className="primary-btn"
            type="submit"
          >
            {t(
              "memberProfile.save"
            )}
          </button>

        </form>

        <section
          className="session-card"
          style={{
            marginTop:
              "28px",
          }}
        >

          <p className="eyebrow">
            {t(
              "memberProfile.favorites"
            )}
          </p>

          <h3>
            {t(
              "memberProfile.favorites"
            )}
          </h3>

          <p className="description">
            {t(
              "memberProfile.favoritesHelp"
            )}
          </p>

          <div
            className="form-grid"
            style={{
              marginTop:
                "18px",
            }}
          >

            <div className="form-row">

              <label>
                {t(
                  "memberProfile.chooseGym"
                )}
              </label>

              <select
                value={
                  selectedGymId
                }
                onChange={(event) =>
                  setSelectedGymId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  {t(
                    "memberProfile.chooseGym"
                  )}
                </option>

                {availableGyms.map(
                  (gym) => (

                    <option
                      key={
                        gym.id
                      }
                      value={
                        gym.id
                      }
                    >
                      {gym.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "end",
              }}
            >

              <button
                className="primary-btn"
                type="button"
                disabled={
                  !selectedGymId
                }
                onClick={
                  addFavorite
                }
              >
                {t(
                  "memberProfile.addFavorite"
                )}
              </button>

            </div>

          </div>

          {profile.favoriteGyms
            .length ===
          0 ? (

            <p
              className="empty-text"
              style={{
                marginTop:
                  "20px",
              }}
            >
              {t(
                "memberProfile.noFavorites"
              )}
            </p>

          ) : (

            <div
              className="gyms-grid"
              style={{
                marginTop:
                  "20px",
              }}
            >

              {profile.favoriteGyms.map(
                (gym) => (

                  <article
                    className="gym-card"
                    key={
                      gym.id
                    }
                  >

                    <div className="gym-icon">
                      ⭐
                    </div>

                    <div>

                      <h3>
                        {gym.name}
                      </h3>

                      <p className="activity">
                        {gym.type}
                      </p>

                      <p className="description">
                        {gym.address}
                      </p>

                    </div>

                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() =>
                        removeFavorite(
                          gym.id
                        )
                      }
                    >
                      {t(
                        "memberProfile.removeFavorite"
                      )}
                    </button>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </>
    );
  }

  /*
   * =========================
   * ONGLET COMPTE
   * =========================
   */
  return (
    <>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      <section
        className="create-session-form"
        style={{
          marginBottom:
            "28px",
        }}
      >

        <p className="eyebrow">
          {t(
            "accountSecurity.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "accountSecurity.title"
          )}
        </h2>

        <form
          onSubmit={
            changePassword
          }
        >

          <div className="form-grid">

            <div className="form-row">

              <label>
                {t(
                  "accountSecurity.currentPassword"
                )}
              </label>

              <input
                type="password"
                required
                value={
                  passwordForm
                    .currentPassword
                }
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,

                    currentPassword:
                      event.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-row">

              <label>
                {t(
                  "accountSecurity.newPassword"
                )}
              </label>

              <input
                type="password"
                minLength={6}
                required
                value={
                  passwordForm
                    .newPassword
                }
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,

                    newPassword:
                      event.target
                        .value,
                  })
                }
              />

            </div>

            <div className="form-row">

              <label>
                {t(
                  "accountSecurity.confirmPassword"
                )}
              </label>

              <input
                type="password"
                minLength={6}
                required
                value={
                  passwordForm
                    .confirmPassword
                }
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,

                    confirmPassword:
                      event.target
                        .value,
                  })
                }
              />

            </div>

          </div>

          <button
            className="primary-btn"
            type="submit"
          >
            {t(
              "accountSecurity.changePassword"
            )}
          </button>

        </form>

      </section>

      <section
        className="session-card"
        style={{
          border:
            "1px solid #fecaca",
        }}
      >

        <p
          className="eyebrow"
          style={{
            color:
              "#dc2626",
          }}
        >
          {t(
            "accountDelete.eyebrow"
          )}
        </p>

        <h2>
          {t(
            "accountDelete.title"
          )}
        </h2>

        <p className="description">
          {t(
            "accountDelete.description"
          )}
        </p>

        <p className="description">
          {t(
            "accountDelete.subscription"
          )}
        </p>

        <div className="form-row">

          <label>
            {t(
              "accountDelete.password"
            )}
          </label>

          <input
            type="password"
            value={
              deletePassword
            }
            onChange={(event) =>
              setDeletePassword(
                event.target.value
              )
            }
          />

        </div>

        <button
          className="secondary-btn"
          type="button"
          disabled={
            !deletePassword
          }
          style={{
            color:
              "#dc2626",

            background:
              "#fef2f2",
          }}
          onClick={
            deleteAccount
          }
        >
          {t(
            "accountDelete.button"
          )}
        </button>

      </section>

    </>
  );
}