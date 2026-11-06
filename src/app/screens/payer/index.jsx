/* eslint-disable react-hooks/set-state-in-effect */
import { getPeriodRange, sortTransfers } from "@/components/payer/status";
import TransferModal from "@/components/payer/transferModal";
import TransferRow from "@/components/payer/transferRow";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { getTransfers } from "@/services/transfer";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* -------------------------------------------------------------------------- */
/*                                  Constantes                                */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 50;

const PERIODS = [
  { key: "today", days: 1, i18n: "common.today", icon: "today-outline" },
  { key: "days7", days: 7, i18n: "common.days7", icon: "calendar-outline" },
  {
    key: "days30",
    days: 30,
    i18n: "common.days30",
    icon: "calendar-number-outline",
  },
];

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };
const FONT = { xs: 12, sm: 13, md: 15, lg: 18, xl: 22, xxl: 26 };

/* -------------------------------------------------------------------------- */
/*                              Subcomponentes                                 */
/* -------------------------------------------------------------------------- */

function SummaryCard({ total, pending, t }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryItem}>
        <View
          style={[
            styles.summaryIcon,
            { backgroundColor: `${Colors.brand.primaryDeep}15` },
          ]}
        >
          <Ionicons
            name="swap-horizontal"
            size={18}
            color={Colors.brand.primaryDeep}
          />
        </View>
        <View>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>
            {t("transfers.totalLabel") ?? "Total"}
          </Text>
        </View>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryItem}>
        <View style={[styles.summaryIcon, { backgroundColor: "#F59E0B15" }]}>
          <Ionicons name="time-outline" size={18} color="#F59E0B" />
        </View>
        <View>
          <Text style={styles.summaryValue}>{pending}</Text>
          <Text style={styles.summaryLabel}>
            {t("transfers.pendingLabel") ?? "Pendentes"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PeriodChips({ periodKey, onChange, t }) {
  return (
    <View style={styles.chips}>
      {PERIODS.map((p) => {
        const active = p.key === periodKey;
        return (
          <TouchableOpacity
            key={p.key}
            onPress={() => onChange(p.key)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(p.i18n)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={p.icon}
              size={14}
              color={
                active ? Colors.button.primaryText : Colors.textLight.secondary
              }
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {t(p.i18n)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EmptyState({ loading, error, onRetry, t }) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand.primaryDeep} />
        <Text style={styles.muted}>
          {t("common.loading") ?? "Carregando..."}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.stateIcon}>
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={Colors.brand.primaryDeep}
          />
        </View>
        <Text style={styles.stateTitle}>{t("common.error") ?? "Erro"}</Text>
        <Text style={styles.muted}>{error}</Text>
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retry}
          activeOpacity={0.85}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={Colors.button.primaryText}
          />
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.stateIcon}>
        <Ionicons
          name="paper-plane-outline"
          size={32}
          color={Colors.textLight.disabled}
        />
      </View>
      <Text style={styles.stateTitle}>
        {t("transfers.emptyTitle") ?? "Sem transferências"}
      </Text>
      <Text style={styles.muted}>{t("transfers.empty")}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Ecrã principal                             */
/* -------------------------------------------------------------------------- */

export default function PayerTransfersScreen() {
  const { t } = useTranslation();
  const { user, configs, logout, showToast } = useAppContext();

  const [periodKey, setPeriodKey] = useState("days30");
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const requestId = useRef(0);

  const period = useMemo(
    () => PERIODS.find((p) => p.key === periodKey) ?? PERIODS[2],
    [periodKey],
  );

  /* ------------------------------ Fetch ---------------------------------- */

  const fetchPage = useCallback(
    async (offset) => {
      const { startDate, endDate } = getPeriodRange(period.days);
      const query = new URLSearchParams({
        limit: Number(PAGE_SIZE),
        offset: Number(offset),
        startDate,
        endDate,
      });

      const data = await getTransfers(
        `${configs.baseUrl}/transfers/get-transfers?${query.toString()}`,
        user.access_token,
      );

      if (!data?.success) {
        throw new Error(data?.message || t("transfers.loadFailed"));
      }
      return data.transfers ?? [];
    },
    [configs.baseUrl, user.access_token, period.days, t],
  );

  const load = useCallback(
    async (mode = "initial") => {
      const id = ++requestId.current;
      setError(null);

      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      try {
        const page = await fetchPage(0);
        if (id !== requestId.current) return;

        setTransfers(page);
        setHasMore(page.length === PAGE_SIZE);
      } catch (err) {
        if (id !== requestId.current) return;
        const message = err?.message || t("transfers.loadFailed");
        setError(message);
        showToast?.("error", message);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchPage, showToast, t],
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore) return;

    setLoadingMore(true);
    try {
      const page = await fetchPage(transfers.length);
      setTransfers((prev) => {
        const known = new Set(prev.map((x) => x.id));
        return [...prev, ...page.filter((x) => !known.has(x.id))];
      });
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      showToast?.("error", err?.message || t("transfers.loadFailed"));
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    loading,
    refreshing,
    hasMore,
    fetchPage,
    transfers.length,
    showToast,
    t,
  ]);

  /* ------------------------------ Derivados ------------------------------ */

  const sorted = useMemo(() => sortTransfers(transfers), [transfers]);
  const pendingCount = useMemo(
    () => transfers.filter((x) => x.status === "pending").length,
    [transfers],
  );

  /* ------------------------------ Handlers ------------------------------- */

  const handlePeriodChange = useCallback(
    (key) => {
      if (key === periodKey) return;
      setTransfers([]);
      setHasMore(false);
      setPeriodKey(key);
    },
    [periodKey],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("common.logoutTitle") ?? "Sair",
      t("common.logoutMessage") ?? "Deseja encerrar sessão?",
      [
        { text: t("common.cancel") ?? "Cancelar", style: "cancel" },
        {
          text: t("common.logout") ?? "Sair",
          style: "destructive",
          onPress: () => logout?.(),
        },
      ],
    );
  }, [logout, t]);

  /* ------------------------------ Header -------------------------------- */

  const header = (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("transfers.title")}</Text>
          <Text style={styles.subtitle}>
            {t("transfers.summary", {
              count: transfers.length,
              pending: pendingCount,
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel={t("home.a11yLogout") ?? "Logout"}
          activeOpacity={0.7}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.textLight.secondary}
          />
        </TouchableOpacity>
      </View>

      <SummaryCard total={transfers.length} pending={pendingCount} t={t} />

      <PeriodChips periodKey={periodKey} onChange={handlePeriodChange} t={t} />
    </View>
  );

  /* ------------------------------ Render -------------------------------- */

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            loading={loading}
            error={error}
            onRetry={() => load()}
            t={t}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.brand.primaryDeep} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor={Colors.brand.primaryDeep}
            colors={[Colors.brand.primaryDeep]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TransferRow item={item} onPress={() => setSelected(item)} />
        )}
      />

      <TransferModal transfer={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Estilos                                  */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },

  /* Header */
  header: { gap: SPACING.lg, marginBottom: SPACING.lg },
  headerTop: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  headerText: { flex: 1 },
  title: {
    fontSize: FONT.xl,
    fontWeight: "800",
    color: Colors.textLight.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: Colors.textLight.secondary,
    marginTop: 2,
  },
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Summary card */
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    padding: SPACING.lg,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: FONT.lg,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  summaryLabel: {
    fontSize: FONT.xs,
    color: Colors.textLight.secondary,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight.default,
    marginHorizontal: SPACING.md,
  },

  /* Chips */
  chips: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
  },
  chipActive: {
    backgroundColor: Colors.brand.primaryDeep,
    borderColor: Colors.brand.primaryDeep,
  },
  chipText: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: Colors.textLight.secondary,
  },
  chipTextActive: { color: Colors.button.primaryText },

  /* Estados */
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    minHeight: 280,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.brand.primaryDeep}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  stateTitle: {
    fontSize: FONT.md,
    fontWeight: "700",
    color: Colors.textLight.primary,
    textAlign: "center",
  },
  muted: {
    fontSize: FONT.sm,
    color: Colors.textLight.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.brand.primaryDeep,
  },
  retryText: {
    color: Colors.button.primaryText,
    fontWeight: "700",
    fontSize: FONT.sm,
  },

  /* Footer */
  footer: { paddingVertical: SPACING.lg, alignItems: "center" },
});
