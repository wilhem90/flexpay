/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
import { Colors } from "@/constants/colors";
import FilterTypeTransaction from "@/components/modal/filterTypeTransaction";
import StatementModal from "@/components/modal/statement";
import { useAppContext } from "@/context/Provider";
import fetchSales from "@/services/sales";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  createElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 10;

const COLORS = {
  background: Colors.light.background,
  surface: Colors.light.surface,
  text: Colors.textLight.primary,
  muted: Colors.textLight.muted,
  border: Colors.borderLight.default,
  primary: Colors.brand.primary,
  green: Colors.status.success,
  red: Colors.status.error,
};

const formatMoney = (value, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateInput = (value, t, locale) =>
  value ? parseDate(value).toLocaleDateString(locale) : t("reports.selectDate");

const formatTime = (value, locale) =>
  new Date(value).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateLabel = (value, t, locale) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  if (sameDay(date, today)) return t("common.today");
  if (sameDay(date, yesterday)) return t("common.yesterday");

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const STATUS_KEYS = {
  completed: "statement.status.completed",
  pending: "statement.status.pending",
  failed: "statement.status.failed",
};

const statusLabel = (status, t) =>
  STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : status || t("common.unknown");

const LOCALES = { pt: "pt-BR", es: "es-ES", en: "en-US", fr: "fr-FR" };

function DateField({ value, min, max, onChange, onOpen, label }) {
  return (
    <TouchableOpacity
      style={styles.dateInput}
      onPress={Platform.OS === "web" ? undefined : onOpen}
      activeOpacity={Platform.OS === "web" ? 1 : 0.7}
    >
      <Ionicons name="calendar-clear-outline" size={17} color={COLORS.muted} />
      <Text style={[styles.dateText, !value && styles.placeholder]}>
        {label}
      </Text>
      {Platform.OS === "web" &&
        createElement("input", {
          type: "date",
          value,
          min,
          max,
          onChange: (event) => onChange(event.target.value),
          onClick: (event) => event.target.showPicker?.(),
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          },
        })}
    </TouchableOpacity>
  );
}

