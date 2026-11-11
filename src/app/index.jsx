import LanguageSwitcher from "@/components/languageSwitcher";
import ResetPasswordModal from "@/components/modal/resetPassword";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IS_WEB = Platform.OS === "web";
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function Index() {
  const { t } = useTranslation();
  const { login, authLoading, showToast } = useAppContext();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const passwordRef = useRef(null);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));
  const [shakeAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  const [errorOpacity] = useState(new Animated.Value(0));

  // Listener do teclado — apenas mobile (na web não existe teclado nativo)
  useEffect(() => {
    if (IS_WEB) return;

    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animação de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Animação da mensagem de erro
  useEffect(() => {
    Animated.timing(errorOpacity, {
      toValue: error ? 1 : 0,
      duration: 200,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [error, errorOpacity]);

  // Animação de tremor
  const shakeError = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const toggleSecureText = () => setSecureText((current) => !current);

  const handleLogin = async () => {
    if (authLoading) return;

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError(t("login.enterBoth"));
      shakeError();
      return;
    }

    setError(null);

    try {
      await login(trimmedUsername, password);
      showToast("success", t("login.success"));
    } catch {
      setError(t("login.failed"));
      shakeError();
      showToast("error", t("login.failed"));
    }
  };

  const formContent = (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: keyboardVisible ? 180 : 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        <View style={styles.languageSwitcherWrapper}>
          <LanguageSwitcher />
        </View>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="lock-closed"
              size={32}
              color={Colors.brand.primaryDeep}
            />
          </View>

          <Text style={styles.title}>{t("login.title")}</Text>

          <Text style={styles.subtitle}>
            {t("login.subtitle") || "Bem-vindo de volta 👋"}
          </Text>
        </View>

        {/* Usuário */}
        <View style={styles.boxInput}>
          <Text style={styles.label}>{t("login.username")}</Text>

          <View
            style={[
              styles.inputRow,
              focusedField === "user" && styles.inputRowFocused,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={
                focusedField === "user" ? Colors.brand.primaryDeep : "gray"
              }
            />

            <TextInput
              style={styles.textInput}
              placeholder={t("login.usernamePlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              editable={!authLoading}
              onFocus={() => setFocusedField("user")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Senha */}
        <View style={styles.boxInput}>
          <Text style={styles.label}>{t("login.password")}</Text>

          <View
            style={[
              styles.inputRow,
              focusedField === "pass" && styles.inputRowFocused,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={
                focusedField === "pass" ? Colors.brand.primaryDeep : "gray"
              }
            />

            <TextInput
              ref={passwordRef}
              style={styles.textInput}
              placeholder={t("login.passwordPlaceholder")}
              placeholderTextColor="#9CA3AF"
              secureTextEntry={secureText}
              underlineColorAndroid="transparent"
              selectionColor={Colors.brand.primary}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!authLoading}
              onFocus={() => setFocusedField("pass")}
              onBlur={() => setFocusedField(null)}
            />

            <TouchableOpacity
              onPress={toggleSecureText}
              disabled={authLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={
                secureText ? "Mostrar palavra-passe" : "Ocultar palavra-passe"
              }
            >
              <Ionicons
                name={secureText ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensagem de erro */}
        <Animated.Text
          style={[styles.error, { opacity: errorOpacity }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error || " "}
        </Animated.Text>

        {/* Links */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            disabled={authLoading}
            onPress={() => setShowResetPasswordModal(true)}
            accessibilityRole="button"
          >
            <Text style={styles.link}>{t("login.forgotPassword")}</Text>
          </TouchableOpacity>

          <Link href="/screens/signup" asChild>
            <TouchableOpacity disabled={authLoading} accessibilityRole="button">
              <Text style={styles.link}>{t("login.noAccount")}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Botão de login */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={[styles.button, authLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={authLoading}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: false,
            }}
            accessibilityRole="button"
            accessibilityState={{ disabled: authLoading, busy: authLoading }}
          >
            {authLoading ? (
              <ActivityIndicator color={Colors.button.primaryText} />
            ) : (
              <>
                <Text style={styles.buttonText}>{t("login.title")}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={Colors.button.primaryText}
                  style={styles.buttonIcon}
                />
              </>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.containerSafe}>
      {IS_WEB ? (
        <View style={styles.keyboardContainer}>{formContent}</View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {formContent}
        </KeyboardAvoidingView>
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        visible={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerSafe: {
    flex: 1,
    backgroundColor: "transparent",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingVertical: 32,
  },

  animatedContainer: {
    width: "100%",
  },

  languageSwitcherWrapper: {
    alignItems: "center",
    marginBottom: 8,
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.brand.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginTop: 6,
  },

  boxInput: {
    marginTop: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderColor: "#D1D5DB",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  inputRowFocused: {
    borderColor: Colors.brand.primaryDeep,
    shadowColor: Colors.brand.primaryDeep,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  textInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    fontSize: 16,
    backgroundColor: "transparent",
    color: Colors.textLight.primary,
  },

  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  link: {
    fontSize: 14,
    color: Colors.brand.primaryDeep,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  error: {
    color: Colors.status.error,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    minHeight: 20,
    fontWeight: "500",
  },

  button: {
    backgroundColor: Colors.brand.primaryDeep,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: Colors.brand.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: Colors.button.primaryText,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  buttonIcon: {
    marginLeft: 8,
  },
});
