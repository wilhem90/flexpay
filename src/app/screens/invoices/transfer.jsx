import BackLink from "@/components/backLink";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { getTransferDetails } from "@/services/transfer";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

const COLORS = {
  background: Colors.light.background,
  white: Colors.light.surface,
  text: Colors.textLight.secondary,
  textDark: Colors.textLight.primary,
  muted: Colors.textLight.muted,
  border: Colors.borderLight.strong,
  stripe: Colors.light.surfaceSoft,
  green: Colors.brand.primaryDark,
  red: Colors.status.error,
  greenBrand: Colors.brand.primaryDeep,
};

// Formatadores seguros
const money = (value, currency = "BRL") => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
};

const dateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

export default function Invoice() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { user, configs, showToast } = useAppContext();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);

  const receiptRef = useRef(null);

  const handleShareReceipt = async () => {
    if (Platform.OS === "web") {
      window.print();
      return;
    }
    try {
      const imageUri = await captureRef(receiptRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await Sharing.shareAsync(imageUri, {
        mimeType: "image/png",
        dialogTitle: t("invoice.shareReceipt"),
      });
    } catch (error) {
      console.error("Erro ao gerar comprovante:", error);
      showToast("error", t("invoice.receiptFailed"));
    }
  };

  useEffect(() => {
    const fetchTransferDetails = async () => {
      if (!params.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getTransferDetails(
          `${configs.baseUrl}/transfers/get-transfer/${params.id}`,
          user.access_token,
        );
        if (response?.success && response?.transfer?.[0]?.id) {
          setTransfer(response.transfer[0]);
        }
      } catch (error) {
        console.error("[Invoice] Error fetching transfer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferDetails();
  }, [params.id, configs.baseUrl, user.access_token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.greenBrand} />
        <Text style={styles.loadingText}>{t("invoice.loadingDetails")}</Text>
      </SafeAreaView>
    );
  }

  if (!transfer) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
        <Text style={styles.emptyTitle}>{t("invoice.unavailable")}</Text>
        <Text style={styles.emptySubtitle}>
          {t("invoice.transferNotFound")}
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Formata a operadora para exibição
  const operatorName =
    transfer.operator_name?.toLowerCase() === "moncash"
      ? "Moncash"
      : transfer.operator_name?.toLowerCase() === "natcash"
        ? "Natcash Haiti"
        : transfer.operator_name || "—";

  const getStatusLabel = (status) => {
    const key = status?.toLowerCase();
    return ["completed", "pending", "failed", "canceled"].includes(key)
      ? t(`statement.status.${key}`)
      : status || t("common.unknown");
  };

  const isCompleted = transfer.status?.toLowerCase() === "completed";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Navbar do App (Opcional, mas ajuda a voltar) */}
      <View style={styles.navbar}>
        {Platform.OS === "web" ? (
          <BackLink style={styles.navBack} />
        ) : (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
        )}
        <Text style={styles.navTitle}>{t("invoice.receipt")}</Text>
        <View style={{ width: Platform.OS === "web" ? 80 : 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={styles.receiptPaper}
          ref={receiptRef}
          collapsable={false}
          dataSet={{ printArea: "" }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.brandName}>
              {user?.type === "user" ? "Flexpay ltda" : user?.full_name}
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.brandSubtitle}>
                {t("invoice.transactionReceipt")}
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={COLORS.green}
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>

          <Text style={styles.introText}>{t("invoice.transferCompleted")}</Text>

          {/* TABELA ZEBRADA */}
          <View style={styles.table}>
            <TableRow
              label={t("invoice.transactionType")}
              value="Cash-Money"
              highlight
            />
            <TableRow label={t("invoice.country")} value="Haiti" />
            {transfer.client_name && (
              <TableRow
                label={t("invoice.sender")}
                value={transfer.client_name}
              />
            )}
            <TableRow label={t("invoice.operator")} value={operatorName} />
            <TableRow
              label={t("invoice.number")}
              value={transfer.account_number || "—"}
            />
            {transfer.beneficiary_name && (
              <TableRow
                label={t("invoice.beneficiary")}
                value={transfer.beneficiary_name}
                highlight
              />
            )}
            {isCompleted && (
              <TableRow
                label={t("common.status")}
                value={getStatusLabel(transfer.status)}
                valueColor={isCompleted ? COLORS.green : COLORS.textDark}
                highlight
              />
            )}
            <TableRow
              label={t("invoice.amountSent")}
              value={money(
                transfer.send_value,
                transfer.send_currency || "BRL",
              )}
            />
            <TableRow
              label={t("invoice.amountReceived")}
              value={money(
                transfer.received_value,
                transfer.received_currency || "HTG",
              )}
            />
            <TableRow
              label={t("invoice.dateTime")}
              value={dateTime(transfer.created_at)}
            />
            <TableRow
              label={t("invoice.transactionId")}
              value={transfer.id}
              last
            />
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} FlexPay
            </Text>
          </View>
        </View>

        {/* BOTÃO DE COMPARTILHAR (Fora do comprovante) */}
        <TouchableOpacity
          style={styles.shareButton}
          dataSet={{ noPrint: "" }}
          onPress={() => {
            showToast("info", t("invoice.generatingReceipt"));
            handleShareReceipt();
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={Colors.button.primaryText}
          />
          <Text style={styles.shareButtonText}>
            {t("invoice.shareReceipt")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Sub-componente da Linha da Tabela ---------- */
function TableRow({ label, value, highlight, valueColor, last }) {
  return (
    <View
      style={[
        styles.row,
        !last && styles.rowBorder,
        highlight && styles.rowHighlight,
      ]}
    >
      <View style={styles.cellLabel}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.cellValue}>
        <Text
          style={[
            styles.valueText,
            highlight && styles.valueTextBold,
            valueColor ? { color: valueColor } : null,
          ]}
          numberOfLines={3}
        >
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  /* Navbar */
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  navBack: { marginBottom: 0, minWidth: 80 },
  navTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textDark },

  scrollContent: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },

  /* Paper / Card Principal */
  receiptPaper: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: Colors.brand.primaryDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Header do Documento */
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.greenBrand, // Azul escuro corporativo
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "capitalize",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: "400",
  },
  introText: {
    fontSize: 12,
    color: COLORS.textDark,
    marginBottom: 16,
  },

  /* Tabela Zebrada */
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 44,
  },
  rowBorder: {
    // borderBottomWidth já está no row, mas mantido por padrão visual
  },
  rowHighlight: {
    backgroundColor: COLORS.stripe, // Efeito zebrado da imagem
  },
  cellLabel: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  cellValue: {
    flex: 1.4,
    padding: 12,
    justifyContent: "center",
  },
  valueText: {
    fontSize: 13,
    color: COLORS.textDark,
    textTransform: "capitalize",
  },
  valueTextBold: {
    fontWeight: "700",
  },

  /* Footer do Documento */
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 1.5,
  },

  /* Botão Compartilhar */
  shareButton: {
    backgroundColor: COLORS.greenBrand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },

  /* Empty State */
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.greenBrand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
});
