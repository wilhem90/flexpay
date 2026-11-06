export const Colors = {
  brand: {
    primary: "#3B82F6",
    primaryDark: "#2563EB",
    primaryDeep: "#1D4ED8",
    primaryLight: "#93C5FD",
    secondary: "#0EA5E9",
    secondaryDark: "#0284C7",
    accent: "#38BDF8",
  },

  dark: {
    background: "#0F1115",
    surface: "#191F28",
    surfaceElevated: "#222B36",
    surfaceSoft: "#273341",
    overlay: "#000000",
  },

  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSoft: "#F1F5F9",
    overlay: "#000000",
  },

  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    muted: "#64748B",
    disabled: "#475569",
    inverse: "#172554",
  },

  textLight: {
    primary: "#0F172A",
    secondary: "#475569",
    muted: "#64748B",
    disabled: "#94A3B8",
    inverse: "#FFFFFF",
  },

  border: {
    default: "#2D3745",
    light: "#3B4758",
    focus: "#3B82F6",
    divider: "#252C36",
  },

  borderLight: {
    default: "#E2E8F0",
    strong: "#CBD5E1",
    divider: "#EEF2F7",
  },

  statusLight: {
    successBackground: "#DCFCE7",
    errorBackground: "#FEE2E2",
    warningBackground: "#FEF3C7",
    infoBackground: "#DBEAFE",
  },
  statusDark: {
    success: "#15803D",
    error: "#B91C1C",
    warning: "#B45309",
    info: "#1D4ED8",
  },


  status: {
    success: "#22C55E",
    successBackground: "#052E16",

    error: "#EF4444",
    errorBackground: "#450A0A",

    warning: "#F59E0B",
    warningBackground: "#451A03",

    info: "#3B82F6",
    infoDark: "#2563EB",
    infoBackground: "#172554",
  },

  transactions: {
    deposit: "#3B82F6",
    transfer: "#0EA5E9",
    withdrawal: "#F59E0B",
    payment: "#3B82F6",
    refund: "#A78BFA",
    refundDark: "#7C3AED",
    fee: "#F97316",
    feeDark: "#EA580C",
  },

  button: {
    primary: "#3B82F6",
    primaryText: "#FFFFFF",

    secondary: "#222B36",
    secondaryText: "#F8FAFC",

    danger: "#EF4444",
    dangerText: "#FFFFFF",

    disabled: "#273341",
    disabledText: "#64748B",
  },

  input: {
    background: "#191F28",
    border: "#2D3745",
    focusBorder: "#3B82F6",
    placeholder: "#64748B",
    text: "#F8FAFC",
  },

  gradient: {
    wallet: ["#2563EB", "#0284C7"],
    primary: ["#3B82F6", "#0EA5E9"],
    dark: ["#191F28", "#0F1115"],
  },
} as const;

export default Colors;
