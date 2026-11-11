// @/context/Provider.tsx
import { signInUser } from "@/services/auth";
import { fetchSalesBalance } from "@/services/sales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast from "react-native-toast-message";

const STORAGE_KEY = "@app/session";

const DEFAULT_CONFIGS = {
  theme: "light",
  language: "en",
  currency: "BRL",
  notifications: true,
  autoLogin: true,
  rememberMe: true,
  baseUrl: "https://server-33000437068.europe-west1.run.app/api",
};
const Context = createContext(null);

export default function Provider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial session check
  const [authLoading, setAuthLoading] = useState(false); // login in-flight
  const [balanceRevision, setBalanceRevision] = useState(0);
  const [configs, setConfigs] = useState(DEFAULT_CONFIGS);
  const showToast = (type, message) => {
    Toast.show({
      type,
      text1: type === "error" ? "Error" : "Info",
      text2: message,
      visibilityTime: 5000, // toast will be visible for 5 seconds
      autoHide: true, // toast will automatically hide after the visibility time
      position: "top", // toast will appear at the top of the screen
      topOffset: 50, // distance from the top of the screen
      bottomOffset: 50, // distance from the bottom of the screen
    });
  };

  const getBalance = useCallback(async () => {
    if (!user?.access_token) return null;
    const url = `${configs.baseUrl}/wallets/balance`;
    return fetchSalesBalance(url, user.access_token);
  }, [user, configs.baseUrl]);

  // ---- restore session on mount ----
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn("Session restore failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- login ----
  const login = useCallback(
    async (username, password) => {
      setAuthLoading(true);
      const timer = setTimeout(() => setAuthLoading(false), 30_000); // fallback in case login hangs

      try {
        const data = await signInUser(
          username,
          password,
          `${configs.baseUrl}/profiles/login`,
        );

        if (!data.success) {
          throw new Error(data.error || "Login failed");
        }

        const nextUser = {
          ...data.user,
          access_token: data.access_token,
        };

        setUser(nextUser);

        if (configs.rememberMe) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        }

        return nextUser;
      } catch (e) {
        showToast("error", e.message);
        throw e;
      } finally {
        clearTimeout(timer);
        setAuthLoading(false);
      }
    },
    [configs.baseUrl, configs.rememberMe],
  );

  // ---- logout ----
  const logout = useCallback(async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Logout storage clear failed:", e);
    }
  }, []);

  // ---- delete account ----
  const deleteAccount = useCallback(async () => {
    try {
      showToast("info", "Account cannot be deleted at this time.");
    } catch (e) {
      console.warn("Delete account storage clear failed:", e);
    }
  }, []);

  // ---- config helper ----
  const updateConfig = useCallback((key, value) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const notifyBalanceChanged = useCallback(() => {
    setBalanceRevision((revision) => revision + 1);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authLoading,
      login,
      logout,
      configs,
      setConfigs,
      updateConfig,
      showToast,
      getBalance,
      balanceRevision,
      notifyBalanceChanged,
      deleteAccount,
    }),
    [
      user,
      loading,
      authLoading,
      login,
      logout,
      configs,
      updateConfig,
      getBalance,
      balanceRevision,
      notifyBalanceChanged,
      deleteAccount,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppContext() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useAppContext must be used within <Provider>");
  }
  return ctx;
}

// Optional: keep a back-compat alias so existing imports don't break
export const useAuthUser = useAppContext;
