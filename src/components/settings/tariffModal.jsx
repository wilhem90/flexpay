// components/settings/pricingModal.js
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { getPricing, savePricing } from "@/services/settings";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICES = [
  { code: "topup", icon: "phone-portrait-outline", labelKey: "serviceTopup" },
  {
    code: "money_transfer",
    icon: "paper-plane-outline",
    labelKey: "serviceTransfer",
  },
];

const PRICING_FIELDS = [
  { key: "min_value", labelKey: "minValue" },
  { key: "max_value", labelKey: "maxValue" },
  { key: "start_percent", labelKey: "startPercent", suffix: "%" },
  { key: "end_percent", labelKey: "endPercent", suffix: "%" },
  { key: "fee_fixed", labelKey: "feeFixed" },
  { key: "fee_provider", labelKey: "feeProvider", readOnly: true },
];

const toText = (value) => (value == null ? "" : String(value));
const toNumber = (text) => Number(String(text).replace(",", "."));

const parsePricing = (data = []) => {
  const values = {};
  const currencies = {};
  data.forEach((service) => {
    const config = service?.config?.[0];
    if (!config) return;
    values[service.code] = Object.fromEntries(
      PRICING_FIELDS.map(({ key }) => [key, toText(config[key])]),
    );
    currencies[service.code] = config.currency;
  });
  return { values, currencies };
};

export default function PricingModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { user, configs, showToast } = useAppContext();

  const [pricing, setPricing] = useState({});
  const [currencies, setCurrencies] = useState({});
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedPricing, setLoadedPricing] = useState("");

  const loadPricing = useCallback(async () => {
    if (!configs?.baseUrl || !user?.access_token) return;
    setLoadingPricing(true);
    const response = await getPricing(configs.baseUrl, user.access_token);
    if (response?.success && Array.isArray(response.data)) {
      const parsed = parsePricing(response.data);
      setLoadedPricing(JSON.stringify(parsed.values));
      setPricing(parsed.values);
      setCurrencies(parsed.currencies);
    } else {
      showToast("error", response?.message || t("settings.pricingLoadFailed"));
    }
    setLoadingPricing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs?.baseUrl, user?.access_token]);

  useEffect(() => {
    if (!visible) return;
    if (user?.type !== "company") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPricing();
  }, [visible, loadPricing, user?.type_profile, user]);

  const setField = (code, key, text) =>
    setPricing((prev) => ({
      ...prev,
      [code]: { ...prev[code], [key]: text },
    }));

  const pricingChanged =
    Object.keys(pricing).length > 0 &&
    JSON.stringify(pricing) !== loadedPricing;

  const buildPricingPayload = () => {
    const payload = {};
    for (const { code } of SERVICES) {
      const values = pricing[code];
      if (!values) continue;
      const numbers = Object.fromEntries(
        PRICING_FIELDS.map(({ key }) => [key, toNumber(values[key])]),
      );
      const invalid =
        Object.values(numbers).some((n) => !Number.isFinite(n) || n < 0) ||
        numbers.min_value > numbers.max_value ||
        numbers.start_percent > 100 ||
        numbers.end_percent > 100;
      if (invalid) return null;
      payload[code] = numbers;
    }
    return payload;
  };

  const handleSave = async () => {
    if (saving || !pricingChanged) return;

    const pricingPayload = buildPricingPayload();
    if (!pricingPayload) {
      showToast("error", t("settings.pricingInvalid"));
      return;
    }

    setSaving(true);
    const response = await savePricing(
      configs.baseUrl,
      user.access_token,
      pricingPayload,
    );

    if (response?.success) {
      await loadPricing();
    }

    setSaving(false);
    showToast(
      response?.success ? "success" : "error",
      response?.success
        ? t("settings.allSaved")
        : response?.message || t("settings.pricingSaveFailed"),
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.page}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t("settings.pricing")}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons
              name="close"
              size={24}
              color={Colors.transactions.refund}
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loadingPricing ? (
              <ActivityIndicator
                style={styles.loader}
                color={Colors.transactions.refund}
                size="large"
              />
            ) : (
              SERVICES.filter(({ code }) => pricing[code]).map(
                ({ code, icon, labelKey }) => (
                  <View key={code} style={[styles.card, styles.pricingCard]}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceIcon}>
                        <Ionicons
                          name={icon}
                          size={18}
                          color={Colors.transactions.refund}
                        />
                      </View>
                      <Text style={styles.serviceTitle}>
                        {t(`settings.${labelKey}`)}
                      </Text>
                      {currencies[code] ? (
                        <Text style={styles.currency}>{currencies[code]}</Text>
                      ) : null}
                    </View>

                    <View style={styles.grid}>
                      {PRICING_FIELDS.map(
                        ({ key, labelKey: fieldLabel, suffix, readOnly }) => (
                          <View key={key} style={styles.gridCell}>
                            <Text style={styles.fieldLabel}>
                              {t(`settings.${fieldLabel}`)}
                            </Text>
                            <View
                              style={[
                                styles.inputWrap,
                                readOnly && styles.inputWrapReadOnly,
                              ]}
                            >
                              <TextInput
                                style={styles.input}
                                value={pricing[code][key]}
                                onChangeText={(text) =>
                                  setField(code, key, text)
                                }
                                keyboardType="decimal-pad"
                                editable={!readOnly}
                                selectTextOnFocus={!readOnly}
                              />
                              {suffix ? (
                                <Text style={styles.suffix}>{suffix}</Text>
                              ) : null}
                              {readOnly ? (
                                <Ionicons
                                  name="lock-closed-outline"
                                  size={14}
                                  color={Colors.textLight.secondary}
                                />
                              ) : null}
                            </View>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                ),
              )
            )}

            <Pressable
              style={[
                styles.primaryButton,
                (!pricingChanged || saving) && styles.off,
              ]}
              onPress={handleSave}
              disabled={!pricingChanged || saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.button.primaryText} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={Colors.button.primaryText}
                  />
                  <Text style={styles.primaryText}>{t("settings.saveAll")}</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: Colors.light.surfaceSoft },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: Colors.light.surfaceSoft,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight.divider,
    backgroundColor: Colors.light.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surface,
    elevation: 2,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textLight.primary,
    marginBottom: 6,
  },
  loader: { marginVertical: 30 },
  pricingCard: { paddingBottom: 6 },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
    marginRight: 10,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  currency: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textLight.primary,
    backgroundColor: Colors.light.surfaceSoft,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCell: { width: "47%", flexGrow: 1, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surface,
  },
  inputWrapReadOnly: { backgroundColor: Colors.light.surfaceSoft },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  suffix: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textLight.secondary,
  },
  primaryButton: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    height: 52,
    marginTop: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primaryDeep,
    shadowColor: Colors.brand.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.button.primaryText,
  },
  off: { opacity: 0.45 },
});
