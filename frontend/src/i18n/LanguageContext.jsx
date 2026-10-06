/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import translations
  from "./translations";

const LanguageContext =
  createContext(null);

const SUPPORTED_LANGUAGES = [
  "fr",
  "en",
  "nl",
];

function getInitialLanguage() {
  const savedLanguage =
    localStorage.getItem(
      "trainbuddyLanguage"
    );

  if (
    SUPPORTED_LANGUAGES.includes(
      savedLanguage
    )
  ) {
    return savedLanguage;
  }

  const browserLanguage =
    navigator.language
      ?.toLowerCase()
      .slice(0, 2);

  if (
    SUPPORTED_LANGUAGES.includes(
      browserLanguage
    )
  ) {
    return browserLanguage;
  }

  return "fr";
}

function interpolate(
  value,
  variables = {}
) {
  return Object.entries(
    variables
  ).reduce(
    (
      result,
      [key, replacement]
    ) =>
      result.replaceAll(
        `{${key}}`,
        String(
          replacement
        )
      ),
    value
  );
}

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguage,
  ] = useState(
    getInitialLanguage
  );

  useEffect(() => {
    localStorage.setItem(
      "trainbuddyLanguage",
      language
    );

    document.documentElement.lang =
      language;

  }, [language]);

  const value = useMemo(
    () => ({
      language,

      setLanguage,

      t: (
        key,
        variables = {}
      ) => {
        const translatedValue =
          translations[
            language
          ]?.[key] ??
          translations.fr?.[
            key
          ] ??
          key;

        return interpolate(
          translatedValue,
          variables
        );
      },

      locale:
        language === "en"
          ? "en-GB"
          : language ===
            "nl"
          ? "nl-BE"
          : "fr-BE",
    }),

    [language]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage doit être utilisé dans LanguageProvider"
    );
  }

  return context;
}