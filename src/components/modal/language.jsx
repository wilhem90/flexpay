import { Colors } from "@/constants/colors";
import { LANGUAGES, setLanguage } from "@/libs/i18n";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

function LanguageModal({ visible, onClose }) {
  const { t, i18n } = useTranslation();

  const select = async (code) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="language-outline" size={22} color={Colors.brand.primary} />
            </View>
            <Text style={styles.title}>{t("settings.language")}</Text>
          </View>

          {LANGUAGES.map((lang) => {
            const selected = i18n.language === lang.code;
            return (
              <Pressable
                key={lang.code}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => select(lang.code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.code}>{lang.code.toUpperCase()}</Text>
                <Text
                  style={[styles.label, selected && styles.labelSelected]}
                >
                  {lang.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.brand.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(17, 17, 17, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
    marginRight: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textLight.primary },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surfaceSoft,
  },
  optionSelected: { borderColor: Colors.brand.primary, backgroundColor: Colors.light.surfaceSoft },
  code: {
    width: 36,
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textLight.primary,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.textLight.primary },
  labelSelected: { color: Colors.textLight.primary },
});

export default memo(LanguageModal);
