import { Colors } from "@/constants/colors";

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const Type = {
  display: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "400" },
  bodyStrong: { fontSize: 14, fontWeight: "600" },
  caption: { fontSize: 12, fontWeight: "500" },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
};

export const Shadow = {
  sm: { boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)" },
  md: { boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)" },
  lg: { boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)" },
};

export const Layout = {
  breakpointDesktop: 1024,
  sidebarWidth: 248,
  topbarHeight: 64,
  contentMaxWidth: 960,
  cardMaxWidth: 560,
};

export const Surface = {
  page: Colors.light.background,
  card: Colors.light.surface,
  soft: Colors.light.surfaceSoft,
  border: Colors.borderLight.default,
  text: Colors.textLight.primary,
  textSecondary: Colors.textLight.secondary,
  textMuted: Colors.textLight.muted,
  brand: Colors.brand.primaryDeep,
};
