/* eslint-disable react-hooks/set-state-in-effect */
import { Colors } from "@/constants/colors";
import { Radius, Space, Surface, Type } from "@/constants/theme";
import { getNotifications } from "@/services/notification";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  mergeNotifications,
  scheduleNewHighlight,
} from "./notification-merge.mjs";

const LOCALES = { en: "en-US", pt: "pt-BR", es: "es-ES", fr: "fr-FR" };

// Intervalo de polling (ms) — ajuste conforme necessidade
const POLL_INTERVAL = 15_000;

/* ============ ITEM COM ANIMAÇÃO DE RAIO ============ */
function NotificationItem({ item, onToggleRead, onPress, formatDate, t }) {
  const isNew = !!item.isNew;
  const [pulse] = useState(() => new Animated.Value(0));

  // Animação de pulso contínuo enquanto isNew === true
  useEffect(() => {
    if (!isNew) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isNew, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });

  return (
    <Animated.View
      style={[
        styles.item,
        item.read && styles.itemRead,
        isNew && styles.itemNew,
        isNew && { transform: [{ scale }] },
      ]}
    >
      {/* Glow pulsante nas novas */}
      {isNew && (
        <Animated.View
          pointerEvents="none"
          style={[styles.newGlow, { opacity: glowOpacity }]}
        />
      )}

      {/* Checkbox */}
      <Pressable
        onPress={() => onToggleRead(item.id)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!item.read }}
        accessibilityLabel={t("notifications.markAsRead")}
        style={styles.checkboxHit}
      >
        <View style={[styles.checkbox, item.read && styles.checkboxChecked]}>
          {item.read && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </Pressable>

      {/* Corpo */}
      <Pressable
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title || t("notifications.untitled")}. ${formatDate(
          item.created_at,
        )}`}
        style={({ pressed }) => [styles.itemBody, pressed && styles.itemActive]}
      >
        <View style={styles.itemBodyRow}>
          {/* Ícone com raio quando nova */}
          <View style={[styles.itemIcon, isNew && styles.itemIconNew]}>
            <Ionicons
              name={isNew ? "flash" : "notifications-outline"}
              size={20}
              color={isNew ? "#fff" : Colors.brand.primaryDeep}
            />
          </View>

          <View style={styles.itemBodyText}>
            <View style={styles.itemTitleRow}>
              <Text
                style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
                numberOfLines={1}
              >
                {item.title || t("notifications.untitled")}
              </Text>
              {isNew && (
                <View style={styles.newBadge}>
                  <Ionicons name="flash" size={10} color="#fff" />
                  <Text style={styles.newBadgeText}>
                    {t("notifications.newBadge")}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.itemMessage} numberOfLines={2}>
              {item.message || t("notifications.noMessage")}
            </Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Surface.textSecondary}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============ MODAL ============ */
export default function NotificationsModal({
  baseUrl,
  token,
  onClose,
  countNotifications,
  onReadChange,
  visible = true,
}) {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [revision, setRevision] = useState(0);

  const countRef = useRef(countNotifications);
  useEffect(() => {
    countRef.current = countNotifications;
  }, [countNotifications]);

  const onReadChangeRef = useRef(onReadChange);
  useEffect(() => {
    onReadChangeRef.current = onReadChange;
  }, [onReadChange]);

  // IDs já vistos para detectar "novas"
  const seenIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);
  const newTimersRef = useRef(new Map());

  // Notifica o pai sobre o total de NÃO LIDAS
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    countRef.current?.(unread);
    onReadChangeRef.current?.(unread);
  }, [notifications]);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let pollTimer;

    async function poll() {
      try {
        const items = await getNotifications(baseUrl, token, controller.signal);
        if (controller.signal.aborted) return;

        const newIds = new Set(
          isFirstLoadRef.current
            ? []
            : items
                .filter((item) => !seenIdsRef.current.has(item.id))
                .map((item) => item.id),
        );
        items.forEach((item) => seenIdsRef.current.add(item.id));
        isFirstLoadRef.current = false;
        setNotifications((previous) =>
          mergeNotifications(previous, items, newIds),
        );
        setError(false);
        setRefreshError(false);
        for (const id of newIds) {
          scheduleNewHighlight(id, newTimersRef.current, (expiredId) => {
            setNotifications((current) =>
              current.map((item) =>
                item.id === expiredId ? { ...item, isNew: false } : item,
              ),
            );
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Failed to load notifications:", err);
        if (isFirstLoadRef.current) setError(true);
        else setRefreshError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          pollTimer = setTimeout(poll, POLL_INTERVAL);
        }
      }
    }

    poll();
    return () => {
      clearTimeout(pollTimer);
      controller.abort();
    };
  }, [visible, baseUrl, token, revision]);

  const retry = useCallback(() => {
    if (isFirstLoadRef.current) setLoading(true);
    setError(false);
    setRefreshError(false);
    setRevision((value) => value + 1);
  }, []);

  // Limpa timers de "nova" ao desmontar
  useEffect(() => {
    const timers = newTimersRef.current;
    return () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  }, []);

  // Ao fechar, volta para a lista
  useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  const formatDate = (value) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime()))
      return t("notifications.dateUnavailable");
    return date.toLocaleString(LOCALES[i18n.language] || "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
    setSelected((curr) =>
      curr && curr.id === id ? { ...curr, read: !curr.read } : curr,
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setSelected((curr) => (curr ? { ...curr, read: true } : curr));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const newCount = notifications.filter((n) => n.isNew).length;
  const allRead = notifications.length > 0 && unreadCount === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t("notifications.close")}
          accessibilityRole="button"
        />
        <View style={styles.modal} accessibilityViewIsModal>
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            {selected && (
              <Pressable
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                accessibilityLabel={t("notifications.back")}
                style={styles.headerButton}
              >
                <Ionicons name="arrow-back" size={22} color={Surface.text} />
              </Pressable>
            )}
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>
                  {selected
                    ? t("notifications.details")
                    : t("navbar.notifications")}
                </Text>
                {!selected && newCount > 0 && (
                  <View style={styles.headerNewPill}>
                    <Ionicons name="flash" size={10} color="#fff" />
                    <Text style={styles.headerNewPillText}>{newCount}</Text>
                  </View>
                )}
              </View>
              {!selected && !loading && !error && notifications.length > 0 && (
                <Text style={styles.headerSubtitle}>
                  {unreadCount > 0
                    ? t("notifications.unreadCount", { count: unreadCount })
                    : t("notifications.allRead")}
                </Text>
              )}
            </View>
            {!selected && !loading && !error && !allRead && (
              <Pressable
                onPress={markAllAsRead}
                accessibilityRole="button"
                accessibilityLabel={t("notifications.markAll")}
                style={styles.markAllBtn}
              >
                <Ionicons
                  name="checkmark-done"
                  size={18}
                  color={Colors.brand.primaryDeep}
                />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("notifications.close")}
              style={styles.headerButton}
            >
              <Ionicons name="close" size={22} color={Surface.text} />
            </Pressable>
          </View>

          {/* ===== CONTEÚDO ===== */}
          {refreshError && (
            <Pressable
              onPress={retry}
              accessibilityRole="button"
              style={styles.refreshWarning}
            >
              <Text style={styles.refreshWarningText}>
                {t("notifications.refreshFailed")}
              </Text>
            </Pressable>
          )}
          {selected ? (
            <ScrollView contentContainerStyle={styles.detail}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={Colors.brand.primaryDeep}
                />
              </View>
              <Text style={styles.detailTitle}>
                {selected.title || t("notifications.untitled")}
              </Text>
              <Text style={styles.date}>{formatDate(selected.created_at)}</Text>
              {selected.type ? (
                <Text style={styles.type}>
                  {t(`notifications.types.${selected.type}`, selected.type)}
                </Text>
              ) : null}
              <Text style={styles.detailMessage}>
                {selected.message || t("notifications.noMessage")}
              </Text>

              <Pressable
                onPress={() => toggleRead(selected.id)}
                style={styles.detailReadRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!selected.read }}
                accessibilityLabel={t("notifications.markAsRead")}
              >
                <View
                  style={[
                    styles.checkbox,
                    selected.read && styles.checkboxChecked,
                  ]}
                >
                  {selected.read && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.detailReadLabel}>
                  {selected.read
                    ? t("notifications.markedAsRead")
                    : t("notifications.markAsRead")}
                </Text>
              </Pressable>
            </ScrollView>
          ) : loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={Colors.brand.primary} />
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>
                {t("notifications.loadFailed")}
              </Text>
              <Pressable
                onPress={retry}
                accessibilityRole="button"
                style={styles.retry}
              >
                <Text style={styles.retryText}>{t("notifications.retry")}</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.hint}>{t("notifications.recent")}</Text>
              {notifications.length === 0 ? (
                <View style={styles.state}>
                  <Text style={styles.stateText}>
                    {t("notifications.empty")}
                  </Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onToggleRead={toggleRead}
                    onPress={setSelected}
                    formatDate={formatDate}
                    t={t}
                  />
                ))
              )}
            </ScrollView>
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
    padding: Space.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "80%",
    backgroundColor: Surface.card,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Surface.border,
    gap: Space.xs,
  },
  headerTitleWrap: { flex: 1 },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },
  headerTitle: { ...Type.heading, color: Surface.text, fontSize: 17 },
  headerSubtitle: {
    color: Surface.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  headerNewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: Colors.status.error,
  },
  headerNewPillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  markAllBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
  },

  // Lista
  list: { padding: Space.md },
  hint: { color: Surface.textSecondary, fontSize: 12, marginBottom: Space.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Surface.border,
    position: "relative",
  },
  itemRead: { opacity: 0.65 },
  itemNew: {
    backgroundColor: "rgba(99, 102, 241, 0.06)",
  },
  newGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.md,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    pointerEvents: "none",
  },
  checkboxHit: {
    paddingVertical: Space.md,
    paddingLeft: Space.md,
    paddingRight: Space.sm,
  },
  itemBody: { flex: 1 },
  itemBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Space.md,
    paddingLeft: 0,
    gap: Space.md,
    borderRadius: Radius.md,
  },
  itemBodyText: { flex: 1 },
  itemActive: { backgroundColor: Surface.soft },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.statusLight.infoBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  itemIconNew: {
    backgroundColor: Colors.brand.primary,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
  },
  itemTitle: { ...Type.bodyStrong, color: Surface.text, flexShrink: 1 },
  itemTitleUnread: { fontWeight: "800" },
  itemMessage: { color: Surface.textSecondary, marginTop: 3 },
  date: { color: Surface.textSecondary, fontSize: 12, marginTop: Space.sm },

  // Badge "NOVA"
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brand.primary,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Surface.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },

  // Detalhe
  detail: { padding: Space.lg },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.statusLight.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Space.md,
  },
  detailTitle: { ...Type.heading, color: Surface.text },
  type: { color: Colors.brand.primaryDeep, marginTop: Space.md },
  detailMessage: { color: Surface.text, marginTop: Space.lg, lineHeight: 22 },
  detailReadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    marginTop: Space.xl,
    paddingVertical: Space.sm,
  },
  detailReadLabel: { color: Surface.text, fontWeight: "600" },

  // Estados
  state: { alignItems: "center", padding: Space.xl, gap: Space.md },
  stateText: { color: Surface.textSecondary, textAlign: "center" },
  retry: { padding: Space.sm },
  retryText: { color: Colors.brand.primaryDeep, fontWeight: "700" },
  refreshWarning: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    backgroundColor: Colors.statusLight.warningBackground,
  },
  refreshWarningText: { color: Colors.statusDark.warning, fontSize: 12 },
});
