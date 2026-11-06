import LanguageSwitcher from "@/components/languageSwitcher";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { signUpUser } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------- Constantes de design ----------
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
};

const FONT = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
};

function FormField({
  label,
  icon,
  error,
  rightAccessory,
  disabled,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            error
              ? (Colors.status?.error ?? "#E53935")
              : focused
                ? Colors.brand.primaryDeep
                : (Colors.textLight.secondary ?? "#888")
          }
          style={styles.inputIcon}
        />
        <TextInput
          {...props}
          style={[styles.textInput, style]}
          placeholderTextColor={Colors.textLight.secondary ?? "#999"}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          editable={!disabled}
          accessibilityLabel={label}
        />
        {rightAccessory}
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={Colors.status?.error ?? "#E53935"}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ---------- Tela principal ----------
export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const { configs, showToast } = useAppContext();

  const [form, setForm] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated.Value é criado uma única vez sem acessar ref.current durante o render.
  const [shakeAnim] = useState(() => new Animated.Value(0));

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Limpa erro do campo ao digitar
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // ---------- Validação ----------
  const validate = () => {
    const next = {};

    if (!form.username.trim()) {
      next.username = t("signup.errUsername");
    } else if (form.username.trim().length < 3) {
      next.username = t("signup.errUsernameMin") ?? "Mínimo 3 caracteres";
    }

    if (!form.fullname.trim()) {
      next.fullname = t("signup.errFullName");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      next.email = t("signup.errEmail");
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) {
      next.phone = t("signup.errPhone");
    } else if (phoneDigits.length < 8) {
      next.phone = t("signup.errPhoneInvalid") ?? "Telefone inválido";
    }

    if (form.password.length < 6) {
      next.password = t("signup.errPassword");
    }

    return next;
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ---------- Submit ----------
  const createProfile = async () => {
    if (loading) return;
    Keyboard.dismiss();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      triggerShake();
      showAlert(t("common.validation"), t("signup.fixFields"), undefined, {
        type: "warning",
      });
      return;
    }

    setLoading(true);
    const url = `${configs.baseUrl}/profiles/create-profil`;
    const payload = {
      username: form.username.trim(),
      fullname: form.fullname.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    };

    try {
      const response = await signUpUser(
        payload.username,
        payload.fullname,
        payload.email,
        payload.phone,
        payload.password,
        url,
      );
      if (!response.success) {
        throw new Error(
          response.error || response.message || t("common.somethingWentWrong"),
        );
      }
      showToast(
        "success",
        t("signup.profileCreated", { username: payload.username }),
      );

      setForm({
        username: "",
        fullname: "",
        email: "",
        phone: "",
        password: "",
      });
      router.replace("/");
    } catch (err) {
      if (__DEV__) console.error("Create profile error:", err);
      showAlert(
        t("common.error"),
        err?.message || t("common.somethingWentWrong"),
        undefined,
        { type: "error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormEmpty =
    !form.username &&
    !form.fullname &&
    !form.email &&
    !form.phone &&
    !form.password;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <LanguageSwitcher />
          </View>

          <View style={styles.hero}>
            <View style={styles.iconBadge}>
              <Ionicons
                name="person-add-outline"
                size={28}
                color={Colors.brand.primaryDeep}
              />
            </View>
            <Text style={styles.title}>{t("signup.title")}</Text>
            <Text style={styles.subtitle}>
              {t("signup.subtitle") ?? "Preencha os dados para começar"}
            </Text>
          </View>

          <View style={styles.form}>
            <FormField
              label={t("signup.username")}
              icon="at-outline"
              placeholder={t("signup.username")}
              value={form.username}
              onChangeText={(v) => updateField("username", v)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              editable={!loading}
              error={errors.username}
            />

            <FormField
              label={t("signup.fullName")}
              icon="person-outline"
              placeholder={t("signup.fullName")}
              value={form.fullname}
              onChangeText={(v) => updateField("fullname", v)}
              autoComplete="name"
              textContentType="name"
              editable={!loading}
              error={errors.fullname}
            />

            <FormField
              label={t("signup.email")}
              icon="mail-outline"
              placeholder={t("signup.email")}
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              error={errors.email}
            />

            <FormField
              label={t("signup.phone")}
              icon="call-outline"
              placeholder={t("signup.phone")}
              value={form.phone}
              onChangeText={(v) => updateField("phone", v)}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              editable={!loading}
              error={errors.phone}
            />

            <FormField
              label={t("signup.password")}
              icon="lock-closed-outline"
              placeholder={t("signup.password")}
              value={form.password}
              onChangeText={(v) => updateField("password", v)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!loading}
              error={errors.password}
              rightAccessory={
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.textLight.secondary ?? "#888"}
                  />
                </TouchableOpacity>
              }
            />

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || isFormEmpty) && styles.buttonDisabled,
                ]}
                onPress={createProfile}
                disabled={loading || isFormEmpty}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: loading || isFormEmpty,
                  busy: loading,
                }}
              >
                {loading ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator color={Colors.button.primaryText} />
                    <Text style={styles.buttonText}>
                      {t("signup.creating") ?? "Criando..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.buttonText}>{t("signup.button")}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={Colors.button.primaryText}
                      style={{ marginLeft: SPACING.sm }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {(
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backLink}
              disabled={loading}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={Colors.brand.primaryDeep}
              />
              <Text style={styles.backLinkText}>
                {t("common.back") ?? "Voltar"}
              </Text>
            </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.brand.primaryDeep}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.xxl,
    fontWeight: "700",
    color: Colors.textLight.primary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: Colors.textLight.secondary ?? "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  // Field
  fieldWrapper: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: Colors.textLight.primary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Colors.borderLight.default,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: Colors.background?.secondary ?? "#FAFAFA",
    gap: SPACING.sm,
  },
  inputContainerFocused: {
    borderColor: Colors.brand.primaryDeep,
    backgroundColor: "transparent",
  },
  inputContainerError: {
    borderColor: Colors.status?.error ?? "#E53935",
    backgroundColor: `${Colors.status?.error ?? "#E53935"}08`,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 2,
  },
  textInput: {
    flex: 1,
    fontSize: FONT.md,
    color: Colors.textLight.primary,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: 4,
  },
  errorText: {
    fontSize: FONT.xs,
    color: Colors.status?.error ?? "#E53935",
    flex: 1,
  },
  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primaryDeep,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
    shadowColor: Colors.brand.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  buttonText: {
    color: Colors.button.primaryText,
    fontSize: FONT.md,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    fontSize: FONT.sm,
    color: Colors.brand.primaryDeep,
    fontWeight: "600",
  },
});
