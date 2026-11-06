import { Colors } from "@/constants/colors";

export const STATUS_PRIORITY = {
  pending: 0,
  processing: 1,
  disputing: 2,
  failed: 3,
  canceled: 4,
  completed: 5,
  delivered: 5,
};

const make = (icon, bg, fg) => ({ icon, bg, fg });

const warning = make(
  "time-outline",
  Colors.statusLight.warningBackground,
  Colors.statusDark.warning,
);
const success = make(
  "checkmark-circle-outline",
  Colors.statusLight.successBackground,
  Colors.statusDark.success,
);

export const STATUS_STYLES = {
  pending: warning,
  processing: make(
    "sync-outline",
    Colors.statusLight.infoBackground,
    Colors.statusDark.info,
  ),
  completed: success,
  delivered: success,
  failed: make(
    "close-circle-outline",
    Colors.statusLight.errorBackground,
    Colors.statusDark.error,
  ),
  canceled: make(
    "ban-outline",
    Colors.light.surfaceSoft,
    Colors.textLight.muted,
  ),
  disputing: { ...warning, icon: "alert-circle-outline" },
};

export const DEFAULT_STATUS_STYLE = make(
  "ellipse-outline",
  Colors.light.surfaceSoft,
  Colors.textLight.muted,
);

export const getStatusStyle = (status) =>
  STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;

export const sortTransfers = (list) =>
  [...list].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at) - new Date(a.created_at);
  });

const LOCALES = { pt: "pt-BR", es: "es-ES", en: "en-US", fr: "fr-FR" };
export const getLocale = (lang) => LOCALES[lang] ?? "en-US";

export const formatMoney = (value, currency = "BRL", locale = "pt-BR") => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value) || 0} ${currency}`;
  }
};

export const formatDateTime = (iso, locale = "pt-BR") => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(locale);
};

const pad = (n) => String(n).padStart(2, "0");

// A API espera datas no formato dd-mm-yyyy
export const toApiDate = (date) =>
  `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

export const getPeriodRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { startDate: toApiDate(start), endDate: toApiDate(end) };
};
