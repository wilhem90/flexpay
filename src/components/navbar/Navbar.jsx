import LanguageSwitcher from "@/components/languageSwitcher";
import NotificationsModal from "@/components/modal/notifications";
import PinTransactionModal from "@/components/settings/pintransaction";
import { Colors } from "@/constants/colors";
import {
  Layout,
  Radius,
  Shadow,
  Space,
  Surface,
  Type,
} from "@/constants/theme";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { Ionicons } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Navbar({
  profileVisible,
  onProfileVisibleChange,
  onOpenMenu,
}) {
  const { user, deleteAccount, configs } = useAppContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 480;

  const [localProfileVisible, setLocalProfileVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinAfterDismiss, setPinAfterDismiss] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [countNotifications, setCountNotifications] = useState(0);

  const showProfileModal = profileVisible ?? localProfileVisible;
  const setShowProfileModal = onProfileVisibleChange ?? setLocalProfileVisible;

  const isWeb = Platform.OS === "web";
  const name = user?.full_name ?? "FlexPay";
  const initial = name.trim().charAt(0).toUpperCase() || "F";
  const badgeText =
    countNotifications > 99 ? "99+" : String(countNotifications);

  const handleDeleteAccount = () => {
    setShowProfileModal(false);
    deleteAccount();
  };

  const handleReload = async () => {
    try {
      await reloadAppAsync();
    } catch (error) {
      console.error("Failed to reload the app:", error);
      showAlert(t("common.error"), t("nav.reloadFailed"));
    }
  };

  if (!user) return null;

  return (
    <>
      <View
        style={[
          styles.navbar,
          isWeb && styles.navbarWeb,
          compact && styles.navbarCompact,
          { paddingTop: isWeb ? 0 : insets.top },
        ]}
      >
        <View style={[styles.container, compact && styles.containerCompact]}>
          {onOpenMenu && (
            <Pressable
              onPress={onOpenMenu}
              accessibilityRole="button"
              accessibilityLabel={t("nav.menu")}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonActive,
              ]}
            >
              <Ionicons name="menu-outline" size={24} color={Surface.text} />
            </Pressable>
          )}

          <Pressable
            style={styles.brand}
            onPress={handleReload}
            accessibilityRole="button"
            accessibilityLabel={t("nav.reloadApp")}
          >
            <Image
              source={require("../../../assets/images/favicon.png")}
              style={styles.brandIcon}
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.brandText}>
              Flex<Text style={styles.brandAccent}>Pay</Text>
            </Text>
          </Pressable>

          <View style={[styles.right, compact && styles.rightCompact]}>
            {/* Botão de notificações */}
            <Pressable
              onPress={() => setNotificationsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("navbar.notifications")}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonActive,
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Surface.textSecondary}
              />
              {countNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{badgeText}</Text>
                </View>
              )}
            </Pressable>

            {/* Perfil */}
            <View style={styles.profileWrapper}>
              <Pressable
                onPress={() => setShowProfileModal(true)}
                style={({ pressed }) => [
                  styles.profileButton,
                  pressed && styles.profileButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("navbar.profile")}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                {!compact && (
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {t("navbar.profile")}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={showProfileModal ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Surface.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* ===== PROFILE MODAL ===== */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
        onDismiss={() => {
          if (pinAfterDismiss) {
            setPinAfterDismiss(false);
            setPinVisible(true);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowProfileModal(false)}
          />
          <View style={[styles.modal, styles.profileModalStyle]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("navbar.profile")}</Text>
              <Pressable
                onPress={() => setShowProfileModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t("notifications.close")}
              >
                <Ionicons name="close-outline" size={24} color={Surface.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator
            >
              <View style={styles.profileContent}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                </View>
                <Text style={styles.profileFullName}>{name}</Text>
                <Text style={styles.profileEmail}>{user?.email || ""}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.languageSection}>
                <Text style={styles.dropdownLabel}>{t("navbar.language")}</Text>
                <LanguageSwitcher />
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={() => {
                  setShowProfileModal(false);
                  if (Platform.OS === "ios") setPinAfterDismiss(true);
                  else setPinVisible(true);
                }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemHover,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("nav.transactionPin")}
              >
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={Colors.brand.primaryDeep}
                />
                <Text style={styles.dropdownItemText}>
                  {t("nav.transactionPin")}
                </Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                onPress={handleDeleteAccount}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemHover,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("home.deleteAccount")}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={Colors.status.error}
                />
                <Text style={styles.dropdownItemLogout}>
                  {t("home.deleteAccount")}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== PIN MODAL ===== */}
      {pinVisible && (
        <PinTransactionModal visible onClose={() => setPinVisible(false)} />
      )}

      {/* ===== NOTIFICATIONS MODAL ===== */}
      {/* Sempre montado: preserva estado de "lida" entre aberturas */}
      <NotificationsModal
        key={`${configs.baseUrl}:${user.access_token}`}
        baseUrl={configs.baseUrl}
        token={user.access_token}
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        countNotifications={setCountNotifications}
        onReadChange={setCountNotifications}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: Surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Surface.border,
    ...Shadow.sm,
  },
  navbarWeb: {
    paddingHorizontal: Space.xl,
    height: Layout.topbarHeight,
  },
  navbarCompact: { paddingHorizontal: 0 },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    height: Platform.OS === "web" ? Layout.topbarHeight : undefined,
  },
  right: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: Space.lg,
  },
  containerCompact: { paddingHorizontal: Space.sm },
  rightCompact: { gap: Space.xs },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  brandIcon: { width: 32, height: 32, borderRadius: Radius.sm },
  brandText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Surface.text,
  },
  brandAccent: { color: Colors.brand.primaryDeep },
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: Surface.soft,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.status.error,
    borderRadius: Radius.pill,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Surface.card,
  },
  notificationBadgeText: {
    color: Colors.button.primaryText,
    fontSize: 11,
    fontWeight: "700",
  },
  profileWrapper: {
    position: "relative",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
  },
  profileButtonActive: {
    backgroundColor: Surface.soft,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primaryDeep,
  },
  avatarText: {
    color: Colors.button.primaryText,
    fontSize: 14,
    fontWeight: "700",
  },
  profileInfo: {
    maxWidth: 100,
  },
  profileName: {
    ...Type.bodyStrong,
    color: Surface.text,
  },
  dropdownLabel: {
    ...Type.caption,
    color: Surface.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Space.sm,
    textAlign: "center",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: Space.md,
    paddingHorizontal: Space.md,
  },
  dropdownItemHover: {
    backgroundColor: Surface.soft,
  },
  dropdownItemText: {
    ...Type.bodyStrong,
    color: Colors.brand.primaryDeep,
  },
  dropdownItemLogout: {
    ...Type.bodyStrong,
    color: Colors.status.error,
  },
  divider: {
    height: 1,
    backgroundColor: Surface.border,
    marginVertical: Space.sm,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Space.lg,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    width: "100%",
    maxWidth: 320,
    maxHeight: 400,
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Shadow.lg,
    zIndex: 1000,
    overflow: "hidden",
  },
  profileModalStyle: {},
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: Surface.border,
  },
  modalTitle: {
    ...Type.heading,
    color: Surface.text,
    fontSize: 16,
  },
  modalContent: {
    padding: Space.lg,
    maxHeight: 300,
  },
  profileContent: {
    alignItems: "center",
    marginBottom: Space.lg,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primaryDeep,
    marginBottom: Space.md,
  },
  profileAvatarText: {
    color: Colors.button.primaryText,
    fontSize: 24,
    fontWeight: "700",
  },
  profileFullName: {
    ...Type.heading,
    color: Surface.text,
    fontSize: 16,
    marginBottom: Space.xs,
  },
  profileEmail: {
    ...Type.caption,
    color: Surface.textSecondary,
  },
  languageSection: {
    marginVertical: Space.md,
  },
});
