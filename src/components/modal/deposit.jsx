import { Colors } from "@/constants/colors";
import { createDeposit } from "@/services/deposit";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const parseAmount = (text) => {
  const value = Number(String(text).replace(",", "."));
  return Number.isFinite(value) ? value : 0;
};

function DepositModal({
  visible,
  onClose,
  onSuccess,
  baseUrl,
  token,
  accountNumber,
  currency,
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [copied, setCopied] = useState(false);

  const value = parseAmount(amount);
  const canSubmit = value > 0 && !!accountNumber && !submitting;
  const closeWhileIdle = () => {
    if (!submitting) onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const response = await createDeposit(
      `${baseUrl}/transactions/deposit`,
      token,
      {
        amount: value,
        account_number: String(accountNumber).trim(),
        method: "pix",
        validate_only: false,
      },
    );
    setSubmitting(false);

    if (response?.success === false || response?.error) {
      setError(response?.message || t("deposit.failed"));
      return;
    }
    onSuccess?.();
    const pix = response?.data?.pix_copy_paste;
    if (pix) {
      setPixCode(pix);
    } else {
      onClose();
    }
  };

  const copyPix = async () => {
    await Clipboard.setStringAsync(pixCode);
    setCopied(true);
  };

  if (pixCode) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.icon}>
                <Ionicons name="qr-code-outline" size={22} color={Colors.brand.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t("deposit.pixTitle")}</Text>
                <Text style={styles.subtitle}>{t("deposit.pixPending")}</Text>
              </View>
            </View>
            <Text style={styles.label}>{t("deposit.pixCode")}</Text>
            <Text style={styles.pixBox} selectable numberOfLines={4}>
              {pixCode}
            </Text>
            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
                <Text style={styles.cancelText}>{t("deposit.close")}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.confirm]} onPress={copyPix}>
                <Text style={styles.confirmText}>
                  {copied ? t("balance.copied") : t("deposit.copyPix")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeWhileIdle}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeWhileIdle} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="add" size={22} color={Colors.brand.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t("deposit.title")}</Text>
              <Text style={styles.subtitle}>
                {t("deposit.account", { account: accountNumber ?? "—" })}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            {t("deposit.amount")}
            {currency ? ` (${currency})` : ""}
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={Colors.textLight.disabled}
            editable={!submitting}
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancel]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirm, !canSubmit && styles.off]}
              onPress={submit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.button.primaryText} />
              ) : (
                <Text style={styles.confirmText}>{t("deposit.confirm")}</Text>
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
    padding: 24,
    backgroundColor: "rgba(17, 17, 17, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
    marginRight: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "800", color: Colors.textLight.primary },
  subtitle: { fontSize: 12, color: Colors.textLight.primary, marginTop: 3 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: Colors.textLight.primary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  error: { fontSize: 12, color: Colors.textLight.primary, marginTop: 10 },
  pixBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    fontSize: 13,
    color: Colors.textLight.primary,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: { backgroundColor: Colors.light.surfaceSoft },
  cancelText: { fontSize: 14, fontWeight: "700", color: Colors.textLight.primary },
  confirm: { backgroundColor: Colors.brand.primaryDeep },
  confirmText: { fontSize: 14, fontWeight: "700", color: Colors.button.primaryText },
  off: { opacity: 0.5 },
});

export default memo(DepositModal);
