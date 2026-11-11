import AlertHost from "@/components/alert";
import AppBackground from "@/components/appbackground";
import WebShell from "@/components/shell/WebShell";
import { Colors } from "@/constants/colors";
import Provider, { useAppContext } from "@/context/Provider";
import "@/libs/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { BaseToast } from "react-native-toast-message";

const coloredToast = (accent: string) =>
  function ColoredToast(props: React.ComponentProps<typeof BaseToast>) {
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: accent,
          backgroundColor: Colors.light.surface,
        }}
        text1Style={{ color: Colors.textLight.primary, fontSize: 14 }}
        text2Style={{ color: Colors.textLight.secondary, fontSize: 13 }}
      />
    );
  };

const toastConfig = {
  success: coloredToast(Colors.status.success),
  error: coloredToast(Colors.status.error),
  info: coloredToast(Colors.status.info),
};

const SHOW_HEADER = Platform.OS !== "web";

function AppNavigator() {
  const { user, loading } = useAppContext();
  const { t } = useTranslation();

  const typedUser = user as { type?: string } | null | undefined;
  const isAuthenticated = !!user;
  const isPayer = typedUser?.type === "payer";

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        headerStyle: { backgroundColor: Colors.light.surface },
        headerTintColor: Colors.textLight.primary,
        headerShadowVisible: false,
        statusBarStyle: "dark",
        statusBarTranslucent: true,
      }}
    >
      {/* PAGADOR */}
      <Stack.Protected guard={isAuthenticated && isPayer}>
        <Stack.Screen
          name="screens/payer/index"
          options={{ headerShown: false, title: t("common.back") }}
        />
      </Stack.Protected>

      {/* USUÁRIOS NORMAIS */}
      <Stack.Protected guard={isAuthenticated && !isPayer}>
        <Stack.Screen name="screens/home/index" />

        <Stack.Screen
          name="screens/topup/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/transfer/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/settings/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/account/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/bets/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/invoices/transfer"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />

        <Stack.Screen
          name="screens/employees"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.back"),
          }}
        />
      </Stack.Protected>

      {/* USUÁRIOS NÃO AUTENTICADOS */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="index" />

        <Stack.Screen
          name="screens/signup/index"
          options={{
            headerShown: SHOW_HEADER,
            title: t("common.backToLogin"),
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

const WEB_INPUT_CSS = `
  :root { color-scheme: light; }
  input, textarea {
    outline: none !important;
    box-shadow: none;
    color: #0F172A;
    caret-color: #0F172A;
    background-color: transparent;
    -webkit-text-fill-color: #0F172A;
  }
  input::placeholder, textarea::placeholder {
    color: #94A3B8;
    -webkit-text-fill-color: #94A3B8;
    opacity: 1;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #0F172A;
    transition: background-color 600000s 0s, color 600000s 0s;
    box-shadow: 0 0 0 1000px #FFFFFF inset;
  }
  input::-ms-reveal, input::-ms-clear { display: none; }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; }
  @media print {
    @page { margin: 12mm; }
    body * { visibility: hidden !important; }
    [data-print-area], [data-print-area] * { visibility: visible !important; }
    [data-print-area] {
      position: absolute !important;
      left: 0; top: 0;
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
    }
    [data-no-print] { display: none !important; }
  }
`;

function useWebInputStyles() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.setAttribute("data-flexpay-inputs", "");
    style.textContent = WEB_INPUT_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);
}

function AppFrame() {
  const { user } = useAppContext();
  const { width } = useWindowDimensions();
  const typedUser = user as { type_profile?: string } | null | undefined;
  const isDesktopShell = Platform.OS === "web" && !!user;
  const isWide = width > MAX_CONTENT_WIDTH;

  if (isDesktopShell) {
    return (
      <WebShell isPayer={typedUser?.type_profile === "payer"}>
        <AppNavigator />
      </WebShell>
    );
  }

  return (
    <View style={[styles.frame, isWide && styles.frameWide]}>
      <AppNavigator />
    </View>
  );
}

export default function RootLayout() {
  useWebInputStyles();

  return (
    <SafeAreaProvider>
      <Provider>
        <AppBackground>
          <AppFrame />
        </AppBackground>
        <AlertHost />
        <Toast config={toastConfig} />
      </Provider>
    </SafeAreaProvider>
  );
}

const MAX_CONTENT_WIDTH = 560;

const styles = StyleSheet.create({
  frame: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH },
  frameWide: {
    marginVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
  },
});
