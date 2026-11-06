import BackLink from "@/components/backLink";
import ConfirmPinModal from "@/components/modal/confirmPin";
import FilterTypeTransaction from "@/components/modal/filterTypeTransaction";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import formatCurrency from "@/helpers";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createTransfer as createTransferService,
  lookupClientOrRemitter,
} from "../../../services/transfer";

/* ---------- Constantes ---------- */
const MIN_AMOUNT = 50;
const DEBOUNCE_MS = 800;
const OPERATORS = ["Natcash (Natcom)", "Moncash (Digicel)"];

const INITIAL_TRANSFER = {
  client_id: "",
  client_name: "",
  phone_client: "",
  beneficiary_name: "",
  account_number: "",
  operator_name: "",
  sendValue: "",
  validateOnly: true,
};

/* ---------- Helpers ---------- */
const asString = (v) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

/**
 * Normaliza input de montante para "integer.decimals".
 * Assume que "," e "." são separadores decimais (não de milhar).
 * Aceitável para montantes de transferência.
 */
const normalizeAmountInput = (value) => {
  const cleaned = String(value ?? "").replace(/[^\d.,]/g, "");
  const decimalIndex = Math.max(
    cleaned.lastIndexOf(","),
    cleaned.lastIndexOf("."),
  );

  if (decimalIndex === -1) return cleaned.replace(/[.,]/g, "");

  const integer = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
  const decimals = cleaned
    .slice(decimalIndex + 1)
    .replace(/[.,]/g, "")
    .slice(0, 2);

  return decimals.length ? `${integer}.${decimals}` : integer;
};

