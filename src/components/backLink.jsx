import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

// Link explícito de voltar, exibido apenas no web (no mobile existe o header nativo).
export default function BackLink({ style, fallback = "/" }) {
  const { t } = useTranslation();

  if (Platform.OS !== "web") return null;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(fallback);

  return (
    <Pressable
      onPress={goBack}
      style={({ hovered }) => [styles.link, hovered && styles.hover, style]}
      accessibilityRole="link"
      accessibilityLabel={t("common.back")}
      dataSet={{ noPrint: "" }}
    >
      <Ionicons
        name="chevron-back"
        size={18}
        color={Colors.brand.primaryDeep}
      />
      <Text style={styles.text}>{t("common.back")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingVertical: 6,
    paddingRight: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  hover: { opacity: 0.7 },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.brand.primaryDeep,
  },
});
