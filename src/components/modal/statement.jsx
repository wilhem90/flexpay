import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ---------- Rotas por serviço (só quem tem fatura) ---------- */
const SERVICE_INVOICE_ROUTES = {
  transfer: "screens/invoices/transfer",
  topup: "screens/invoices/topup",
};

/* ---------- i18n ---------- */
const STATUS_KEYS = {
  pending: "statement.status.pending",
  completed: "statement.status.completed",
  failed: "statement.status.failed",
  canceled: "statement.status.canceled",
};

const NATURE_KEYS = {
  credit: "statement.nature.credit",
  debit: "statement.nature.debit",
};

const SERVICE_KEYS = {
  transfer: "statement.service.transfer",
  topup: "statement.service.topup",
  deposit: "statement.service.deposit",
  commission: "statement.service.commission",
};

/* ---------- Cores/ícones por serviço ---------- */
const SERVICE_STYLES = {
  transfer: { icon: "paper-plane-outline", color: Colors.brand.primaryDeep },
  topup: { icon: "phone-portrait-outline", color: Colors.brand.primaryDeep },
  deposit: { icon: "arrow-down-circle-outline", color: Colors.status.success },
  commission: { icon: "cash-outline", color: Colors.status.success },
};

/* ---------- Estilo por estado ---------- */
const STATUS_STYLES = {
  pending: {
    icon: "time-outline",
    bg: Colors.statusLight?.warning ?? "#FEF3C7",
    fg: Colors.status?.warning ?? "#B45309",
  },
  completed: {
    icon: "checkmark-circle-outline",
    bg: Colors.statusLight?.success ?? "#DCFCE7",
    fg: Colors.status?.success ?? "#15803D",
  },
  failed: {
    icon: "close-circle-outline",
    bg: Colors.statusLight?.error ?? "#FEE2E2",
    fg: Colors.status?.error ?? "#B91C1C",
  },
  canceled: {
    icon: "ban-outline",
    bg: Colors.light?.surfaceSoft ?? "#F1F5F9",
    fg: Colors.textLight?.muted ?? "#64748B",
  },
};

const DEFAULT_STATUS_STYLE = {
  icon: "ellipse-outline",
  bg: Colors.light?.surfaceSoft ?? "#F1F5F9",
  fg: Colors.textLight?.muted ?? "#64748B",
};

const formatCurrency = (value, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value) || 0);

