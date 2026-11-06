import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PinTransactionModal({ visible, onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { user } = useAppContext();

  const handlePinChange = (value) => {
    setPin(value.replace(/\D/g, "").slice(0, 4));
  };

  const handleClose = () => {
    if (loading) return;
    setPin("");
    setShowPin(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      showAlert("error", "Invalid PIN. It must be 4 digits.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await fetch(
        "https://server-33000437068.europe-west1.run.app/api/profiles/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.access_token}`,
          },
          body: JSON.stringify({ pin_transaction: pin }),
        },
      );

      let data = null;
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        showAlert("success", "PIN submitted successfully");
        setPin("");
        onSuccess?.();
        onClose();
      } else {
        showAlert("error", data?.message || `Failed (${response.status})`);
        setPin("");
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("PIN Update Error:", error);
      showAlert("error", "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isComplete = pin.length === 4;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop escuro — toque fora fecha */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.centered}
        >
          {/* Card branco — onPress vazio pra não fechar ao tocar dentro */}
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
            {/* Botão fechar */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={Colors.textLight.secondary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={26} color={Colors.transactions.refund} />
              </View>
              <Text style={styles.title}>Transaction PIN</Text>
              <Text style={styles.subtitle}>
                Enter your 4-digit PIN to authorize this action.
              </Text>
            </View>

            {/* Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                placeholder="••••"
                placeholderTextColor={Colors.textLight.disabled}
                secureTextEntry={!showPin}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="none"
                autoComplete="off"
                inputMode="numeric"
                returnKeyType="done"
                onSubmitEditing={() => isComplete && handleSubmit()}
                style={[styles.input, { textAlign: "center" }]}
                accessibilityLabel="4-digit transaction PIN"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPin((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={showPin ? "Hide PIN" : "Show PIN"}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={showPin ? "eye-off" : "eye"}
                  size={20}
                  color={Colors.textLight.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, pin.length > i && styles.dotFilled]}
                />
              ))}
            </View>

            {/* Botão */}
            <TouchableOpacity
              style={[
                styles.submit,
                (!isComplete || loading) && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isComplete || loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isComplete || loading }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.button.primaryText} />
              ) : (
                <Text style={styles.submitText}>Confirm</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              Never share your PIN. We&apos;ll never ask for it outside this
              screen.
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)", // overlay escuro, card claro
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.light.surface, // fundo branco
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    // sombra
    shadowColor: Colors.dark.overlay,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 10,
  },
  header: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(17, 17, 17, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textLight.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSoft,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textLight.primary,
    letterSpacing: 8,
    paddingVertical: 12,
    textAlign: "center",
    width: "20%",
  },
  eyeButton: { padding: 10 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.surfaceSoft,
  },
  dotFilled: { backgroundColor: Colors.transactions.refundDark },
  submit: {
    marginTop: 24,
    backgroundColor: Colors.transactions.refundDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: "700", color: Colors.button.primaryText },
  hint: {
    marginTop: 14,
    fontSize: 12,
    color: Colors.textLight.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
});
