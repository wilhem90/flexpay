import { Colors } from "@/constants/colors";
import { Radius, Shadow, Space, Surface, Type } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Button from "./Button";

export function StatCard({ label, value, icon, tint = Surface.brand, hint }) {
  return (
    <View style={[styles.stat, Shadow.sm]}>
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: Surface.soft }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function StatusPill({ label, tone = "neutral", icon }) {
  const tones = {
    success: [Colors.statusLight.successBackground, Colors.statusDark.success],
    warning: [Colors.statusLight.warningBackground, Colors.statusDark.warning],
    error: [Colors.statusLight.errorBackground, Colors.statusDark.error],
    info: [Colors.statusLight.infoBackground, Colors.statusDark.info],
    neutral: [Surface.soft, Surface.textSecondary],
  };
  const [bg, fg] = tones[tone] ?? tones.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function StateBase({ icon, iconColor, title, message, children }) {
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      {icon ? <Ionicons name={icon} size={40} color={iconColor} /> : null}
      {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
      {children}
    </View>
  );
}

export function LoadingState({ message }) {
  return (
    <View style={styles.state} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={Surface.brand} />
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, message }) {
  return (
    <StateBase
      icon={icon}
      iconColor={Colors.textLight.disabled}
      title={title}
      message={message}
    />
  );
}

export function ErrorState({ title, message, retryLabel, onRetry }) {
  return (
    <StateBase
      icon="cloud-offline-outline"
      iconColor={Colors.statusDark.error}
      title={title}
      message={message}
    >
      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          size="sm"
          variant="secondary"
          icon="refresh-outline"
        />
      ) : null}
    </StateBase>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minWidth: 180,
    padding: Space.lg,
    gap: Space.xs,
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.border,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Space.xs,
  },
  statLabel: { ...Type.caption, color: Surface.textSecondary },
  statValue: { ...Type.title, color: Surface.text },
  statHint: { ...Type.caption, color: Surface.textMuted },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: "600" },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: Space.sm,
    padding: Space.xxl,
  },
  stateTitle: { ...Type.heading, color: Surface.text, textAlign: "center" },
  stateText: { ...Type.body, color: Surface.textSecondary, textAlign: "center" },
});
