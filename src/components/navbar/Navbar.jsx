import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { Layout, Radius, Shadow, Space, Surface, Type } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LanguageSwitcher from "@/components/languageSwitcher";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAppContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!user) return null;

  const isWeb = Platform.OS === "web";
  const name = user?.full_name ?? "FlexPay";
  const initial = name.trim().charAt(0).toUpperCase() || "F";

  const handleLogout = () => {
    setShowProfileModal(false);
    logout();
  };

  return (
    <>
      <View
        style={[
          styles.navbar,
          isWeb && styles.navbarWeb,
          { paddingTop: isWeb ? 0 : insets.top },
        ]}
      >
        <View style={styles.container}>
          {/* Right - Notifications + Profile */}
          <View style={styles.right}>
            {/* Notifications Bell */}
            <Pressable
              onPress={() => setShowNotificationsModal(true)}
              style={({ pressed, hovered }) => [
                styles.iconButton,
                (pressed || hovered) && styles.iconButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("navbar.notifications") || "Notifications"}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Surface.textSecondary}
              />
              {/* Notification badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>

            {/* Profile Menu */}
            <View style={styles.profileWrapper}>
              <Pressable
                onPress={() => setShowProfileModal(true)}
                style={({ pressed, hovered }) => [
                  styles.profileButton,
                  (pressed || hovered) && styles.profileButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("navbar.profile") || "Profile"}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
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

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowNotificationsModal(false)}
          />
          <View style={[styles.modal, styles.notificationsModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("navbar.notifications") || "Notifications"}</Text>
              <Pressable
                onPress={() => setShowNotificationsModal(false)}
                accessibilityRole="button"
              >
                <Ionicons name="close-outline" size={24} color={Surface.text} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          </View>
        </>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowProfileModal(false)}
          />
          <View style={[styles.modal, styles.profileModalStyle]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("navbar.profile") || "Profile"}</Text>
              <Pressable
                onPress={() => setShowProfileModal(false)}
                accessibilityRole="button"
              >
                <Ionicons name="close-outline" size={24} color={Surface.text} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.profileContent}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                </View>
                <Text style={styles.profileFullName}>{name}</Text>
                <Text style={styles.profileEmail}>{user?.email || "user@example.com"}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.languageSection}>
                <Text style={styles.dropdownLabel}>{t("navbar.language") || "Language"}</Text>
                <LanguageSwitcher compact dropdown />
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={handleLogout}
                style={({ pressed, hovered }) => [
                  styles.dropdownItem,
                  (pressed || hovered) && styles.dropdownItemHover,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("home.logout") || "Logout"}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={Colors.status.error}
                />
                <Text style={styles.dropdownItemLogout}>
                  {t("home.logout") || "Logout"}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
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
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    height: Platform.OS === "web" ? Layout.topbarHeight : undefined,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.lg,
  },
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
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.status.error,
    borderRadius: Radius.pill,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Surface.card,
  },
  badgeText: {
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
  dropdownHeader: {
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
  },
  dropdownLabel: {
    ...Type.caption,
    color: Surface.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Space.sm,
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
  dropdownItemLogout: {
    ...Type.bodyStrong,
    color: Colors.status.error,
  },
  divider: {
    height: 1,
    backgroundColor: Surface.border,
    marginVertical: Space.sm,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -150,
    marginTop: -150,
    width: 300,
    maxHeight: 400,
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Shadow.lg,
    zIndex: 1000,
    overflow: "hidden",
  },
  notificationsModal: {
    marginTop: -100,
  },
  profileModalStyle: {
    width: 320,
    marginLeft: -160,
  },
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
  emptyText: {
    ...Type.body,
    color: Surface.textSecondary,
    textAlign: "center",
    paddingVertical: Space.xl,
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