/* ---------- Field ---------- */
function Field({
  label,
  icon,
  onSearch,
  loading,
  variant,
  error,
  containerStyle,
  inputRowStyle,
  ...inputProps
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[styles.inputRow, inputRowStyle, error && styles.inputRowError]}
      >
        <TextInput
          style={[styles.input, variant === "amount" && styles.amountInput]}
          placeholderTextColor={Colors.textLight.disabled}
          {...inputProps}
        />
        {icon && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearch}
            disabled={loading}
            hitSlop={8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.brand.secondary} />
            ) : (
              <Ionicons name={icon} size={19} color={Colors.brand.secondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ---------- Ecrã ---------- */
export default function TransferMoney() {
  const { t } = useTranslation();
  const { user, configs, showToast } = useAppContext();

  const [transferData, setTransferData] = useState(() => ({
    ...INITIAL_TRANSFER,
    distributor_ref: Crypto.randomUUID(),
  }));
  const [documentNumber, setDocumentNumber] = useState("");
  const [loadingRemitter, setLoadingRemitter] = useState(false);
  const [loadingRecipient, setLoadingRecipient] = useState(false);

  const [estimatedValue, setEstimatedValue] = useState(0); // sempre number
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState("");
  const [typeTransaction, setTypeTransaction] = useState(null);
  const [amountFocused, setAmountFocused] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const debounceRef = useRef(null);

  const resetTransferData = useCallback(() => {
    setTransferData({
      ...INITIAL_TRANSFER,
      distributor_ref: Crypto.randomUUID(),
    });
  }, []);

  const updateField = (key) => (value) =>
    setTransferData((prev) => ({ ...prev, [key]: value }));

  const handleDocumentChange = (value) => {
    setDocumentNumber(value);
    setTransferData((prev) => ({
      ...prev,
      client_id: "",
      client_name: "",
      phone_client: "",
    }));
  };

  /* ---------- Lookups ---------- */
  const handleSearchRemitter = useCallback(async () => {
    const doc = asString(documentNumber).trim();
    if (!doc) return;

    try {
      // Limpa só os campos do remitter; preserva o resto do formulário.
      setTransferData((prev) => ({
        ...prev,
        client_id: "",
        client_name: "",
        phone_client: "",
      }));
      setLoadingRemitter(true);
      const response = await lookupClientOrRemitter(
        `${configs.baseUrl}/companies/get-client?doc_id=${encodeURIComponent(doc)}`,
        user.access_token,
      );

      if (!response?.data) return;

      setTransferData((prev) => ({
        ...prev,
        client_id: asString(response.data.id ?? doc),
        client_name: asString(response.data.client_name),
        phone_client: asString(response.data.phone),
      }));
    } catch (err) {
      console.error("Remitter lookup failed:", err);
      showToast("error", t("transfer.clientFetchFailed"));
    } finally {
      setLoadingRemitter(false);
    }
  }, [documentNumber, configs.baseUrl, user.access_token, showToast, t]);

  const handleSearchRecipient = useCallback(async () => {
    const account = asString(transferData.account_number).trim();
    if (!account) return;

    try {
      setLoadingRecipient(true);
      const response = await lookupClientOrRemitter(
        `${configs.baseUrl}/companies/get-beneficiary?account_number=${encodeURIComponent(account)}`,
        user.access_token,
      );

      if (!response?.data || response?.success === false) {
        showToast("info", t("transfer.beneficiaryNotFound"));
        return;
      }

      setTransferData((prev) => ({
        ...prev,
        beneficiary_name: asString(response.data.beneficiary_name),
        operator_name: asString(response.data.operator_name),
        account_number: asString(response.data.account_number ?? account),
      }));
    } catch (err) {
      console.error("Recipient lookup failed:", err);
      showToast("error", t("transfer.lookupFailed"));
    } finally {
      setLoadingRecipient(false);
    }
  }, [
    transferData.account_number,
    configs.baseUrl,
    user.access_token,
    showToast,
    t,
  ]);

  /* ---------- Estimativa ---------- */
  // Recebe um snapshot por parâmetro para não depender do objeto
  // `transferData` inteiro (que muda a cada tecla e anulava o debounce).
  const fetchEstimate = useCallback(
    async (rawValue, snapshot) => {
      const numeric = Number(rawValue);

      if (!rawValue || Number.isNaN(numeric) || numeric < MIN_AMOUNT) {
        setEstimatedValue(0);
        setEstimateError(
          rawValue && !Number.isNaN(numeric) && numeric < MIN_AMOUNT
            ? t("transfer.minAmount", { min: MIN_AMOUNT })
            : null,
        );
        return;
      }

      try {
        setEstimateError(null);
        setEstimating(true);

        const created = await createTransferService(
          `${configs.baseUrl}/transfers/create`,
          user.access_token,
          {
            ...snapshot,
            sendValue: numeric,
            validateOnly: true,
          },
        );

        const total = Number(created?.data?.estimated);
        setEstimatedValue(Number.isFinite(total) && total > 0 ? total : 0);
      } catch (err) {
        console.error("Estimate failed:", err);
        setEstimateError(t("transfer.estimateFailed"));
        setEstimatedValue(0);
      } finally {
        setEstimating(false);
      }
    },
    [t, configs.baseUrl, user.access_token],
  );

  // Debounce apenas sobre `sendValue`; `fetchEstimate` é estável.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const value = transferData.sendValue;
    const numeric = Number(value);

    if (!value || Number.isNaN(numeric) || numeric < MIN_AMOUNT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstimatedValue(0);
      setEstimateError(
        value && !Number.isNaN(numeric) && numeric < MIN_AMOUNT
          ? t("transfer.minAmount", { min: MIN_AMOUNT })
          : null,
      );
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchEstimate(value, transferData);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Intencionalmente só reagimos a sendValue / fetchEstimate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferData.sendValue, fetchEstimate, t]);

  /* ---------- Validação ---------- */
  const isFormValid = useMemo(() => {
    const numeric = Number(transferData.sendValue);
    return (
      asString(documentNumber).trim().length > 0 &&
      asString(transferData.client_name).trim().length > 0 &&
      asString(transferData.beneficiary_name).trim().length > 0 &&
      asString(transferData.account_number).trim().length > 0 &&
      asString(transferData.operator_name).trim().length > 0 &&
      !Number.isNaN(numeric) &&
      numeric >= MIN_AMOUNT
    );
  }, [documentNumber, transferData]);

  const isRemitterValid = useMemo(
    () =>
      asString(documentNumber).trim().length > 0 &&
      asString(transferData.client_name).trim().length > 0,
    [documentNumber, transferData.client_name],
  );

  /* ---------- Confirmar ---------- */
  const handleOpenPin = () => {
    if (!isFormValid || submitting) return;
    setPinError("");
    setPinVisible(true);
  };

  const handleConfirm = async (pin) => {
    if (!isFormValid || submitting) return false;

    const payload = {
      ...transferData,
      sendValue: Number(transferData.sendValue),
      doc_id: documentNumber,
      phone_client: transferData.phone_client,
      validateOnly: false,
      pin_transaction: pin,
      operator_name: transferData.operator_name.split(" ")[0],
    };

    setSubmitting(true);
    setPinError("");
    try {
      const result = await createTransferService(
        `${configs.baseUrl}/transfers/create`,
        user.access_token,
        payload,
      );

      if (!result?.success) {
        setPinError(result?.message || t("transfer.couldNotComplete"));
        return false;
      }
      setPinVisible(false);
      resetTransferData();
      setDocumentNumber("");
      setEstimatedValue(0);
      setEstimateError(null);
      setTypeTransaction(null);
      setCurrentStep(1);
      router.push({
        pathname: "/screens/invoices/transfer",
        params: { id: result.data?.id },
      });
      showToast("success", t("transfer.submitted"));
      return true;
    } catch (err) {
      setPinError(t("transfer.failed"));
      console.error("Transfer failed:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Render ---------- */
  const canProceedAmount = estimatedValue > 0 && !estimating;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackLink />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="paper-plane-outline"
                size={20}
                color={Colors.brand.secondary}
              />
            </View>
            <Text style={styles.title}>{t("transfer.title")}</Text>
          </View>
          <Text style={styles.subtitle}>{t("transfer.subtitle")}</Text>
        </View>

        {/* 01 — Amount */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>
          <Text style={styles.sectionTitle}>{t("transfer.step1")}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.exchangeRow}>
            <Field
              containerStyle={styles.amountField}
              inputRowStyle={styles.amountInputRow}
              variant="amount"
              label={t("transfer.amount")}
              placeholder={t("transfer.minimum", { min: MIN_AMOUNT })}
              keyboardType="decimal-pad"
              value={
                amountFocused || !transferData.sendValue
                  ? transferData.sendValue
                  : formatCurrency(transferData.sendValue)
              }
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              onChangeText={(value) =>
                updateField("sendValue")(normalizeAmountInput(value))
              }
              error={estimateError}
            />

            <View style={styles.exchangeMarker}>
              <Ionicons
                name="swap-horizontal"
                size={17}
                color={Colors.brand.secondary}
              />
            </View>

            <View style={styles.estimationRow}>
              <Text style={styles.estimationLabel} numberOfLines={1}>
                {estimating
                  ? t("transfer.estimating")
                  : t("transfer.estimatedTotal")}
              </Text>
              {estimating ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.brand.secondary}
                />
              ) : (
                <Text
                  style={styles.estimation}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {estimatedValue > 0
                    ? formatCurrency(estimatedValue, "HTG")
                    : "—"}
                </Text>
              )}
            </View>
          </View>

          {currentStep === 1 && (
            <TouchableOpacity
              style={[
                styles.button,
                !canProceedAmount && styles.buttonDisabled,
              ]}
              onPress={() => setCurrentStep(2)}
              disabled={!canProceedAmount}
            >
              <Text style={styles.buttonText}>{t("transfer.nextCard")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 02 — Remittance */}
        {currentStep >= 2 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>02</Text>
              <Text style={styles.sectionTitle}>{t("transfer.step2")}</Text>
            </View>
            <View style={styles.card}>
              <Field
                label={t("transfer.documentNumber")}
                icon="search"
                placeholder={t("transfer.documentPlaceholder")}
                value={documentNumber}
                onChangeText={handleDocumentChange}
                onSearch={handleSearchRemitter}
                loading={loadingRemitter}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearchRemitter}
                inputMode="numeric"
              />
              <View style={styles.divider} />
              <Field
                label={t("transfer.clientName")}
                placeholder={t("transfer.autoFilled")}
                value={transferData.client_name}
                onChangeText={updateField("client_name")}
              />
              <View style={styles.divider} />
              <Field
                label={t("transfer.phoneNumber")}
                placeholder={t("transfer.autoFilled")}
                keyboardType="phone-pad"
                value={transferData.phone_client}
                onChangeText={updateField("phone_client")}
              />
            </View>

            {currentStep === 2 && (
              <TouchableOpacity
                style={[
                  styles.button,
                  (!isRemitterValid || loadingRemitter) &&
                    styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => setCurrentStep(3)}
                disabled={!isRemitterValid || loadingRemitter}
              >
                <Text style={styles.buttonText}>{t("transfer.nextCard")}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={Colors.button.primaryText}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 03 — Recipient */}
        {currentStep >= 3 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>03</Text>
              <Text style={styles.sectionTitle}>{t("transfer.step3")}</Text>
            </View>
            <View style={[styles.card, styles.cardRaised]}>
              <Field
                label={t("transfer.accountNumber")}
                icon="search"
                placeholder={t("transfer.accountPlaceholder")}
                keyboardType="numeric"
                value={transferData.account_number}
                onChangeText={updateField("account_number")}
                onSearch={handleSearchRecipient}
                loading={loadingRecipient}
                returnKeyType="search"
                onSubmitEditing={handleSearchRecipient}
              />
              <View style={styles.divider} />
              <Field
                label={t("transfer.recipientName")}
                placeholder={t("transfer.autoFilled")}
                value={transferData.beneficiary_name}
                onChangeText={updateField("beneficiary_name")}
              />
              <View style={styles.divider} />
              <FilterTypeTransaction
                typeTransaction={typeTransaction}
                setTypeTransaction={setTypeTransaction}
                i18nIsDynamicList={true}
                listItems={OPERATORS}
                t={t}
                onChange={updateField("operator_name")}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || submitting) && styles.buttonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleOpenPin}
              disabled={!isFormValid || submitting}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.button.primaryText}
                />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {t("transfer.confirmTransfer")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={Colors.button.primaryText}
                  />
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.footer}>{t("transfer.terms")}</Text>
          </View>
        )}
      </ScrollView>

      <ConfirmPinModal
        visible={pinVisible}
        title={t("transfer.confirmTransfer")}
        loading={submitting}
        error={pinError}
        onCancel={() => {
          if (submitting) return;
          setPinVisible(false);
          setPinError("");
        }}
        onConfirm={handleConfirm}
        rows={[
          {
            label: t("pin.recipient"),
            value: transferData.beneficiary_name || "—",
          },
          { label: t("pin.account"), value: transferData.account_number },
          { label: t("pin.operator"), value: transferData.operator_name },
          {
            label: t("pin.youPay"),
            value: formatCurrency(Number(transferData.sendValue) || 0),
          },
          {
            label: t("pin.recipientGets"),
            value: formatCurrency(estimatedValue, "HTG"),
            highlight: true,
          },
        ]}
      />
    </SafeAreaView>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },

  /* Header */
  header: { marginBottom: 26 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSoft,
  },
  title: {
    flexShrink: 1,
    fontSize: 23,
    fontWeight: "800",
    color: Colors.textLight.primary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight.secondary,
    marginTop: 10,
    lineHeight: 21,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.brand.secondary,
    backgroundColor: Colors.light.surfaceSoft,
    width: 30,
    height: 30,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 30,
    marginRight: 11,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textLight.primary,
    letterSpacing: 0.1,
  },

  /* Card */
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 26,
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight.divider },
  cardRaised: { zIndex: 10, elevation: 6 },

  /* Field */
  field: { paddingVertical: 12, width: "100%" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textLight.primary,
    letterSpacing: 0.25,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
    paddingHorizontal: 12,
  },
  inputRowError: { borderColor: Colors.status.error },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textLight.primary,
    letterSpacing: 0.1,
    textTransform: "capitalize",
  },
  amountInput: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "left",
    textTransform: "none",
  },
  searchButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSoft,
  },
  errorText: {
    fontSize: 12,
    color: Colors.status.error,
    marginTop: 7,
  },

  /* Estimation */
  exchangeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  amountField: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
  },
  amountInputRow: {
    minHeight: 42,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  exchangeMarker: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    marginBottom: 9,
  },
  estimationRow: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  estimationLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textLight.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  estimation: {
    alignSelf: "stretch",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textLight.primary,
    textAlign: "center",
    minHeight: 24,
  },

  /* Button */
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand.secondaryDark,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 10,
    minHeight: 54,
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.48, shadowOpacity: 0, elevation: 0 },
  buttonText: {
    color: Colors.button.primaryText,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Footer */
  footer: {
    fontSize: 12,
    color: Colors.textLight.primary,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 19,
  },
});
