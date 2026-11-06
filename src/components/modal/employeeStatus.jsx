import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const STATUS_OPTIONS = [
  {
    key: "active",
    i18n: "employees.statusOptions.active",
    bg: Colors.statusLight.successBackground,
    fg: Colors.statusDark.success,
    icon: "checkmark-circle-outline",
  },
  {
    key: "inactive",
    i18n: "employees.statusOptions.inactive",
    bg: Colors.statusLight.errorBackground,
    fg: Colors.statusDark.error,
    icon: "close-circle-outline",
  },
  {
    key: "banned",
    i18n: "employees.statusOptions.banned",
    bg: Colors.light.surfaceSoft,
    fg: Colors.textLight.muted,
    icon: "ban-outline",
  },
  {
    key: "suspended",
    i18n: "employees.statusOptions.suspended",
    bg: Colors.statusLight.warningBackground,
    fg: Colors.statusDark.warning,
    icon: "alert-circle-outline",
  },
  {
    key: "pending",
    i18n: "employees.statusOptions.pending",
    bg: Colors.statusLight.infoBackground,
    fg: Colors.statusDark.info,
    icon: "time-outline",
  },
];

export const STATUS_MAP = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.key, s]),
);

export const resolveStatusKey = (employee) => {
  const raw = employee?.status ?? employee?.state;
  if (raw && STATUS_MAP[raw]) return raw;
  return employee?.active ? "active" : "inactive";
};

export function StatusModal({
  visible,
  target,
  value,
  onChange,
  onClose,
  onConfirm,
  saving,
  t,
}) {
  const title = target?.profile_name || target?.user_name || "";
  const subtitle = target?.profile_email || "";

  const canConfirm = useMemo(() => {
    if (!target) return false;
    return value !== resolveStatusKey(target);
  }, [target, value]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>{t("employees.changeStatus")}</Text>
          {(title || subtitle) && (
            <Text style={styles.sheetSubtitle} numberOfLines={1}>
              {title}
              {subtitle ? ` • ${subtitle}` : ""}
            </Text>
          )}

          <View style={styles.optionsList}>
            {STATUS_OPTIONS.map((opt) => {
              const selected = value === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => onChange(opt.key)}
                  activeOpacity={0.7}
                  style={[styles.option, selected && styles.optionSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[styles.optionIcon, { backgroundColor: opt.bg }]}
                  >
                    <Ionicons name={opt.icon} size={16} color={opt.fg} />
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && { color: opt.fg, fontWeight: "700" },
                    ]}
                  >
                    {t(opt.i18n)}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={opt.fg} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonGhost]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.sheetButtonGhostText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetButton,
                styles.sheetButtonPrimary,
                (!canConfirm || saving) && styles.sheetButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!canConfirm || saving}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.button.primaryText}
                />
              ) : (
                <Text style={styles.sheetButtonPrimaryText}>
                  {t("common.confirm")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight.default,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textLight.primary,
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.textLight.secondary,
    textAlign: "center",
    marginBottom: 8,
  },
  optionsList: { gap: 6, marginTop: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surfaceSoft,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  sheetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetButtonGhost: {
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surface,
  },
  sheetButtonGhostText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  sheetButtonPrimary: {
    backgroundColor: Colors.brand.primaryDeep,
  },
  sheetButtonPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.button.primaryText,
  },
  sheetButtonDisabled: { opacity: 0.45 },
});
