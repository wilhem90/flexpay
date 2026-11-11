import { Colors } from "@/constants/colors";
import { showAlert } from "@/helpers/alert";
import { LANGUAGES, setLanguage } from "@/libs/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef(null);
  const { width, height } = useWindowDimensions();
  const selected = LANGUAGES.find(
    (language) => language.code === i18n.language,
  );

  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    trigger.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      setPosition({
        left: Math.max(8, Math.min(x, width - 208)),
        top: Math.max(8, Math.min(y + triggerHeight + 4, height - 220)),
      });
      setOpen(true);
    });
  };

  const select = async (code) => {
    try {
      await setLanguage(code);
      setOpen(false);
    } catch (error) {
      console.error("Language change failed:", error);
      setOpen(false);
      showAlert(t("common.error"), t("common.somethingWentWrong"));
    }
  };

  return (
    <View>
      <Pressable
        ref={trigger}
        onPress={toggle}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t("settings.language")}
        accessibilityState={{ expanded: open }}
      >
        <Ionicons
          name="language-outline"
          size={18}
          color={Colors.brand.primaryDeep}
        />
        <Text style={styles.label}>{selected?.label ?? i18n.language}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.brand.primaryDeep}
        />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel={t("common.close")}
          />
          <View style={[styles.menu, position]}>
            {LANGUAGES.map((language) => (
              <Pressable
                key={language.code}
                onPress={() => select(language.code)}
                style={styles.option}
                accessibilityRole="button"
                accessibilityState={{
                  selected: i18n.language === language.code,
                }}
              >
                <Text style={styles.label}>{language.label}</Text>
                {i18n.language === language.code && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={Colors.brand.primaryDeep}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  label: {
    color: Colors.textLight.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  overlay: { flex: 1 },
  menu: {
    position: "absolute",
    right: 0,
    width: 200,
    padding: 6,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    elevation: 8,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
});
