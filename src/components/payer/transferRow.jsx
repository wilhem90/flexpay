import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDateTime, formatMoney, getLocale, getStatusStyle } from "./status";

export function StatusBadge({ status, size = 12 }) {
  const { t } = useTranslation();
  const style = getStatusStyle(status);
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon} size={size} color={style.fg} />
      <Text style={[styles.badgeText, { color: style.fg }]} numberOfLines={1}>
        {t(`transfers.status.${status}`, { defaultValue: String(status) })}
      </Text>
    </View>
  );
}

export default function TransferRow({ item, onPress }) {
  const { i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.beneficiary_name} — ${item.status}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sequence}>#{item.sequence_number}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.date}>{formatDateTime(item.created_at, locale)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.bodyLeft}>
          <Text style={styles.beneficiary} numberOfLines={1}>
            {item.beneficiary_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.operator_name} • {item.account_number}
          </Text>
        </View>
        <View style={styles.bodyRight}>
          <Text style={styles.amount}>
            {formatMoney(item.send_value, item.send_currency, locale)}
          </Text>
          <Text style={styles.received}>
            → {formatMoney(item.received_value, item.received_currency, locale)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surface,
    gap: 12,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sequence: { fontSize: 13, fontWeight: "700", color: Colors.textLight.secondary },
  date: { fontSize: 11, color: Colors.textLight.muted },
  body: { flexDirection: "row", alignItems: "center", gap: 12 },
  bodyLeft: { flex: 1 },
  bodyRight: { alignItems: "flex-end" },
  beneficiary: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textLight.primary,
    textTransform: "capitalize",
  },
  meta: { fontSize: 12, color: Colors.textLight.secondary, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "700", color: Colors.textLight.primary },
  received: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.brand.primaryDeep,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
});
