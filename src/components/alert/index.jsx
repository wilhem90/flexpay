import { Colors } from "@/constants/colors";
import { registerAlertHost } from "@/helpers/alert";
import { useModalOnTop } from "@/helpers/useModalOnTop";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const TYPES = {
  info: { icon: "information-circle", color: Colors.status.info, bg: Colors.statusLight.infoBackground },
  success: { icon: "checkmark-circle", color: Colors.status.success, bg: Colors.statusLight.successBackground },
  error: { icon: "close-circle", color: Colors.status.error, bg: Colors.statusLight.errorBackground },
  warning: { icon: "warning", color: Colors.status.warning, bg: Colors.statusLight.warningBackground },
  confirm: { icon: "help-circle", color: Colors.brand.secondaryDark, bg: Colors.light.surfaceSoft },
};

export default function AlertHost() {
  const [queue, setQueue] = useState([]);
  const overlayRef = useModalOnTop(queue.length > 0);

  useEffect(
    () => registerAlertHost((alert) => setQueue((prev) => [...prev, alert])),
    [],
  );

  const current = queue[0];
  const buttons = current?.buttons?.length
    ? current.buttons
    : [{ text: "OK" }];
  const cancelButton = buttons.find((b) => b.style === "cancel");

  const dismiss = useCallback((button) => {
    setQueue((prev) => prev.slice(1));
    button?.onPress?.();
  }, []);

  if (!current) return null;

  const type =
    TYPES[current.type ?? (current.buttons?.length > 1 ? "confirm" : "info")];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => dismiss(cancelButton)}
    >
      <View ref={overlayRef} style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => dismiss(cancelButton)}
        />
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: type.bg }]}>
            <Ionicons name={type.icon} size={30} color={type.color} />
          </View>
          {current.title ? (
            <Text style={styles.title}>{current.title}</Text>
          ) : null}
          {current.message ? (
            <Text style={styles.message}>{current.message}</Text>
          ) : null}

          <View style={styles.actions}>
            {buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel
                      ? styles.cancelButton
                      : isDestructive
                        ? styles.destructiveButton
                        : styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => dismiss(button)}
                >
                  <Text
                    style={[
                styles.buttonText,
                isCancel && styles.cancelText,
                isDestructive && styles.destructiveText,
              ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
    maxWidth: 380,
    padding: 22,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
    color: Colors.textLight.primary,
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: Colors.textLight.primary,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: Colors.brand.primaryDeep },
  destructiveButton: { backgroundColor: Colors.button.danger },
  cancelButton: { backgroundColor: Colors.light.surfaceSoft },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: 14, fontWeight: "700", color: Colors.button.primaryText },
  cancelText: { color: Colors.textLight.primary },
  destructiveText: { color: Colors.button.dangerText },
});
