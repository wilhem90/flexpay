import { Colors } from "@/constants/colors";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

export default function Loading({ loading, text }) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={loading}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={styles.loadingTitle}>{t("common.pleaseWait")}</Text>
          <Text style={styles.loadingText}>
            {text || t("common.processingRequest")}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingBox: {
    width: 200,
    padding: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
  },
  loadingTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  loadingText: {
    marginTop: 5,
    fontSize: 14,
    color: Colors.textLight.secondary,
    textAlign: "center",
  },
});
