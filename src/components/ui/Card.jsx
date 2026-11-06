import { Radius, Shadow, Space, Surface, Type } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

export function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, Shadow.sm, style]}>
      {children}
    </View>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

export function Section({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.overline}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.border,
  },
  padded: { padding: Space.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Space.md,
    marginBottom: Space.lg,
  },
  headerText: { flex: 1, minWidth: 200 },
  title: { ...Type.title, color: Surface.text },
  subtitle: { ...Type.body, color: Surface.textSecondary, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  section: { gap: Space.sm, marginBottom: Space.lg },
  overline: {
    ...Type.overline,
    color: Surface.textMuted,
    textTransform: "uppercase",
  },
});
