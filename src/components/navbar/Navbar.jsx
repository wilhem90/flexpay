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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!user) return null;

  const isWeb = Platform.OS === "web";
  const name = user?.full_name ?? "FlexPay";
  const initial = name.trim().charAt(0).toUpperCase() || "F";

  const handleLogout = () => {
    setShowProfileMenu(false);
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
          {/* Left - Logo/Brand */}
          <View style={styles.left}>
            <View style={styles.logo}>
              <Ionicons name="wallet-outline" size={22} color={Colors.brand.primaryDeep} />
            </View>
            <Text style={styles.brandText}>FlexPay</Text>
          </View>

          {/* Right - Notifications + Profile */}
          <View style={styles.right}>
            {/* Notifications Bell */}
            <Pressable
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
                onPress={() => setShowProfileMenu(!showProfileMenu)}
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
                  name={showProfileMenu ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Surface.textSecondary}
                />
              </Pressable>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <View style={[styles.dropdown, isWeb && styles.dropdownWeb]}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownLabel}>{t("navbar.language") || "Language"}</Text>
                    <View style={styles.divider} />
                  </View>

                  <LanguageSwitcher compact dropdown />

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
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Backdrop - close menu on tap outside */}
      {showProfileMenu && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowProfileMenu(false)}
        />
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
    justifyContent: "space-between",
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    height: Platform.OS === "web" ? Layout.topbarHeight : undefined,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.statusLight.infoBackground,
  },
  brandText: {
    ...Type.heading,
    color: Surface.text,
    fontWeight: "700",
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
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: Space.sm,
    minWidth: 200,
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Shadow.md,
    overflow: "hidden",
    zIndex: 1000,
  },
  dropdownWeb: {
    marginTop: Space.md,
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
  },
});
