import { useLanguage }
  from "../i18n/LanguageContext";

export default function LanguageSwitcher() {
  const {
    language,
    setLanguage,
  } = useLanguage();

  return (
    <select
      value={language}
      onChange={(event) =>
        setLanguage(
          event.target.value
        )
      }
      aria-label="Language"
      style={{
        width: "auto",
        minWidth: "78px",
        padding: "9px 12px",
        borderRadius: "10px",
        border:
          "1px solid #dbe4f0",
        background: "#ffffff",
        color: "#334155",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <option value="fr">
        🇫🇷 FR
      </option>

      <option value="en">
        🇬🇧 EN
      </option>

      <option value="nl">
        🇧🇪 NL
      </option>
    </select>
  );
}