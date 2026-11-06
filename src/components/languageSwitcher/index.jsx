import { Colors } from "@/constants/colors";
import { LANGUAGES, setLanguage } from "@/libs/i18n";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Radius, Space, Surface, Type } from "@/constants/theme";

export default function LanguageSwitcher({ compact = false, dropdown = false }) {
  const { i18n } = useTranslation();

  if (dropdown) {
    return (
      <View style={styles.dropdownContainer}>
        {LANGUAGES.map((lang) => {
          const selected = i18n.language === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={({ pressed, hovered }) => [
                styles.dropdownItem,
                (pressed || hovered) && styles.dropdownItemHover,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
                {lang.label}
              </Text>
              {selected && (
                <Text style={styles.dropdownItemCheck}>✓</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.row, compact && styles.compact]}>
      {LANGUAGES.map((lang) => {
        const selected = i18n.language === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            style={[styles.pill, selected && styles.pillSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>
              {lang.code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  compact: { marginBottom: 0, gap: 4 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
  },
  pillSelected: {
    backgroundColor: Colors.brand.primaryDeep,
    borderColor: Colors.brand.primaryDeep,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  textSelected: { color: Colors.text.primary },
  // Dropdown styles
  dropdownContainer: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    gap: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
  },
  dropdownItemHover: {
    backgroundColor: Surface.soft,
  },
  dropdownItemText: {
    ...Type.body,
    color: Surface.text,
  },
  dropdownItemTextSelected: {
    ...Type.bodyStrong,
    color: Colors.brand.primaryDeep,
  },
  dropdownItemCheck: {
    color: Colors.brand.primaryDeep,
    fontWeight: "700",
  },
});
