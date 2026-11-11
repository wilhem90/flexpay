import { Card, PageHeader, Screen } from "@/components/ui";
// app/.../settings.jsx (o teu ficheiro atual)
import PinTransaction from "@/components/settings/pintransaction";
import {
  default as PricingModal,
  default as TariffModal,
} from "@/components/settings/tariffModal";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/context/Provider";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Settings() {
  const [modalPinVisible, setModalPinVisible] = useState(false);
  const [modalTariffVisible, setModalTariffVisible] = useState(false);
  const [modalPricingVisible, setModalPricingVisible] = useState(false); // NOVO
  const [modalStoreVisible, setModalStoreVisible] = useState(false);
  const [modalAccountVisible, setModalAccountVisible] = useState(false);
  const [modalSubusersVisible, setModalSubusersVisible] = useState(false);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAppContext();

  const type = user?.type;
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("settings.title"),
      headerBackVisible: true,
    });
  }, [navigation, t]);

  const listItem = [
    {
      title: t("settings.pinTransaction"),
      icon: "lock-closed",
      color: Colors.transactions.refundDark,
      onPress: () => setModalPinVisible(true),
    },
    {
      title: t("settings.tariffConfig"),
      icon: "pricetag",
      color: Colors.transactions.feeDark,
      onPress: () => setModalTariffVisible(true),
    },
    {
      title: t("settings.storeSettings"),
      icon: "storefront",
      color: Colors.brand.secondaryDark,
      onPress: () => router.push("screens/payer"),
      show: type === "admin",
    },
    {
      title: t("settings.accountSettings"),
      icon: "person-circle",
      color: Colors.status.infoDark,
      onPress: () => setModalAccountVisible(true),
      show: type === "admin",
    },
    {
      title: t("settings.mySubusers"),
      icon: "people",
      color: Colors.brand.primaryDeep,
      onPress: () => router.push("screens/employees"),
    },
  ];

  return (
    <>
      <Screen back>
        <PageHeader
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />

        <Card padded={false} style={styles.list}>
          {listItem
            .filter((item) => item.show !== false)
            .map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.listItem,
                  index ===
                    listItem.filter((item) => item.show !== false).length - 1 &&
                    styles.listItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View
                  style={[styles.iconBadge, { backgroundColor: item.color }]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={Colors.button.primaryText}
                  />
                </View>
                <Text style={styles.listItemText}>{item.title}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textLight.disabled}
                />
              </TouchableOpacity>
            ))}
        </Card>
      </Screen>
      <PinTransaction
        visible={modalPinVisible}
        onClose={() => setModalPinVisible(false)}
        onSuccess={() => setModalPinVisible(false)}
      />

      <TariffModal
        visible={modalTariffVisible}
        onClose={() => setModalTariffVisible(false)}
      />

      <PricingModal
        visible={modalPricingVisible}
        onClose={() => setModalPricingVisible(false)}
      />
    </>
  );
}

// ...styles iguais ao teu original

const styles = StyleSheet.create({
  list: { overflow: "hidden" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight.divider,
  },
  listItemLast: { borderBottomWidth: 0 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight.primary,
    fontWeight: "600",
  },
});
