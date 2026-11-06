import BackLink from "@/components/backLink";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */
import ConfirmPinModal from "@/components/modal/confirmPin";
import Loading from "@/components/modal/loading";
import AmountSelect from "@/components/selectlist/amount";
import CountrySelect from "@/components/selectlist/country";
import OperatorSelect from "@/components/selectlist/operator";
import { Colors } from "@/constants/colors";
import { useAuthUser } from "@/context/Provider";
import countriesList from "@/services/countries";
import topupService from "@/services/topup";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_COUNTRY = {
  CountryIso: "HT",
  CountryName: "Haiti",
  InternationalDialingInformation: [
    { MaximumLength: 11, MinimumLength: 11, Prefix: "509" },
  ],
  RegionCodes: ["HT"],
};

const DEFAULT_SEND_CURRENCY = "BRL";
const LOCALES = { pt: "pt-BR", es: "es-ES", en: "en-US", fr: "fr-FR" };

function getDialingInfo(country) {
  return country?.InternationalDialingInformation?.[0] ?? {};
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function SendTopUp() {
  const { t, i18n } = useTranslation();
  const { user, configs, showToast } = useAuthUser();
  const locale = LOCALES[i18n.language] ?? "en-US";

  const [loadingOperators, setLoadingOperators] = useState(false);
  const [loadingAmounts, setLoadingAmounts] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState("");
  const loading = loadingOperators || loadingAmounts || loadingAction;
  const [countries, setCountries] = useState([]);
  const [operators, setOperators] = useState([]);
  const [amounts, setAmounts] = useState([]);
  const [countrySelected, setCountrySelected] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState(
    getDialingInfo(DEFAULT_COUNTRY).Prefix ?? "",
  );
  const [operatorSelected, setOperatorSelected] = useState(null);
  const [amountSelected, setAmountSelected] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [receiveValue, setReceiveValue] = useState(null);
  const [loadingText, setLoadingText] = useState("common.processingRequest");

  const phoneInputRef = useRef(null);
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [progressWidth] = useState(() =>
    progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    }),
  );

  // Race guards — increment on every new request, ignore stale responses.
  const operatorsRequestId = useRef(0);
  const amountsRequestId = useRef(0);
  const sendRequestId = useRef(0);

  const { MinimumLength: minimumLength = 0, MaximumLength: maximumLength = 0 } =
    getDialingInfo(countrySelected);

  const isPhoneValid = useMemo(
    () => phone.length >= minimumLength && phone.length <= maximumLength,
    [phone, minimumLength, maximumLength],
  );

  const canSend =
    isPhoneValid && !!operatorSelected && !!amountSelected && !loading;

  // `||` so empty strings also fall back (metadata currency can be "").
  const sendCurrencyIso =
    user?.user_metadata?.currency || DEFAULT_SEND_CURRENCY;

  const formattedAmount = useMemo(() => {
    const value = receiveValue?.received_value;
    const currency = receiveValue?.received_currency ?? "USD";
    if (value == null) return "--";
    try {
      return Number(value).toLocaleString(locale, {
        style: "currency",
        currency,
      });
    } catch {
      // Hermes can throw on unsupported currency codes.
      return `${currency} ${Number(value).toFixed(2)}`;
    }
  }, [receiveValue, locale]);

  /* ------------------------------ Side effects ----------------------------- */

  useEffect(() => {
    if (!user?.access_token || !configs?.baseUrl) return;

    setCountries(countriesList);
    const timer = setTimeout(() => phoneInputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [user?.access_token, configs?.baseUrl]);

  // Fetch operators. Race-guarded: only the latest request can commit state.
  const fetchOperators = useCallback(async () => {
    const requestId = ++operatorsRequestId.current;
    const isStale = () => requestId !== operatorsRequestId.current;

    if (!user?.access_token || !configs?.baseUrl || !isPhoneValid) {
      setLoadingOperators(false);
      setOperators([]);
      setOperatorSelected(null);
      return;
    }

    try {
      setLoadingOperators(true);
      setLoadingText("topup.fetchingOperators");
      const url = `${configs.baseUrl}/topups/providers?AccountNumber=${encodeURIComponent(
        phone,
      )}`;
      const response = await topupService.getOperators(user.access_token, url);
      if (isStale()) return;

      if (!response?.success) {
        showToast("error", response?.error || t("topup.fetchOperatorsFailed"));
      }

      const items = Array.isArray(response?.Items) ? response.Items : [];
      setOperators(items);
      setOperatorSelected(items.length === 1 ? items[0] : null);
      // A new operator set invalidates any previous amount selection.
      setAmounts([]);
      setAmountSelected(null);
      setReceiveValue(null);
    } catch (error) {
      if (isStale()) return;
      console.error("Error fetching operators:", error);
      setOperators([]);
      setOperatorSelected(null);
    } finally {
      if (!isStale()) setLoadingOperators(false);
    }
  }, [user?.access_token, configs?.baseUrl, phone, isPhoneValid, showToast, t]);

  // Auto-search once the phone reaches its maximum length.
  useEffect(() => {
    if (!maximumLength || phone.length < maximumLength) return;
    fetchOperators();
  }, [phone, maximumLength, fetchOperators]);

  // Fetch amounts whenever an operator is selected.
  useEffect(() => {
    const providerCode = operatorSelected?.ProviderCode;

    if (!user?.access_token || !configs?.baseUrl || !providerCode || !phone) {
      setLoadingAmounts(false);
      setAmounts([]);
      setAmountSelected(null);
      return;
    }

    const requestId = ++amountsRequestId.current;
    const isStale = () => requestId !== amountsRequestId.current;

    (async () => {
      try {
        setLoadingAmounts(true);
        setLoadingText("topup.fetchingAmounts");
        const url =
          `${configs.baseUrl}/topups/products` +
          `?AccountNumber=${encodeURIComponent(phone)}` +
          `&ProviderCodes=${encodeURIComponent(providerCode)}`;
        const response = await topupService.getProducts(user.access_token, url);
        if (isStale()) return;

        const items = Array.isArray(response?.Items) ? response.Items : [];
        setAmounts(items);
        setAmountSelected(items.length === 1 ? items[0] : null);
      } catch (error) {
        if (isStale()) return;
        console.error("Error fetching amounts:", error);
        setAmounts([]);
        setAmountSelected(null);
      } finally {
        if (!isStale()) setLoadingAmounts(false);
      }
    })();

    return () => {
      // Invalidate in-flight request when deps change / unmount.
      amountsRequestId.current++;
      setLoadingAmounts(false);
    };
  }, [operatorSelected, phone, user?.access_token, configs?.baseUrl]);

  /* -------------------------------- Handlers ------------------------------- */

  const handlePhoneChange = useCallback(
    (text) => {
      const onlyNumbers = text.replace(/\D/g, "");
      setPhone(onlyNumbers);

      operatorsRequestId.current++;
      sendRequestId.current++;
      setLoadingOperators(false);
      setLoadingAction(false);
      setOperators([]);
      setOperatorSelected(null);
      setAmounts([]);
      setAmountSelected(null);
      setReceiveValue(null);

      if (!onlyNumbers) {
        setPhoneError("");
        return;
      }
      if (onlyNumbers.length < minimumLength) {
        setPhoneError(t("topup.phoneDigits", { count: minimumLength }));
        return;
      }
      setPhoneError("");
    },
    [minimumLength, maximumLength, t],
  );

  const handleCountrySelect = useCallback((country) => {
    operatorsRequestId.current++;
    sendRequestId.current++;
    setLoadingOperators(false);
    setLoadingAction(false);
    setCountrySelected(country);
    setOperatorSelected(null);
    setOperators([]);
    setAmounts([]);
    setAmountSelected(null);
    setReceiveValue(null);

    const prefix = getDialingInfo(country).Prefix ?? "";
    setPhone(prefix);
    setPhoneError("");

    setTimeout(() => phoneInputRef.current?.focus(), 100);
  }, []);

  const handleOperatorSelect = useCallback((operator) => {
    setOperatorSelected(operator);
    setAmounts([]);
    setAmountSelected(null);
    setReceiveValue(null);
  }, []);

  const callSendTopUp = useCallback(
    async ({ amount, validateOnly, pin }) => {
      const payload = {
        skuCode: amount?.skuCode,
        sendValue: amount?.sendValue,
        sendCurrencyIso,
        accountNumber: phone,
        validateOnly,
        receiveCountryName: countrySelected?.CountryName,
        operatorName: operatorSelected?.Name,
        receiveCurrencyIso: amount?.receiveCurrencyIso,
        distributor_ref: Crypto.randomUUID(),
        pinTransaction: pin,
      };

      return topupService.sendTopUp(
        user?.access_token,
        `${configs.baseUrl}/topups/send`,
        payload,
      );
    },
    [
      phone,
      sendCurrencyIso,
      countrySelected?.CountryName,
      operatorSelected?.Name,
      user?.access_token,
      configs.baseUrl,
    ],
  );

  const handleAmountSelect = useCallback(
    async (amount) => {
      setAmountSelected(amount);
      setReceiveValue(null);
      setLoadingAction(true);
      setLoadingText("topup.validatingTopup");
      const requestId = ++sendRequestId.current;
      try {
        const result = await callSendTopUp({ amount, validateOnly: true });
        if (requestId !== sendRequestId.current) return;
        if (!result?.success) {
          setAmountSelected(null);
          showToast("error", result?.error || t("topup.sendFailed"));
          return;
        }
        setReceiveValue(result?.data ?? null);
      } catch (error) {
        if (requestId !== sendRequestId.current) return;
        console.error("[TopUp] Error validating top-up:", error);
        setAmountSelected(null);
        showToast("error", error?.message || t("topup.sendFailed"));
      } finally {
        if (requestId === sendRequestId.current) setLoadingAction(false);
      }
    },
    [callSendTopUp, showToast, t],
  );

  const handleSend = useCallback(() => {
    if (!isPhoneValid || !operatorSelected || !amountSelected) return;
    setPinError("");
    setPinVisible(true);
  }, [isPhoneValid, operatorSelected, amountSelected]);

  const handleConfirmPin = useCallback(
    async (pin) => {
      const requestId = ++sendRequestId.current;

      progressAnim.setValue(0);
      setPinSubmitting(true);
      setPinError("");

      Animated.timing(progressAnim, {
        toValue: 0.9,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      try {
        const result = await callSendTopUp({
          amount: amountSelected,
          validateOnly: false,
          pin,
        });
        if (requestId !== sendRequestId.current) return false;

        if (!result?.success) {
          progressAnim.stopAnimation();
          progressAnim.setValue(0);
          setPinError(
            result?.error || result?.message || t("topup.sendFailed"),
          );
          return false;
        }

        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();

        setPinVisible(false);
        router.push({
          pathname: "/screens/invoices/topup",
          params: {
            id: result?.data?.statement_id,
          },
        });
        // Reset form after successful top-up
        if (!amountSelected?.validateOnly) {
          setAmountSelected(null);
          setOperatorSelected(null);
          setPhone("");
          setCountrySelected(null);
        }
        return true;
      } catch (error) {
        console.error("[TopUp] Error sending top-up:", error);
        progressAnim.stopAnimation();
        setPinError(error?.message || t("topup.sendFailed"));
        return false;
      } finally {
        if (requestId === sendRequestId.current) setPinSubmitting(false);
      }
    },
    [amountSelected, callSendTopUp, progressAnim, t],
  );

  /* --------------------------------- Render -------------------------------- */

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackLink />
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color={Colors.transactions.fee}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>{t("topup.title")}</Text>
              <Text style={styles.subtitle}>{t("topup.subtitle")}</Text>
            </View>
          </View>

          <View style={styles.card}>
            {/* Country */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("topup.destinationCountry")}</Text>
              <CountrySelect
                items={countries}
                selectedCountry={countrySelected}
                onSelect={handleCountrySelect}
              />
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t("topup.phoneNumber")}</Text>
                <Text
                  style={[styles.counter, isPhoneValid && styles.counterValid]}
                >
                  {phone.length}/{maximumLength}
                </Text>
              </View>

              <View
                style={[
                  styles.phoneInputContainer,
                  phoneError && styles.phoneInputError,
                  !phoneError && isPhoneValid && styles.phoneInputValid,
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.textLight.secondary}
                />
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  placeholder={t("topup.phonePlaceholder")}
                  placeholderTextColor={Colors.textLight.disabled}
                  maxLength={maximumLength}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={fetchOperators}
                  accessibilityRole="button"
                  accessibilityLabel={t("topup.a11ySearchOperators")}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color={Colors.textLight.secondary}
                  />
                </TouchableOpacity>
              </View>

              {phoneError ? (
                <View style={styles.errorRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color={Colors.transactions.fee}
                  />
                  <Text style={styles.errorText}>{phoneError}</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>{t("topup.phoneHint")}</Text>
              )}
            </View>

            {/* Operator */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("topup.operator")}</Text>
              <OperatorSelect
                items={operators}
                selectedOp={operatorSelected}
                onSelect={handleOperatorSelect}
              />
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("topup.topupAmount")}</Text>
              <AmountSelect
                items={amounts}
                selectedAmount={amountSelected}
                onSelect={handleAmountSelect}
              />
            </View>

            {/* Summary */}
            {amountSelected && (
              <View style={styles.summary}>
                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={Colors.transactions.fee}
                  />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>
                    {t("topup.amountToReceive")}
                  </Text>
                  <Text style={styles.summaryValue}>{formattedAmount}</Text>
                </View>
              </View>
            )}

            {/* Button */}
            <TouchableOpacity
              style={[styles.button, !canSend && styles.buttonDisabled]}
              onPress={handleSend}
              activeOpacity={0.9}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel={t("topup.a11yContinue")}
            >
              <Animated.View
                style={[styles.buttonProgress, { width: progressWidth }]}
              />

              <View style={styles.buttonContent}>
                {loading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={Colors.button.primaryText}
                    />
                    <Text style={styles.buttonText}>{t("topup.sending")}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.buttonText}>{t("topup.continue")}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={Colors.button.primaryText}
                    />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Security */}
            <View style={styles.security}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={Colors.textLight.secondary}
              />
              <Text style={styles.securityText}>{t("topup.secure")}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Loading loading={loading} text={t(loadingText)} />
      <ConfirmPinModal
        visible={pinVisible}
        title={t("topup.confirmTitle")}
        loading={pinSubmitting}
        error={pinError}
        onCancel={() => {
          if (pinSubmitting) return;
          setPinVisible(false);
          setPinError("");
        }}
        onConfirm={handleConfirmPin}
        rows={[
          {
            label: t("topup.destinationCountry"),
            value: countrySelected?.CountryName ?? "—",
          },
          { label: t("topup.phoneNumber"), value: phone },
          { label: t("topup.operator"), value: operatorSelected?.Name ?? "—" },
          {
            label: t("pin.youPay"),
            value: `${amountSelected?.sendValue ?? "—"} ${sendCurrencyIso}`,
          },
          {
            label: t("topup.amountToReceive"),
            value: formattedAmount,
            highlight: true,
          },
        ]}
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  keyboard: { flex: 1 },
  scrollContent: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerContent: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textLight.primary,
    letterSpacing: -0.6,
  },
  subtitle: { marginTop: 3, fontSize: 13, color: Colors.textLight.primary },

  /* Card */
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    elevation: 2,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  /* Fields */
  field: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Colors.textLight.primary,
    marginBottom: 8,
  },
  counter: { fontSize: 12, color: Colors.textLight.secondary },
  counterValid: { color: Colors.textLight.primary, fontWeight: "700" },

  /* Phone Input */
  phoneInputContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSoft,
  },
  phoneInputValid: {
    borderColor: Colors.transactions.fee,
    backgroundColor: Colors.light.surface,
  },
  phoneInputError: { borderColor: Colors.status.error, borderWidth: 1.5 },
  phoneInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textLight.primary,
  },

  helperText: { marginTop: 6, fontSize: 12, color: Colors.textLight.secondary },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  errorText: {
    marginLeft: 5,
    fontSize: 12,
    color: Colors.status.error,
    fontWeight: "500",
  },

  /* Summary */
  summary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    marginBottom: 18,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryContent: { flex: 1 },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textLight.primary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },

  /* Button */
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.transactions.feeDark,
    overflow: "hidden",
    position: "relative",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.transactions.feeDark,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 2,
  },
  buttonText: {
    color: Colors.button.primaryText,
    fontSize: 16,
    fontWeight: "700",
  },

  /* Security */
  security: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  securityText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.textLight.primary,
  },
});
