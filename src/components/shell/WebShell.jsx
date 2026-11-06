import Navbar from "@/components/navbar/Navbar";
import { Colors } from "@/constants/colors";
import { Layout, Radius, Shadow, Space, Surface, Type } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { key: "home", path: "/screens/home", icon: "grid-outline", payer: false },
  { key: "transfer", path: "/screens/transfer", icon: "paper-plane-outline", payer: false },
  { key: "topup", path: "/screens/topup", icon: "phone-portrait-outline", payer: false },
  { key: "employees", path: "/screens/employees", icon: "people-outline", payer: false },
  { key: "settings", path: "/screens/settings", icon: "settings-outline", payer: false },
  { key: "transfers", path: "/screens/payer", icon: "swap-horizontal-outline", payer: true },
];

const isActive = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

function NavItem({ item, label, active }) {
  return (
    <Pressable
      onPress={() => router.navigate(item.path)}
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
        size={19}
        color={active ? Colors.button.primaryText : Surface.textSecondary}
      />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Sidebar({ items, pathname }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sidebar} accessibilityRole="navigation">
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Image 
            source={require("@/assets/images/favicon.png")} 
            style={styles.logoImage}
          />
        </View>
        <Text style={styles.brandText}>FlexPay</Text>
      </View>

      <View style={styles.nav}>
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            label={t(`nav.${item.key}`)}
            active={isActive(pathname, item.path)}
          />
        ))}
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

  // Hide navbar and sidebar for payer users
  if (isPayer) {
    return (
      <View style={styles.shellPayerOnly}>
        <Content>{children}</Content>
      </View>
    );
  }

  const items = NAV_ITEMS.filter((i) => i.payer === false);

  return (
    <View style={styles.shell}>
      <Sidebar items={items} pathname={pathname} />
      <View style={styles.main}>
        <Navbar />
        <Content>{children}</Content>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: "100%", flexDirection: "row" },
  shellPayerOnly: { flex: 1, width: "100%", flexDirection: "row" },
  sidebar: {
    width: Layout.sidebarWidth,
    padding: Space.lg,
    gap: Space.xl,
    backgroundColor: Surface.card,
    borderRightWidth: 1,
    borderRightColor: Surface.border,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: Space.sm, paddingHorizontal: Space.sm },
  logo: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primaryDeep,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.md,
  },
  brandText: { ...Type.heading, color: Surface.text },
  nav: { flex: 1, gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: 10,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
  },
  navHover: { backgroundColor: Surface.soft },
  navActive: { backgroundColor: Colors.brand.primaryDeep, ...Shadow.sm },
  navText: { ...Type.bodyStrong, color: Surface.textSecondary },
  navTextActive: { color: Colors.button.primaryText },
  main: { flex: 1 },
  content: { flex: 1, alignItems: "center" },
  contentInner: { flex: 1, width: "100%", maxWidth: Layout.contentMaxWidth },
});
