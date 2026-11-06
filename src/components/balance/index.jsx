import { Colors } from "@/constants/colors";
import formatCurrency from "@/helpers";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

const HIDDEN_KEY = "@app/balanceHidden";

const formatDate = (value, locale) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAccountNumber = (value) => {
  if (value == null || String(value).trim() === "") return "—";

  const account = String(value).trim();

  // Agrupa apenas números puros; preserva outros formatos, como +509...
  if (!/^\d+$/.test(account)) return account;

  return account.replace(/\B(?=(\d{4})+(?!\d))/g, " ");
};

export default function Balance({
  details,
  loading = false,
  hidden: hiddenProp,
  onToggleVisibility,
  onRefresh,
  onDeposit,
  onOpenWallet,
  onOpenInfo,
}) {
  const { t } = useTranslation();
  const controlled = hiddenProp !== undefined;
  const [hiddenState, setHiddenState] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  const hidden = controlled ? hiddenProp : hiddenState;

  useEffect(() => {
    if (controlled) return;
    AsyncStorage.getItem(HIDDEN_KEY)
      .then((value) => setHiddenState(value === "1"))
      .catch(() => {});
  }, [controlled]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const toggleVisibility = useCallback(() => {
    if (onToggleVisibility) onToggleVisibility(!hidden);
    if (controlled) return;
    const next = !hidden;
    setHiddenState(next);
    AsyncStorage.setItem(HIDDEN_KEY, next ? "1" : "0").catch(() => {});
  }, [controlled, hidden, onToggleVisibility]);

  const accountNumber = details?.accountNumber;
  const hasAccount =
    accountNumber != null && String(accountNumber).trim() !== "";

  const copyAccount = useCallback(async () => {
    if (!hasAccount) return;
    await Clipboard.setStringAsync(String(accountNumber).trim());
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }, [accountNumber, hasAccount]);

  const balanceText = hidden ? "••••••" : formatCurrency(details?.balance);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet-outline" size={18} color={Colors.brand.primary} />
          </View>
          <Text style={styles.title}>{t("balance.title")}</Text>
        </View>

        <View style={styles.headerActions}>
          {onRefresh && (
            <ActionButton
              icon="refresh-outline"
              label={t("balance.refresh")}
              onPress={onRefresh}
              disabled={loading}
            />
          )}
          {onOpenWallet && (
            <ActionButton
              icon="wallet-outline"
              label={t("balance.openWallet")}
              onPress={onOpenWallet}
            />
          )}
          {onOpenInfo && (
            <ActionButton
              icon="information-circle-outline"
              label={t("balance.moreInfo")}
              onPress={onOpenInfo}
            />
          )}
          <ActionButton
            icon={hidden ? "eye-off-outline" : "eye-outline"}
            label={hidden ? t("balance.show") : t("balance.hide")}
            onPress={toggleVisibility}
          />
        </View>
      </View>

      <View style={styles.balanceRow}>
        {loading ? (
          <View
            style={styles.skeleton}
            accessibilityLabel={t("common.loading")}
          />
        ) : (
          <Text
            style={styles.balance}
            accessibilityLabel={hidden ? t("balance.hiddenValue") : balanceText}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {balanceText}
          </Text>
        )}
        {onDeposit && (
          <Pressable
            onPress={onDeposit}
            accessibilityRole="button"
            accessibilityLabel={t("balance.deposit")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Ionicons name="add" size={22} color={Colors.button.primaryText} />
          </Pressable>
        )}
      </View>
      <Text style={styles.balanceCaption}>{t("balance.available")}</Text>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="card-outline" size={17} color={Colors.brand.primary} />
          </View>
          <View style={styles.detailText}>
            <Text style={styles.label}>{t("balance.accountNumber")}</Text>
            <Text style={styles.accountNumber} selectable>
              {formatAccountNumber(accountNumber)}
            </Text>
          </View>
          {hasAccount && (
            <ActionButton
              icon={copied ? "checkmark-outline" : "copy-outline"}
              label={copied ? t("balance.copied") : t("balance.copyAccount")}
              onPress={copyAccount}
              color={copied ? Colors.brand.primary : undefined}
            />
          )}
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="time-outline" size={17} color={Colors.brand.primary} />
          </View>
          <View style={styles.detailText}>
            <Text style={styles.label}>{t("balance.updatedAt")}</Text>
            <Text style={styles.value}>{formatDate(details?.lastUpdated)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, disabled, color = Colors.brand.primary }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.actionButton,
        (pressed || disabled) && styles.actionButtonPressed,
      ]}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionButton: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPressed: {
    opacity: 0.65,
  },
  balance: {
    flexShrink: 1,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: Colors.textLight.primary,
  },
  balanceRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.brand.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  skeleton: {
    height: 31,
    width: 150,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSoft,
  },
  balanceCaption: {
    marginTop: 1,
    fontSize: 11,
    color: Colors.textLight.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.surfaceSoft,
    marginVertical: 13,
  },
  details: {
    gap: 11,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  detailIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textLight.secondary,
  },
  accountNumber: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: Colors.textLight.primary,
    fontVariant: ["tabular-nums"],
  },
  value: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textLight.primary,
  },
});