export default function StatementModal({ visible, statement, onClose }) {
  const { t } = useTranslation();
  const tr = (map, key) => (map[key] ? t(map[key]) : key);

  const {
    currency = "BRL",
    service_type: serviceType,
    nature,
    amount,
    balance_before,
    balance_after,
    fee_provider,
    status,
    created_at,
    id,
    statement_id,
    father_id,
  } = statement ?? {};

  const date = useMemo(() => {
    if (!created_at) return "—";
    const d = new Date(created_at);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }, [created_at]);

  // Delta do saldo, colorido conforme a natureza
  const balanceDelta = useMemo(() => {
    const before = Number(balance_before) || 0;
    const after = Number(balance_after) || 0;
    const diff = after - before;
    return {
      value: formatCurrency(Math.abs(diff), currency),
      positive: diff >= 0,
    };
  }, [balance_before, balance_after, currency]);

  const statusStyle = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
  const serviceStyle = SERVICE_STYLES[serviceType] ?? {
    icon: "receipt-outline",
    color: Colors.textLight.secondary,
  };

  const statusLabel = tr(STATUS_KEYS, status);
  const natureLabel = tr(NATURE_KEYS, nature);
  const serviceLabel = tr(SERVICE_KEYS, serviceType);

  // `statement_id` é sempre igual a `id` neste backend — mostra só um.
  const displayId = statement_id ?? id;

  const rows = useMemo(
    () => [
      [t("statement.type"), natureLabel],
      [t("statement.balanceBefore"), formatCurrency(balance_before, currency)],
      [t("statement.balanceAfter"), formatCurrency(balance_after, currency)],
      [t("statement.providerFee"), formatCurrency(fee_provider, currency)],
      [t("statement.date"), date],
    ],
    [
      t,
      natureLabel,
      balance_before,
      balance_after,
      fee_provider,
      currency,
      date,
    ],
  );

  const invoiceRoute = SERVICE_INVOICE_ROUTES[serviceType];
  const canOpenInvoice = Boolean(invoiceRoute);

  const handleOpenInvoice = () => {
    if (!invoiceRoute) return;
    onClose?.();
    router.push({
      pathname: invoiceRoute,
      params: { id: statement_id ?? id },
    });
  };

  if (!statement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modal}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.serviceIcon,
                { backgroundColor: `${serviceStyle.color}1A` },
              ]}
            >
              <Ionicons
                name={serviceStyle.icon}
                size={22}
                color={serviceStyle.color}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {statement.service_type}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {formatCurrency(amount, currency)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.textLight.secondary}
              />
            </Pressable>
          </View>

          {/* Badge de estado + natureza */}
          <View style={styles.statusRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <Ionicons
                name={statusStyle.icon}
                size={14}
                color={statusStyle.fg}
              />
              <Text style={[styles.statusText, { color: statusStyle.fg }]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={styles.natureTag}>{natureLabel}</Text>
          </View>

          {/* Delta do saldo */}
          <View style={styles.deltaRow}>
            <Text style={styles.deltaLabel}>
              {t("statement.balanceChange")}
            </Text>
            <Text
              style={[
                styles.deltaValue,
                {
                  color: balanceDelta.positive
                    ? (Colors.status?.success ?? "#15803D")
                    : (Colors.status?.error ?? "#B91C1C"),
                },
              ]}
            >
              {balanceDelta.positive ? "+" : "−"}
              {balanceDelta.value}
            </Text>
          </View>

          {/* Detalhes */}
          <ScrollView
            style={styles.details}
            contentContainerStyle={styles.detailsContent}
            showsVerticalScrollIndicator={false}
          >
            {rows.map(([label, value], i) => (
              <View key={`${label}-${i}`} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {value ?? "—"}
                </Text>
              </View>
            ))}

            {father_id && (
              <View style={styles.row}>
                <Text style={styles.label}>{t("statement.relatedTo")}</Text>
                <Text style={[styles.value, styles.idValue]} numberOfLines={1}>
                  {father_id}
                </Text>
              </View>
            )}

            <View style={styles.row}>
              <Text style={styles.label}>ID</Text>
              <Text style={[styles.value, styles.idValue]} numberOfLines={1}>
                {displayId ?? "—"}
              </Text>
            </View>
          </ScrollView>

          {/* Acções */}
          <View style={styles.actions}>
            {canOpenInvoice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("invoice.openInvoice")}
                onPress={handleOpenInvoice}
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.button.primaryText}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>{t("common.invoice")}</Text>
              </Pressable>
            ) : (
              <View style={styles.invoiceHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={Colors.textLight.muted}
                />
                <Text style={styles.invoiceHintText}>
                  {t("invoice.noInvoiceForService")}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("invoice.closeDetails")}
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={Colors.textLight.primary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {t("common.close")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    padding: 20,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    gap: 14,
    shadowColor: Colors.dark?.overlay ?? "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  /* Header */
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textLight.secondary,
    letterSpacing: 0.2,
    lineHeight: 18,
    paddingTop: 12,
    textTransform: "uppercase",
    borderBottomColor: Colors.borderLight.default,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textLight.primary,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSoft,
  },

  /* Status */
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  natureTag: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textLight.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  /* Delta */
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
  },
  deltaLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textLight.secondary,
  },
  deltaValue: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  /* Detalhes */
  details: { maxHeight: 320 },
  detailsContent: { paddingVertical: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight.default,
  },
  label: {
    color: Colors.textLight.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  value: {
    flex: 1,
    textAlign: "right",
    color: Colors.textLight.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  idValue: {
    fontFamily: "monospace",
    fontSize: 11,
    color: Colors.textLight.secondary,
  },

  /* Acções */
  actions: { gap: 10, marginTop: 4 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
    borderRadius: 12,
    minHeight: 48,
  },
  primaryButton: { backgroundColor: Colors.brand.primaryDeep },
  secondaryButton: {
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: Colors.button.primaryText,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  secondaryButtonText: { color: Colors.textLight.primary },
  buttonIcon: { marginRight: 8 },
  invoiceHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSoft,
  },
  invoiceHintText: {
    fontSize: 12,
    color: Colors.textLight.muted,
    flex: 1,
  },
});
