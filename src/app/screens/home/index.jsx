import Balance from "@/components/balance";
import Message from "@/components/message";
import DepositModal from "@/components/modal/deposit";
import LanguageModal from "@/components/modal/language";
import Reports from "@/components/reports";
import { Colors } from "@/constants/colors";
import { useAuthUser } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SHORTCUT_COLORS = {
  sales: { bg: Colors.light.surfaceSoft, fg: Colors.status.info },
  reports: { bg: Colors.light.surfaceSoft, fg: Colors.brand.primaryDeep },
  transfer: { bg: Colors.light.surfaceSoft, fg: Colors.brand.secondary },
  topup: { bg: Colors.light.surfaceSoft, fg: Colors.transactions.fee },
  settings: { bg: Colors.light.surfaceSoft, fg: Colors.transactions.refund },
  machine: { bg: Colors.light.surfaceSoft, fg: Colors.textLight.secondary },
};

const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "home.goodMorning";
  if (hour < 18) return "home.goodAfternoon";
  return "home.goodEvening";
};

const getShortcuts = (t) => [
  {
    key: "topup",
    label: t("home.topupsAnywhere"),
    icon: "phone-portrait-outline",
    onPress: () => router.push("screens/topup"),
  },
  {
    key: "transfer",
    label: t("home.sendMoneyHaiti"),
    icon: "paper-plane-outline",
    onPress: () => router.push("screens/transfer"),
  },
  {
    key: "reports",
    label: t("home.salesReports"),
    icon: "dice",
    onPress: () =>
      showAlert(t("home.salesReportsTitle"), t("home.salesReportsMessage")),
  },
  {
    key: "sales",
    label: t("home.checkSales"),
    icon: "pie-chart-outline",
  },
  {
    key: "settings",
    label: t("home.companySettings"),
    icon: "storefront-outline",
    onPress: () => router.push("screens/settings"),
  },
  {
    key: "machine",
    label: t("home.machineSettings"),
    icon: "options-outline",
    onPress: () =>
      showAlert(
        t("home.machineSettingsTitle"),
        t("home.machineSettingsMessage"),
      ),
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, logout, getBalance, configs, showToast } = useAuthUser();
  const scrollRef = useRef(null);
  const reportsRef = useRef(null);
  const reportsY = useRef(0);
  const scrollToReports = useCallback(() => {
    scrollRef.current?.scrollTo({ y: reportsY.current, animated: true });
  }, []);
  const SHORTCUTS = getShortcuts(t);
  const PROMO_MESSAGE = t("home.promoMessage");
  const [isSaleModalVisible, setIsSaleModalVisible] = useState(false);
  const [isDepositVisible, setIsDepositVisible] = useState(false);
  const [isLanguageVisible, setIsLanguageVisible] = useState(false);
  const isActionPending = useRef(false);

  const displayName = user?.full_name ?? "Loja";
  const initial = displayName.trim().charAt(0).toUpperCase() || "F";
  const greeting = t(getGreetingKey());
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const balanceDetails = useMemo(
    () => ({
      balance: wallet?.balance,
      currency: configs?.currency,
      lastUpdated,
      accountNumber: wallet?.account_number,
    }),
    [wallet, configs?.currency, lastUpdated],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    reportsRef.current?.refresh();
    try {
      setWallet(await getBalance());
      setLastUpdated(new Date().toISOString());
    } catch {
      showToast("error", t("home.balanceFailed"));
    } finally {
      setRefreshing(false);
    }
  }, [getBalance, showToast, t]);

  useEffect(() => {
    let active = true;
    getBalance()
      .then((value) => {
        if (!active) return;
        setWallet(value);
        setLastUpdated(new Date().toISOString());
      })
      .catch(() => active && showToast("error", t("home.balanceFailed")));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token]);

  const handleSinglePress = useCallback((action) => {
    if (isActionPending.current) return;
    isActionPending.current = true;
    action();
    setTimeout(() => {
      isActionPending.current = false;
    }, 500);
  }, []);

  const handleLogout = useCallback(() => {
    showAlert(t("home.exit"), t("home.logoutConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("home.logout"),
        style: "destructive",
        onPress: () => {
          handleSinglePress(() => {
            try {
              logout();
              router.replace("/");
              // eslint-disable-next-line no-unused-vars
            } catch (error) {
              showAlert(t("common.error"), t("home.logoutFailed"), undefined, {
                type: "error",
              });
            }
          });
        },
      },
    ]);
  }, [handleSinglePress, logout, t]);

  const handleSellPress = useCallback(() => {
    handleSinglePress(() => setIsSaleModalVisible(true));
  }, [handleSinglePress]);

  const handleShortcut = (shortcut) => {
    setIsSaleModalVisible(false);
    setTimeout(
      shortcut.key === "sales" ? scrollToReports : shortcut.onPress,
      150,
    );
  };

  const handleMessagePress = useCallback(() => {
    handleSinglePress(() => showAlert(t("home.promotion"), PROMO_MESSAGE));
  }, [handleSinglePress, t, PROMO_MESSAGE]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 300
          ) {
            reportsRef.current?.loadMore();
          }
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => setIsLanguageVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t("settings.language")}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <View style={styles.nameRow}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={Colors.brand.primary}
                />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLogout}
            accessibilityLabel={t("home.a11yLogout")}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.brand.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.content}>
            <Balance
              details={balanceDetails}
              loading={refreshing}
              onRefresh={handleRefresh}
              onDeposit={() => setIsDepositVisible(true)}
            />
            <Message text={PROMO_MESSAGE} onPress={handleMessagePress} />
            {/* Sell Card */}
            <TouchableOpacity
              style={styles.sellCard}
              onPress={handleSellPress}
              accessibilityRole="button"
              accessibilityLabel={t("home.a11yStartSale")}
              activeOpacity={0.85}
            >
              <View style={styles.sellIconWrapper}>
                <Ionicons name="flash" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.sellTextWrapper}>
                <Text style={styles.sellTitle}>{t("home.startSale")}</Text>
                <Text style={styles.sellSubtitle}>
                  {t("home.chargeCustomer")}
                </Text>
              </View>
              <View style={styles.sellChevron}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View
          onLayout={(event) => {
            reportsY.current = event.nativeEvent.layout.y;
          }}
        >
          <Reports ref={reportsRef} />
        </View>
      </ScrollView>

      <Modal
        visible={isSaleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSaleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("home.quickAccess")}</Text>
              <TouchableOpacity
                onPress={() => setIsSaleModalVisible(false)}
                hitSlop={12}
                style={styles.modalClose}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color={Colors.brand.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {SHORTCUTS.map((shortcut) => {
                const color = SHORTCUT_COLORS[shortcut.key];
                return (
                  <View key={shortcut.key} style={styles.shortcutCell}>
                    <TouchableOpacity
                      style={styles.shortcut}
                      onPress={() => handleShortcut(shortcut)}
                      accessibilityRole="button"
                      accessibilityLabel={shortcut.label.replace("\n", " ")}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.shortcutIcon,
                          { backgroundColor: color.bg },
                        ]}
                      >
                        <Ionicons
                          name={shortcut.icon}
                          size={24}
                          color={color.fg}
                        />
                      </View>
                      <Text style={styles.shortcutLabel} numberOfLines={3}>
                        {shortcut.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <LanguageModal
        visible={isLanguageVisible}
        onClose={() => setIsLanguageVisible(false)}
      />

      {isDepositVisible && (
        <DepositModal
          visible
          onClose={() => setIsDepositVisible(false)}
          onSuccess={handleRefresh}
          baseUrl={configs?.baseUrl}
          token={user?.access_token}
          accountNumber={wallet?.account_number}
          currency={configs?.currency}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: 12,
  },
  scrollContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    flexGrow: 1,
    paddingBottom: 24,
    backgroundColor: "transparent",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primary,
    borderWidth: 3,
    borderColor: Colors.borderLight.default,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textLight.primary,
    fontWeight: "500",
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textLight.primary,
    maxWidth: 220,
    textTransform: "capitalize",
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /* Sell Card */
  sellCard: {
    backgroundColor: Colors.brand.primaryDeep,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 12,
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  sellIconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000D2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 1,
  },
  sellTextWrapper: {
    flex: 1,
  },
  sellTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  sellSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  sellChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Quick access modal */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 17, 0.55)",
  },
  modalSheet: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: Colors.light.surfaceSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceSoft,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  shortcutCell: {
    width: "33.33%",
    padding: 5,
  },
  shortcut: {
    flex: 1,
    minHeight: 108,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
  },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontSize: 12,
    color: Colors.textLight.primary,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
});
