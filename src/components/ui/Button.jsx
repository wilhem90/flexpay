import { Colors } from "@/constants/colors";
import { Radius, Shadow, Space, Surface, Type } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

const VARIANTS = {
  primary: { bg: Colors.brand.primaryDeep, fg: Colors.button.primaryText, border: Colors.brand.primaryDeep },
  secondary: { bg: Surface.card, fg: Surface.text, border: Surface.border },
  ghost: { bg: "transparent", fg: Surface.brand, border: "transparent" },
  danger: { bg: Colors.statusDark.error, fg: Colors.button.dangerText, border: Colors.statusDark.error },
};

const SIZES = {
  sm: { height: 36, padding: Space.md, font: 13 },
  md: { height: 46, padding: Space.lg, font: 15 },
  lg: { height: 52, padding: Space.xl, font: 16 },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed, hovered }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.padding,
          backgroundColor: v.bg,
          borderColor: v.border,
        },
        variant === "primary" && Shadow.sm,
        fullWidth && styles.full,
        (pressed || hovered) && !inactive && styles.active,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={s.font + 3} color={v.fg} /> : null}
          <Text style={[styles.text, { color: v.fg, fontSize: s.font }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  full: { width: "100%" },
  active: { opacity: 0.88 },
  inactive: { opacity: 0.5 },
  text: { ...Type.bodyStrong, fontWeight: "700" },
});
