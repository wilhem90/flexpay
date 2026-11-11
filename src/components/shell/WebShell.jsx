import Navbar from "@/components/navbar/Navbar";
import Colors from "@/constants/colors";
import { Layout, Radius, Space } from "@/constants/theme";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const NAV_ITEMS = [
  {
    key: "home",
    path: "/screens/home",
    icon: "home-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },
  {
    key: "transfer",
    path: "/screens/transfer",
    icon: "paper-plane-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },
  {
    key: "topup",
    path: "/screens/topup",
    icon: "phone-portrait-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },
  {
    key: "bets",
    path: "/screens/bets",
    icon: "dice-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },

  {
    key: "employees",
    path: "/screens/employees",
    icon: "people-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },
  {
    key: "settings",
    path: "/screens/settings",
    icon: "settings-outline",
    shows: ["company", "employee", "admin", "superadmin"],
  },
];

const isActive = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

function NavItem({ item, label, active, onNavigate }) {
  return (
    <Pressable
      onPress={() => {
        onNavigate?.();
        router.navigate(item.path);
      }}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ hovered }) => [
        styles.navItem,
        hovered && !active && styles.navHover,
        active && styles.navActive,
      ]}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={active ? "#1e5a96" : "#666666"}
      />
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Sidebar({ items, pathname, user, onProfile, onLogout, onNavigate }) {
  const { t } = useTranslation();

  return (
    <View style={styles.sidebar} accessibilityRole="navigation">
      <ScrollView
        style={styles.sidebarContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={32} color="#999999" />
          </View>

          <Pressable
            onPress={onProfile}
            style={styles.profileButton}
            accessibilityRole="button"
          >
            <View style={styles.profileButtonContent}>
              <Text style={styles.profileName}>
                {user?.full_name || "User"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#1e5a96" />
            </View>
          </Pressable>

          {user?.email ? (
            <Text style={styles.profileEmail}>{user.email}</Text>
          ) : null}
        </View>

        {/* Navigation Menu */}
        <View style={styles.nav}>
          {items.map(
            (item) =>
              user?.type &&
              item.shows.includes(user.type) && (
                <NavItem
                  key={item.key}
                  item={item}
                  label={t(`nav.${item.key}`)}
                  active={isActive(pathname, item.path)}
                  onNavigate={onNavigate}
                />
              ),
          )}
        </View>
      </ScrollView>

      {/* Logout Button - Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={onLogout}
          style={({ hovered }) => [
            styles.logoutButton,
            hovered && styles.logoutButtonHover,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("home.logout")}
        >
          <Ionicons name="log-out-outline" size={20} color="#666666" />
          <Text style={styles.logoutText}>{t("home.logout")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Content({ children }) {
  return (
    <View style={styles.content}>
      <View style={styles.contentInner}>{children}</View>
    </View>
  );
}

export default function WebShell({ isPayer, children }) {
  const pathname = usePathname();
  const { user, logout } = useAppContext();
  const { t } = useTranslation();
  const [profileVisible, setProfileVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();
  const desktop = width >= Layout.breakpointDesktop;

  // Hide navbar and sidebar for payer users
  if (isPayer) {
    return (
      <View style={styles.shellPayerOnly}>
        <Content>{children}</Content>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      {desktop ? (
        <Sidebar
          items={NAV_ITEMS}
          pathname={pathname}
          user={user}
          onProfile={() => setProfileVisible(true)}
          onLogout={() =>
            showAlert(t("home.exit"), t("home.logoutConfirm"), [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("home.logout"), style: "destructive", onPress: logout },
            ])
          }
        />
      ) : (
        <Modal
          visible={sidebarVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSidebarVisible(false)}
        >
          <View style={styles.drawerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSidebarVisible(false)}
              accessibilityLabel={t("common.close")}
            />
            <Sidebar
              items={NAV_ITEMS}
              pathname={pathname}
              user={user}
              onNavigate={() => setSidebarVisible(false)}
              onProfile={() => {
                setSidebarVisible(false);
                setProfileVisible(true);
              }}
              onLogout={() => {
                setSidebarVisible(false);
                showAlert(t("home.exit"), t("home.logoutConfirm"), [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("home.logout"),
                    style: "destructive",
                    onPress: logout,
                  },
                ]);
              }}
            />
          </View>
        </Modal>
      )}
      <View style={styles.main}>
        <Navbar
          profileVisible={profileVisible}
          onProfileVisibleChange={setProfileVisible}
          onOpenMenu={desktop ? undefined : () => setSidebarVisible(true)}
        />
        <Content>{children}</Content>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: "100%", flexDirection: "row" },
  shellPayerOnly: { flex: 1, width: "100%", flexDirection: "row" },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sidebar: {
    width: 280,
    maxWidth: "90%",
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e8e8e8",
    paddingVertical: Space.lg,
    paddingHorizontal: Space.md,
    display: "flex",
    flexDirection: "column",
  },

  sidebarContent: {
    flex: 1,
  },

  profileSection: {
    alignItems: "center",
    marginTop: Space.xl + Space.md,
    marginBottom: Space.xl,
    paddingBottom: Space.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },

  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Space.md,
  },

  profileButton: {
    width: "100%",
    alignItems: "center",
  },

  profileButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },

  profileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    textTransform: "capitalize",
  },

  profileEmail: {
    fontSize: 12,
    color: "#999999",
    marginTop: Space.sm,
    textAlign: "center",
  },

  nav: {
    flex: 1,
    gap: 0,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: 12,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    marginVertical: 4,
  },

  navHover: {
    backgroundColor: "#f5f5f5",
  },

  navActive: {
    backgroundColor: "#e3f2fd",
  },

  navText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },

  navTextActive: {
    color: "#1e5a96",
    fontWeight: "600",
  },

  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: 12,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
  },

  logoutButtonHover: {
    backgroundColor: Colors.light.surfaceSoft,
  },

  logoutText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "700",
  },

  main: { flex: 1 },
  content: { flex: 1, alignItems: "center" },
  contentInner: { flex: 1, width: "100%", maxWidth: Layout.contentMaxWidth },
});
