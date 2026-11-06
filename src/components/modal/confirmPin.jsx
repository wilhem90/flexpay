import { Colors } from "@/constants/colors";
import { useModalOnTop } from "@/helpers/useModalOnTop";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const PIN_LENGTH = 4;

function ConfirmPinModal({
  visible,
  title,
  rows = [],
  loading = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(""));
  const inputs = useRef([]);
  const overlayRef = useModalOnTop(visible);

  const pin = digits.join("");
  const canConfirm = pin.length === PIN_LENGTH && !loading;

  const reset = useCallback(() => {
    setDigits(Array(PIN_LENGTH).fill(""));
  }, []);

  const handleChange = (index, text) => {
    const clean = text.replace(/\D/g, "");

    // Pasting or autofill: spread the digits across the inputs.
    if (clean.length > 1) {
      const next = Array(PIN_LENGTH).fill("");
      clean
        .slice(0, PIN_LENGTH)
        .split("")
        .forEach((d, i) => (next[i] = d));
      setDigits(next);
      inputs.current[Math.min(clean.length, PIN_LENGTH) - 1]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < PIN_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index, key) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    const ok = await onConfirm?.(pin);
    // Wrong PIN or failure: clear it so the user can retry.
    if (ok === false) {
      reset();
      inputs.current[0]?.focus();
    } else {
      reset();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        ref={overlayRef}
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={Colors.brand.primary}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title ?? t("pin.title")}</Text>
              <Text style={styles.subtitle}>{t("pin.subtitle")}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.summary}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, i) => (
              <View
                key={row.label}
                style={[
                  styles.row,
                  i === rows.length - 1 && styles.rowLast,
                  row.highlight && styles.rowHighlight,
                ]}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    row.highlight && styles.rowValueHighlight,
                    { textTransform: "capitalize" },
                  ]}
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.pinLabel}>{t("pin.label")}</Text>
          <View style={styles.pinRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                style={[
                  styles.pinInput,
                  !!digit && styles.pinInputFilled,
                  !!error && styles.pinInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(i, text)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(i, nativeEvent.key)
                }
                keyboardType="number-pad"
                secureTextEntry
                maxLength={i === 0 ? PIN_LENGTH : 1}
                editable={!loading}
                autoFocus={i === 0}
                textContentType="oneTimeCode"
                selectTextOnFocus
                accessibilityLabel={t("pin.digit", { n: i + 1 })}
                autoComplete="off"
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancel]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirm, !canConfirm && styles.off]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              {loading ? (
                <ActivityIndicator color={Colors.button.primaryText} />
              ) : (
                <Text style={styles.confirmText}>{t("pin.confirm")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 17, 0.55)",
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceSoft,
    marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
    marginRight: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textLight.primary },
  subtitle: { fontSize: 12, color: Colors.textLight.primary, marginTop: 3 },
  summary: {
    maxHeight: 240,
    flexGrow: 0,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surfaceSoft,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowHighlight: { paddingVertical: 14 },
  rowLabel: { fontSize: 12, color: Colors.textLight.primary },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  rowValueHighlight: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  pinLabel: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Colors.textLight.primary,
  },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  pinInput: {
    width: 56,
    height: 62,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surfaceSoft,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  pinInputFilled: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.light.surface,
  },
  pinInputError: { borderColor: Colors.status.error },
  error: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    color: Colors.status.error,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 22 },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: { backgroundColor: Colors.light.surfaceSoft },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  confirm: { backgroundColor: Colors.brand.primaryDeep },
  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.button.primaryText,
  },
  off: { opacity: 0.45 },
});

export default memo(ConfirmPinModal);
