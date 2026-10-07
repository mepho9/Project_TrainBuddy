import {
  Languages,
} from "lucide-react";

import { useLanguage }
  from "../i18n/LanguageContext";

const LANGUAGES = [
  {
    code: "fr",
    label: "FR",
  },
  {
    code: "en",
    label: "EN",
  },
  {
    code: "nl",
    label: "NL",
  },
];

export default function LanguageSwitcher() {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t(
        "language.label"
      )}
    >

      <Languages
        size={15}
        aria-hidden="true"
      />

      <div className="language-options">

        {LANGUAGES.map(
          (item) => (

            <button
              key={
                item.code
              }
              type="button"
              className={
                language ===
                item.code
                  ? "active"
                  : ""
              }
              aria-pressed={
                language ===
                item.code
              }
              onClick={() =>
                setLanguage(
                  item.code
                )
              }
            >
              {item.label}
            </button>

          )
        )}

      </div>

    </div>
  );
}