export default function Reports({ ref }) {
  const { t, i18n } = useTranslation();
  const locale = LOCALES[i18n.language] ?? "en-US";
  const { user, configs } = useAppContext();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestRef = useRef(0);
  const [filterVisible, setFilterVisible] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const [dateField, setDateField] = useState(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [balance, setBalance] = useState(0);
  const [serviceName, setServiceName] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [typeTransaction, setTypeTransaction] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBalance() {
      if (!configs?.baseUrl || !user?.access_token) return;

      try {
        const response = await fetch(`${configs.baseUrl}/wallets/balance`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
          },
        });
        const data_json = await response.json();
        if (data_json?.success && data_json?.data?.balance != null) {
          setBalance(data_json.data?.balance);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    }

    fetchBalance();
  }, [configs?.baseUrl, user?.access_token]);

  const loadTransactions = useCallback(
    async ({ append = false, offset = 0 } = {}) => {
      if (!configs?.baseUrl || !user?.access_token) return;

      const requestId = ++requestRef.current;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError("");
      }

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });

        // O backend deve aceitar estes parâmetros para filtrar
        // todo o período, e não apenas os registros já carregados.
        if (appliedStart) params.set("startDate", appliedStart);
        if (appliedEnd) params.set("endDate", appliedEnd);

        const response = await fetchSales(
          `${configs.baseUrl}/wallets/statements?${params.toString()}`,
          user.access_token,
        );
        if (requestId !== requestRef.current) return;

        if (response.success && Array.isArray(response.data)) {
          const page = response.data;
          setHasMore(page.length >= PAGE_SIZE);
          setTransactions((prev) => {
            if (!append) return page;
            const known = new Set(prev.map((tx) => tx.id));
            return [...prev, ...page.filter((tx) => !known.has(tx.id))];
          });
        } else if (!append) {
          setTransactions([]);
          setHasMore(false);
          setError(t("reports.failedToLoad"));
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        if (!append) setError(t("reports.connectionError"));
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [configs?.baseUrl, user?.access_token, appliedStart, appliedEnd, t],
  );

  const refresh = useCallback(() => loadTransactions(), [loadTransactions]);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore || transactions.length === 0) return;
    loadTransactions({ append: true, offset: transactions.length });
  };

  useImperativeHandle(ref, () => ({ refresh, loadMore }));

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (typeTransaction && tx.service_type !== typeTransaction)
          return false;
        const date = new Date(tx.created_at);

        if (appliedStart) {
          const start = parseDate(appliedStart);
          start.setHours(0, 0, 0, 0);
          if (date < start) return false;
        }

        if (appliedEnd) {
          const end = parseDate(appliedEnd);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [transactions, appliedStart, appliedEnd, typeTransaction]);

  const { sections, totals } = useMemo(() => {
    const grouped = {};
    let totalDebit = 0;
    let totalCredit = 0;

    filteredTransactions.forEach((tx) => {
      const label = formatDateLabel(tx.created_at, t, locale);
      setServiceName((prev) => [...prev, tx.service_type ?? "Unknown"]);

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(tx);

      if (tx.nature === "debit" && tx.status !== "pending") {
        totalDebit += Number(tx.amount) || 0;
      } else if (tx.nature === "credit" && tx.status !== "pending") {
        totalCredit += Number(tx.amount) || 0;
      }
    });

    return {
      sections: Object.entries(grouped).map(([title, data]) => ({
        title,
        data,
      })),
      totals: { totalDebit, totalCredit },
    };
  }, [filteredTransactions, t, locale]);

  const openDatePicker = (field) => {
    setDateField(field);

    const current = field === "start" ? startDate : endDate;
    setDraftDate(current ? parseDate(current) : new Date());
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setDateField(null);
    }

    if (event.type === "dismissed" || !selectedDate) return;

    setDraftDate(selectedDate);

    if (Platform.OS === "android" && dateField) {
      const value = formatDate(selectedDate);

      if (dateField === "start") setStartDate(value);
      else setEndDate(value);
    }
  };

  const confirmIOSDate = () => {
    if (!dateField) return;

    const value = formatDate(draftDate);

    if (dateField === "start") setStartDate(value);
    else setEndDate(value);

    setDateField(null);
  };

  const applyFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      setError(t("reports.invalidRange"));
      return;
    }

    setError("");
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setFilterVisible(false);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
    setError("");
    setTypeTransaction(null);
    setFilterVisible(false);
  };

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();

    start.setDate(start.getDate() - days + 1);

    const startValue = formatDate(start);
    const endValue = formatDate(end);

    setStartDate(startValue);
    setEndDate(endValue);
    setAppliedStart(startValue);
    setAppliedEnd(endValue);
    setError("");
  };

  const renderTransaction = ({ item }) => {
    const isDebit = item.nature === "debit";
    return (
      <TouchableOpacity
        style={styles.transaction}
        activeOpacity={0.3}
        onPress={() => {
          setSelectedStatement(item);
        }}
      >
        <View
          style={[
            styles.transactionIcon,
            isDebit ? styles.debitIcon : styles.creditIcon,
          ]}
        >
          {item.status === "pending" ? (
            <Ionicons name="time-outline" size={18} color={COLORS.gray} />
          ) : (
            <Ionicons
              name={isDebit ? "arrow-up" : "arrow-down"}
              size={18}
              color={isDebit ? COLORS.red : COLORS.green}
            />
          )}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>
            {isDebit ? t("common.outgoing") : t("common.incoming")}
          </Text>
          <Text style={styles.transactionDescription}>
            {item.service_type ?? t("common.unknown")}
          </Text>
          <Text style={styles.transactionSubtitle}>
            {formatTime(item.created_at, locale)} ·{" "}
            {statusLabel(item.status, t)}
          </Text>
        </View>

        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.amount,
              { color: isDebit ? COLORS.red : COLORS.green },
            ]}
          >
            {isDebit ? "−" : "+"}
            {formatMoney(item.amount, item.currency)}
          </Text>
          <Text style={styles.balance}>
            {t("common.balance")}:{" "}
            {formatMoney(item.balance_after ?? 0, item.currency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View>
        <View>
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>{t("reports.title")}</Text>
                  <Text style={styles.headerSubtitle}>
                    {t("reports.subtitle")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.filterToggle}
                  onPress={() => setFilterVisible(!filterVisible)}
                  accessibilityRole="button"
                  accessibilityLabel={t("reports.a11yToggleFilters")}
                >
                  <Ionicons
                    name="options-outline"
                    size={21}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelRow}>
                    <View
                      style={[styles.dot, { backgroundColor: COLORS.green }]}
                    />
                    <Text style={styles.summaryLabel}>
                      {t("common.incoming")}
                    </Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: COLORS.green }]}>
                    {formatMoney(totals.totalCredit)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelRow}>
                    <View
                      style={[styles.dot, { backgroundColor: COLORS.red }]}
                    />
                    <Text style={styles.summaryLabel}>
                      {t("common.outgoing")}
                    </Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: COLORS.red }]}>
                    {formatMoney(totals.totalDebit)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t("common.balance")}</Text>
                  <Text style={styles.summaryValue}>
                    {formatMoney(balance)}
                  </Text>
                </View>
              </View>
            </View>

            {filterVisible && (
              <View style={styles.filterBox}>
                <View style={styles.filterTitleRow}>
                  <View style={styles.filterTitleLeft}>
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={COLORS.text}
                    />
                    <Text style={styles.filterTitle}>
                      {t("reports.filterPeriod")}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={clearFilter}>
                    <Text style={styles.clearText}>{t("reports.clear")}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.inputLabel}>
                      {t("reports.startDate")}
                    </Text>
                    <DateField
                      value={startDate}
                      max={endDate || undefined}
                      onChange={setStartDate}
                      onOpen={() => openDatePicker("start")}
                      label={formatDateInput(startDate, t, locale)}
                    />
                  </View>

                  <View style={styles.dateColumn}>
                    <Text style={styles.inputLabel}>
                      {t("reports.endDate")}
                    </Text>
                    <DateField
                      value={endDate}
                      min={startDate || undefined}
                      onChange={setEndDate}
                      onOpen={() => openDatePicker("end")}
                      label={formatDateInput(endDate, t, locale)}
                    />
                  </View>
                </View>

                <Text style={styles.quickLabel}>
                  {t("reports.quickShortcuts")}
                </Text>

                <View style={styles.quickRow}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => setQuickRange(1)}
                  >
                    <Text style={styles.quickText}>{t("common.today")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => setQuickRange(7)}
                  >
                    <Text style={styles.quickText}>{t("common.days7")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => setQuickRange(30)}
                  >
                    <Text style={styles.quickText}>{t("common.days30")}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.typeFilter}>
                  <FilterTypeTransaction
                    listItems={serviceName}
                    onChange={setTypeTransaction}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilter}
                >
                  <Ionicons name="filter-outline" size={18} color={Colors.button.primaryText} />
                  <Text style={styles.applyButtonText}>
                    {t("reports.applyFilters")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>
                  {t("reports.transactions")}
                </Text>
                <Text style={styles.resultsSubtitle}>
                  {t("reports.transactionsFound", {
                    count: filteredTransactions.length,
                  })}
                </Text>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={COLORS.muted} />
              ) : (
                <TouchableOpacity onPress={refresh} disabled={loading}>
                  <Ionicons
                    name="refresh-outline"
                    size={21}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>
                {t("reports.items", { count: section.data.length })}
              </Text>
            </View>

            {section.data.map((tx) => (
              <View key={tx.id}>{renderTransaction({ item: tx })}</View>
            ))}
          </View>
        ))}

        {loadingMore && (
          <ActivityIndicator
            style={styles.footerLoader}
            size="small"
            color={COLORS.primary}
          />
        )}

        {sections.length === 0 && (
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={30}
                    color={COLORS.muted}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {error
                    ? t("reports.failedToLoadTitle")
                    : t("reports.noTransactionsTitle")}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {error || t("reports.noTransactionsMessage")}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {dateField && (
        <View style={styles.datePickerContainer}>
          {Platform.OS === "ios" && (
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setDateField(null)}>
                <Text style={styles.clearText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                {dateField === "start"
                  ? t("reports.startDateShort")
                  : t("reports.endDateShort")}
              </Text>
              <TouchableOpacity onPress={confirmIOSDate}>
                <Text style={styles.confirmText}>{t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          )}

          <DateTimePicker
            value={draftDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={
              dateField === "start" && endDate ? parseDate(endDate) : new Date()
            }
            minimumDate={
              dateField === "end" && startDate
                ? parseDate(startDate)
                : undefined
            }
            onValueChange={onDateChange}
          />
        </View>
      )}

      {selectedStatement && (
        <StatementModal
          visible={true}
          statement={selectedStatement}
          onClose={() => setSelectedStatement(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: { marginVertical: 20 },
  header: {
    paddingHorizontal: 20,
  },
  typeFilter: {
    zIndex: 1,
    marginTop: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginTop: 22,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.muted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
    marginHorizontal: 9,
  },
  filterBox: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: Colors.light.surface,
    marginBottom: 24,
  },
  filterTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  filterTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: COLORS.muted,
    marginBottom: 8,
  },
  dateInput: {
    minHeight: 48,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: Colors.light.surface,
  },
  dateText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  placeholder: {
    color: Colors.textLight.secondary,
    fontWeight: "400",
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: COLORS.muted,
    marginTop: 18,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 12,
  },
  applyButton: {
    height: 48,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.button.primaryText,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: COLORS.muted,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 11,
    color: COLORS.muted,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: Colors.light.surface,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  debitIcon: {
    backgroundColor: Colors.light.surfaceSoft,
  },
  creditIcon: {
    backgroundColor: Colors.light.surfaceSoft,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  transactionSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },
  transactionDescription: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
    textTransform: "capitalize",
  },
  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  amount: {
    fontSize: 13,
    fontWeight: "800",
  },
  balance: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 5,
  },
  empty: {
    flex: 1,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 35,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 7,
  },
  datePickerContainer: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  datePickerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.green,
  },
});
