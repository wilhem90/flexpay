import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { getPricing, savePricing, updateProfile } from "@/services/settings";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, configs, showToast } = useAppContext();

  const [pin, setPin] = useState("");

  const initialProfile = useMemo(() => {
    const meta = user?.user_metadata ?? {};
    return {
      fullname: user?.full_name ?? meta.full_name ?? "",
      username: user?.user_name ?? meta.user_name ?? "",
      phone: user?.phone ?? meta.phone ?? "",
    };
  }, [user]);
  const [profileForm, setProfileForm] = useState(initialProfile);
  const [pricing, setPricing] = useState({});
  const [currencies, setCurrencies] = useState({});
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedPricing, setLoadedPricing] = useState("");

  const profileRows = useMemo(() => {
    const meta = user?.user_metadata ?? {};
    const rows = [
      [
        "person-outline",
        t("settings.name"),
        user?.full_name ?? meta.full_name,
        "fullname",
      ],
      [
        "at-outline",
        t("settings.username"),
        user?.user_name ?? meta.user_name,
        "username",
      ],
      ["mail-outline", t("settings.email"), user?.email],
      ["call-outline", t("settings.phone"), user?.phone ?? meta.phone, "phone"],

      [
        "id-card-outline",
        t("settings.profileType"),
        user?.type_profile ?? meta.type_profile,
      ],
      ["cash-outline", t("settings.currency"), configs?.currency],
    ];
    return rows.filter(
      ([, , value, editKey]) =>
        editKey || (value && String(value).trim() !== ""),
    );
  }, [user, configs?.currency, t]);

  const loadPricing = useCallback(async () => {
    if (!configs?.baseUrl || !user?.access_token) return;
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
    if (user?.type_profile !== "company") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPricing();
  }, [loadPricing, user?.type_profile]);

  const setField = (code, key, text) =>
    setPricing((prev) => ({
      ...prev,
      [code]: { ...prev[code], [key]: text },
    }));

  const profileChanges = () => {
    const changes = {};
    Object.keys(initialProfile).forEach((key) => {
      const next = profileForm[key].trim();
      if (next !== String(initialProfile[key]).trim()) changes[key] = next;
    });
    return changes;
  };

  const pricingChanged =
    Object.keys(pricing).length > 0 &&
    JSON.stringify(pricing) !== loadedPricing;
  const hasChanges =
    Object.keys(profileChanges()).length > 0 ||
    pin.length > 0 ||
    pricingChanged;

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

  const handleSaveAll = async () => {
    if (saving || !hasChanges) return;

    if (pin.length > 0 && pin.length !== 4) {
      showToast("error", t("settings.pinHint"));
      return;
    }
    const pricingPayload = pricingChanged ? buildPricingPayload() : null;
    if (pricingChanged && !pricingPayload) {
      showToast("error", t("settings.pricingInvalid"));
      return;
    }

    setSaving(true);
    const changes = profileChanges();
    let failed = null;

    if (Object.keys(changes).length > 0 || pin.length === 4) {
      const response = await updateProfile(configs.baseUrl, user.access_token, {
        ...changes,
        ...(pin.length === 4 ? { pin_transaction: pin } : {}),
      });
      if (response?.success) {
        if (pin.length === 4) setPin("");
      } else {
        failed = response?.message || t("settings.profileFailed");
      }
    }

    if (!failed && pricingPayload) {
      const response = await savePricing(
        configs.baseUrl,
        user.access_token,
        pricingPayload,
      );
      if (response?.success) {
        await loadPricing();
      } else {
        failed = response?.message || t("settings.pricingSaveFailed");
      }
    }

    setSaving(false);
    showToast(failed ? "error" : "success", failed || t("settings.allSaved"));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t("settings.title")}</Text>

          <Text style={styles.section}>{t("settings.profile")}</Text>
          <View style={styles.card}>
            {profileRows.map(([icon, label, value, editKey]) => (
              <View key={label} style={styles.profileField}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View
                  style={[
                    styles.inputWrap,
                    !editKey && styles.inputWrapReadOnly,
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={16}
                    color={editKey ? Colors.transactions.refund : Colors.textLight.secondary}
                    style={styles.fieldIcon}
                  />
                  {editKey ? (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: saving ? Colors.borderLight.default : Colors.borderLight.default,
                          textTransform:
                            editKey === "fullname" ? "capitalize" : "none",
                        },
                      ]}
                      value={profileForm[editKey]}
                      onChangeText={(text) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          [editKey]: text,
                        }))
                      }
                      keyboardType={
                        editKey === "phone" ? "phone-pad" : "default"
                      }
                      autoCapitalize={editKey === "username" ? "none" : "words"}
                      autoCorrect={false}
                      editable={!saving}
                    />
                  ) : (
                    <>
                      <Text style={styles.readOnlyText} numberOfLines={1}>
                        {String(value)}
                      </Text>
                      <Ionicons
                        name="lock-closed-outline"
                        size={14}
                        color={Colors.textLight.secondary}
                      />
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>{t("settings.security")}</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t("settings.newPin")}</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(text) => setPin(text.replace(/\D/g, ""))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoComplete="off"
              placeholder="••••"
              placeholderTextColor={Colors.textLight.disabled}
              editable={!saving}
            />
            <Text style={styles.hint}>{t("settings.pinHint")}</Text>
          </View>

          <Text style={styles.section}>{t("settings.pricing")}</Text>
          {loadingPricing ? (
            <ActivityIndicator style={styles.loader} color={Colors.transactions.refund} />
          ) : (
            SERVICES.filter(({ code }) => pricing[code]).map(
              ({ code, icon, labelKey }) => (
                <View key={code} style={[styles.card, styles.pricingCard]}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name={icon} size={18} color={Colors.transactions.refund} />
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
                              onChangeText={(text) => setField(code, key, text)}
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
              (!hasChanges || saving) && styles.off,
            ]}
            onPress={handleSaveAll}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.button.primaryText} />
            ) : (
              <Text style={styles.primaryText}>{t("settings.saveAll")}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: Colors.textLight.primary,
    marginBottom: 20,
  },
  section: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Colors.textLight.primary,
    marginTop: 8,
    marginBottom: 10,
  },
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  profileIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
  },
  profileLabel: { fontSize: 11, color: Colors.textLight.secondary },
  profileValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textLight.primary,
    marginBottom: 6,
  },
  pinRow: { flexDirection: "row", gap: 10 },
  profileInput: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 0,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight.primary,
    backgroundColor: "transparent",
  },
  profileField: { marginBottom: 12 },
  fieldIcon: { marginRight: 8 },
  readOnlyText: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.textLight.primary },
  pinInput: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: "transparent",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 6,
    color: Colors.textLight.primary,
  },
  pinButton: { flex: 0, paddingHorizontal: 18, marginTop: 0 },
  hint: { marginTop: 10, fontSize: 12, color: Colors.textLight.secondary },
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
  serviceTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: Colors.textLight.primary },
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
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.textLight.primary },
  suffix: { fontSize: 13, fontWeight: "600", color: Colors.textLight.secondary },
  primaryButton: {
    flex: 1,
    height: 50,
    marginTop: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.transactions.refundDark,
  },
  primaryText: { fontSize: 14, fontWeight: "700", color: Colors.button.primaryText },
  off: { opacity: 0.45 },
});
