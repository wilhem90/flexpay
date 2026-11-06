import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatMoney, getLocale } from "./status";
import { StatusBadge } from "./transferRow";

function Line({ label, value, copyable = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await Clipboard.setStringAsync(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.line}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value} selectable>
          {value || "—"}
        </Text>
        {copyable && value ? (
          <Pressable
            onPress={handleCopy}
            hitSlop={8}
            style={styles.copyButton}
            accessibilityRole="button"
            accessibilityLabel="Copiar"
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={16}
              color={
                copied ? Colors.brand.primaryDeep : Colors.textLight.secondary
              }
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function TransferModal({ transfer, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);
  const [inputValue, setInputValue] = useState("");
  const { showToast } = useAppContext();

  if (!transfer) return null;

  const handleRegister = () => {
    if (!inputValue.trim()) {
      showToast("error", t("common.validationRequired"));
      if (Platform.OS === "web") {
        showAlert(t("common.validationRequired"));
        return;
      }
      return;
    }

    if (Platform.OS === "web") {
      showToast("success", `Code: ${inputValue}`);
      setInputValue("");
      onClose();
      return;
    }
    // Aqui você implementa a lógica de registro
    showToast("success", `Code: ${inputValue}`);
    setInputValue("");

    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>
                {t("transfers.resume")} #{transfer.sequence_number}
              </Text>
              <StatusBadge status={transfer.status} size={14} />
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.textLight.secondary}
              />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>
                {t("transfers.receivedValue")}
              </Text>
              <Text style={styles.highlightValue}>
                {formatMoney(
                  transfer.received_value,
                  transfer.received_currency,
                  locale,
                )}
              </Text>
            </View>

            <View style={styles.card}>
              <Line
                label={t("transfers.beneficiary")}
                value={transfer.beneficiary_name}
              />
              <Line
                label={t("transfers.account")}
                value={transfer.account_number}
                copyable
              />
            </View>

            {/* Input para digitar e botão registrar */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Digite o valor</Text>
              <TextInput
                style={[styles.input, inputValue === "" && styles.inputError]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="0,00"
                placeholderTextColor={Colors.textLight.secondary}
                keyboardType="numeric"
              />
              {inputValue === "" && (
                <Text style={styles.validationError}>
                  {t("common.validationRequired")}
                </Text>
              )}
              <Pressable
                onPress={handleRegister}
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("common.confirm")}
                disabled={inputValue === ""}
                opacity={inputValue === "" ? 0.5 : 1}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={Colors.button.primaryText}
                />
                <Text style={styles.registerButtonText}>
                  {t("common.confirm")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  validationError: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerInfo: { flex: 1, gap: 8, alignItems: "flex-start" },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textLight.primary },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    alignItems: "center",
    justifyContent: "center",
  },
  highlight: {
    backgroundColor: Colors.brand.primaryDeep,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  highlightLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  highlightValue: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.button.primaryText,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: Colors.light.background,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight.divider,
  },
  label: { fontSize: 13, color: Colors.textLight.secondary },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "60%",
    justifyContent: "flex-end",
  },
  value: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight.primary,
    textAlign: "right",
    textTransform: "capitalize",
  },
  copyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textLight.secondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textLight.primary,
    backgroundColor: Colors.light.surface,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.brand.primaryDeep,
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 12,
  },
  registerButtonText: {
    color: Colors.button.primaryText,
    fontSize: 15,
    fontWeight: "700",
  },
});
