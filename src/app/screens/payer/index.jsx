/* eslint-disable react-hooks/set-state-in-effect */
import NotificationsModal from "@/components/modal/notifications";
import CustomPeriod from "@/components/payer/customPeriod";
import {
  getPeriodRange,
  sortTransfers,
  STATUS_PRIORITY,
} from "@/components/payer/status";
import TransferModal from "@/components/payer/transferModal";
import TransferRow from "@/components/payer/transferRow";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { getTransfers } from "@/services/transfer";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Platform,
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
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [customVisible, setCustomVisible] = useState(false);
  const [customRange, setCustomRange] = useState(null);
  const [status, setStatus] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const requestId = useRef(0);

  const period = useMemo(
    () => PERIODS.find((p) => p.key === periodKey) ?? PERIODS[2],
    [periodKey],
  );

  /* ------------------------------ Fetch ---------------------------------- */

  const fetchPage = useCallback(
    async (offset) => {
      const { startDate, endDate } =
        periodKey === "custom" && customRange
          ? customRange
          : getPeriodRange(period.days);
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
    [
      configs.baseUrl,
      user.access_token,
      period.days,
      periodKey,
      customRange,
      t,
    ],
  );

  const load = useCallback(
    async (mode = "initial") => {
      const id = ++requestId.current;
      setError(null);
      setLoadingMore(false);

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
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore) return;

    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage(transfers.length);
      if (id !== requestId.current) return;
      setTransfers((prev) => {
        const known = new Set(prev.map((x) => x.id));
        return [...prev, ...page.filter((x) => !known.has(x.id))];
      });
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      if (id === requestId.current)
        showToast?.("error", err?.message || t("transfers.loadFailed"));
    } finally {
      if (id === requestId.current) setLoadingMore(false);
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

  const sorted = useMemo(
    () =>
      sortTransfers(
        status ? transfers.filter((item) => item.status === status) : transfers,
      ),
    [transfers, status],
  );
  const pendingCount = useMemo(
    () => transfers.filter((x) => x.status === "pending").length,
    [transfers],
  );

  /* ------------------------------ Handlers ------------------------------- */

  const handlePeriodChange = useCallback(
    (key) => {
      if (key === periodKey) return;
      requestId.current += 1;
      setTransfers([]);
      setHasMore(false);
      setLoadingMore(false);
      setCustomVisible(false);
      setPeriodKey(key);
    },
    [periodKey],
  );

  const handleLogout = useCallback(() => {
    showAlert(t("home.exit"), t("home.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("home.logout"),
        style: "destructive",
        onPress: logout,
      },
    ]);
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
        {Platform.OS !== "web" && (
          <>
            <TouchableOpacity
              onPress={() => setNotificationsVisible(true)}
              style={styles.logout}
              accessibilityRole="button"
              accessibilityLabel={t("navbar.notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.textLight.secondary}
              />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? "10+" : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
          </>
        )}
      </View>

      <SummaryCard total={transfers.length} pending={pendingCount} t={t} />

      <PeriodChips periodKey={periodKey} onChange={handlePeriodChange} t={t} />
      <TouchableOpacity
        style={[
          styles.chip,
          periodKey === "custom" && styles.chipActive,
          styles.customButton,
        ]}
        onPress={() => setCustomVisible((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: customVisible }}
      >
        <Ionicons
          name="options-outline"
          size={14}
          color={
            periodKey === "custom"
              ? Colors.button.primaryText
              : Colors.textLight.secondary
          }
        />
        <Text
          style={[
            styles.chipText,
            periodKey === "custom" && styles.chipTextActive,
          ]}
        >
          {t("transfers.customPeriod")}
        </Text>
      </TouchableOpacity>
      {periodKey === "custom" && customRange && (
        <Text style={styles.filterHint}>
          {customRange.startDate} – {customRange.endDate}
        </Text>
      )}
      {customVisible && (
        <CustomPeriod
          initialStart={customRange?.start || null}
          initialEnd={customRange?.end || null}
          onClose={() => setCustomVisible(false)}
          onApply={(range) => {
            requestId.current += 1;
            setTransfers([]);
            setHasMore(false);
            setLoadingMore(false);
            setCustomRange(range);
            setPeriodKey("custom");
            setCustomVisible(false);
          }}
        />
      )}
      <Text style={styles.filterLabel}>{t("transfers.filterStatus")}</Text>
      <View style={styles.statusDropdown}>
        <TouchableOpacity
          style={styles.statusTrigger}
          onPress={() => setStatusOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={t("transfers.filterStatus")}
          accessibilityState={{ expanded: statusOpen }}
        >
          <Text style={styles.statusText}>
            {status
              ? t(`transfers.status.${status}`)
              : t("transfers.allStatuses")}
          </Text>
          <Ionicons
            name={statusOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.brand.primaryDeep}
          />
        </TouchableOpacity>
        {statusOpen && (
          <View style={styles.statusOptions}>
            {[null, ...Object.keys(STATUS_PRIORITY)].map((value) => (
              <TouchableOpacity
                key={value || "all"}
                onPress={() => {
                  setStatus(value);
                  setStatusOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: status === value }}
                style={styles.statusOption}
              >
                <Text style={styles.statusText}>
                  {value
                    ? t(`transfers.status.${value}`)
                    : t("transfers.allStatuses")}
                </Text>
                {status === value && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={Colors.brand.primaryDeep}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.filterHint}>{t("transfers.loadedFilterNote")}</Text>
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
          ) : hasMore && !loading && !refreshing ? (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={loadMore}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>
                {t("dashboardInfo.loadMore")}
              </Text>
            </TouchableOpacity>
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
        onEndReached={status ? undefined : loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TransferRow item={item} onPress={() => setSelected(item)} />
        )}
      />

      {selected && (
        <TransferModal
          transfer={selected}
          onClose={() => setSelected(null)}
          fetchTransfers={() => fetchPage()}
          editEmail={selected.status === "delivered"}
        />
      )}
      <NotificationsModal
        key={`${configs.baseUrl}:${user.access_token}`}
        baseUrl={configs.baseUrl}
        token={user.access_token}
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        countNotifications={setNotificationCount}
      />
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
  notificationBadge: {
    position: "absolute",
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: Colors.status.error,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: Colors.button.primaryText,
    fontSize: 10,
    fontWeight: "700",
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
  customButton: { alignSelf: "flex-start" },
  filterLabel: { color: Colors.textLight.primary, fontWeight: "700" },
  statusDropdown: {
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.light.surface,
    overflow: "hidden",
  },
  statusTrigger: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  statusOptions: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight.default,
  },
  statusOption: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  statusText: { color: Colors.textLight.primary, fontSize: FONT.md },
  filterHint: { color: Colors.textLight.secondary, fontSize: FONT.xs },
  loadMore: { alignItems: "center", padding: SPACING.lg },
  actionText: { color: Colors.brand.primaryDeep, fontWeight: "700" },

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
