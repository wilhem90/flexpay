import { Colors } from "@/constants/colors";
import { Radius, Space, Type } from "@/constants/theme";
import { useAppContext } from "@/context/Provider";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function ResetPasswordModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("email"); // email | confirm | success
  const [resetEmail, setResetEmail] = useState("");

  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      showToast("error", t("common.validationRequired") || "Email is required");
      return;
    }

    if (!validateEmail(email)) {
      showToast("error", t("login.errEmail") || "Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const url =
        "https://server-33000437068.europe-west1.run.app/api/profiles/reset-password";
      const options = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      };

      const response = await fetch(url, options);
      const data = await response.json();

      if (data.success) {
        setResetEmail(email);
        setStep("confirm");
        showToast(
          "success",
          t("resetPassword.sentSuccess") ||
            "We sent a reset link to your email. Please check your inbox.",
        );
      } else {
        showToast("error", data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showToast(
        "error",
        t("common.somethingWentWrong") ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setResetEmail("");
    setStep("email");
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.card}>
          {/* Close Button */}
          <Pressable
            style={({ pressed, hovered }) => [
              styles.closeButton,
              (pressed || hovered) && styles.closeButtonActive,
            ]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons
              name="close-outline"
              size={24}
              color={Colors.textLight.primary}
            />
          </Pressable>

          {step === "email" && (
            <>
              <View style={styles.header}>
                <View style={styles.icon}>
                  <Ionicons
                    name="key-outline"
                    size={24}
                    color={Colors.brand.primary}
                  />
                </View>
                <Text style={styles.title}>
                  {t("resetPassword.title") || "Reset Password"}
                </Text>
              </View>

              <Text style={styles.subtitle}>
                {t("resetPassword.subtitle") ||
                  "Enter your email address and we'll send you a link to reset your password."}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    t("login.emailPlaceholder") || "Enter your email"
                  }
                  placeholderTextColor={Colors.textLight.disabled}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email input"
                />
              </View>

              <Pressable
                style={({ pressed, hovered }) => [
                  styles.button,
                  (loading || pressed) && styles.buttonPressed,
                  hovered && !loading && styles.buttonHover,
                ]}
                onPress={handleRequestReset}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Send reset link"
              >
                {loading ? (
                  <ActivityIndicator
                    color={Colors.button.primaryText}
                    size={20}
                  />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("resetPassword.sendLink") || "Send Reset Link"}
                  </Text>
                )}
              </Pressable>

              <Text style={styles.helpText}>
                {t("resetPassword.helpText") ||
                  "You'll receive an email with instructions to create a new password."}
              </Text>
            </>
          )}

          {step === "confirm" && (
            <>
              <View style={styles.successHeader}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={Colors.status.success}
                  />
                </View>
                <Text style={styles.successTitle}>
                  {t("resetPassword.sentTitle") || "Email Sent"}
                </Text>
              </View>

              <Text style={styles.successMessage}>
                {t("resetPassword.sentMessage") ||
                  `We've sent a password reset link to ${resetEmail}. Please check your inbox and follow the instructions.`}
              </Text>

              <Text style={styles.dontReceiveHint}>
                {t("resetPassword.dontReceive") ||
                  "Didn't receive the email? Check your spam folder or "}
                <Text style={styles.linkText} onPress={handleRequestReset}>
                  {t("resetPassword.tryAgain") || "try again"}
                </Text>
              </Text>

              <Pressable
                style={({ pressed, hovered }) => [
                  styles.button,
                  (pressed || hovered) && styles.buttonPressed,
                ]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.buttonText}>
                  {t("common.close") || "Done"}
                </Text>
              </Pressable>
            </>
          )}
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
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: Space.lg,
    right: Space.lg,
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonActive: {
    backgroundColor: Colors.light.surfaceSoft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.statusLight.infoBackground,
    marginRight: Space.md,
  },
  title: {
    ...Type.heading,
    color: Colors.textLight.primary,
  },
  subtitle: {
    ...Type.body,
    color: Colors.textLight.secondary,
    marginBottom: Space.lg,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Space.lg,
  },
  label: {
    ...Type.bodyStrong,
    color: Colors.textLight.primary,
    marginBottom: Space.sm,
  },
  input: {
    paddingVertical: Space.md,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surfaceSoft,
    fontSize: 14,
    color: Colors.textLight.primary,
  },
  button: {
    paddingVertical: Space.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Space.md,
  },
  buttonPressed: {
    backgroundColor: Colors.brand.primaryDark,
    opacity: 0.8,
  },
  buttonHover: {
    backgroundColor: Colors.brand.primaryDark,
  },
  buttonText: {
    ...Type.bodyStrong,
    color: Colors.button.primaryText,
    fontSize: 15,
  },
  helpText: {
    ...Type.caption,
    color: Colors.textLight.secondary,
    textAlign: "center",
  },
  // Success state
  successHeader: {
    alignItems: "center",
    marginBottom: Space.lg,
  },
  successIcon: {
    marginBottom: Space.md,
  },
  successTitle: {
    ...Type.heading,
    color: Colors.textLight.primary,
    textAlign: "center",
  },
  successMessage: {
    ...Type.body,
    color: Colors.textLight.secondary,
    marginBottom: Space.lg,
    lineHeight: 20,
    textAlign: "center",
  },
  dontReceiveHint: {
    ...Type.caption,
    color: Colors.textLight.secondary,
    marginBottom: Space.lg,
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: Colors.brand.primary,
    fontWeight: "700",
  },
});

export default memo(ResetPasswordModal);
