import BackLink from "@/components/backLink";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import topupService from "@/services/topup";
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

const getStatusLabel = (status, t) => {
  const key = status?.toLowerCase();
  if (key === "cancelled") return t("statement.status.canceled");
  return ["completed", "pending", "failed", "canceled"].includes(key)
    ? t(`statement.status.${key}`)
    : status || t("common.unknown");
};

export default function TopupReceipt() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { user, configs, showToast } = useAppContext();
  const [topup, setTopup] = useState(null);
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
    let active = true;

    const fetchTopup = async () => {
      const id = params.id;

      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Espera-se que getTopupById aceite o ID do top-up
        // ou o statement_id e retorne { success, data }.
        const response = await topupService.getTopupById(
          user?.access_token,
          `${configs.baseUrl}/topups/get-topup/${id}`,
        );

        if (active && response?.success) {
          // Aceita tanto { data: objeto } quanto { data: [objeto] }.
          const result = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          setTopup(result ?? null);
        }
      } catch (error) {
        console.error("[TopupReceipt] Erro ao buscar top-up:", error);
        if (active) setTopup(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTopup();

    return () => {
      active = false;
    };
  }, [configs.baseUrl, params.id, user?.access_token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.greenBrand} />
        <Text style={styles.loadingText}>{t("invoice.loadingDetails")}</Text>
      </SafeAreaView>
    );
  }

  if (!topup) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
        <Text style={styles.emptyTitle}>{t("invoice.unavailable")}</Text>
        <Text style={styles.emptySubtitle}>{t("invoice.topupNotFound")}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCompleted = topup.status?.toLowerCase() === "completed";
  const isFailed = topup.status?.toLowerCase() === "failed";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

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
          <View style={styles.header}>
            <Text style={styles.brandName}>
              {user?.type === "company" ? user?.full_name : "FlexPay"}
            </Text>

            <View style={styles.subtitleRow}>
              <Text style={styles.brandSubtitle}>
                {t("invoice.topupReceipt")}
              </Text>
              {isCompleted && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.green}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>

          <Text style={styles.introText}>
            {isCompleted
              ? t("invoice.topupCompleted")
              : isFailed
                ? t("invoice.topupFailed")
                : t("invoice.topupDetails")}
          </Text>

          <View style={styles.table}>
            <TableRow
              label={t("invoice.transactionType")}
              value={t("invoice.topupType")}
              highlight
            />
            <TableRow
              label={t("common.status")}
              value={getStatusLabel(topup.status, t)}
            />
            <TableRow
              label={t("invoice.number")}
              value={topup.account_number}
            />
            <TableRow
              label={t("invoice.operator")}
              value={topup.operator_name}
            />

            <TableRow
              label={t("invoice.amountSent")}
              value={money(topup.send_value, topup.send_currency || "BRL")}
            />

            <TableRow
              label={t("invoice.amountReceived")}
              value={money(
                topup.received_value,
                topup.received_currency || "HTG",
              )}
              highlight
            />

            <TableRow
              label={t("invoice.dateTime")}
              value={dateTime(topup.created_at)}
            />
            <TableRow label={t("invoice.topupId")} value={topup.id} />
          </View>

          {topup.error_message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>{t("invoice.message")}</Text>
              <Text style={styles.errorMessage}>{topup.error_message}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} FlexPay
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          dataSet={{ noPrint: "" }}
          onPress={() => {
            showToast("success", t("invoice.shareReceipt"));
            handleShareReceipt();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color={COLORS.white} />
          <Text style={styles.shareButtonText}>
            {t("invoice.shareReceipt")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TableRow({ label, value, highlight, last }) {
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
        <Text style={styles.valueText} numberOfLines={3}>
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    marginBottom: Platform.OS === "web" ? 0 : 60,
  },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: COLORS.background,
  },
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 40,
  },
  receiptPaper: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "700",
    width: "100%",
    color: COLORS.greenBrand,
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
  },
  introText: {
    fontSize: 12,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 44,
  },
  rowBorder: {},
  rowHighlight: {
    backgroundColor: COLORS.stripe,
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
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.muted,
  },
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
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },
  errorBox: {
    backgroundColor: Colors.light.surfaceSoft,
    borderColor: Colors.borderLight.default,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.red,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textDark,
  },
});
