import BackLink from "@/components/backLink";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import CreateEmployeeScreen from "@/components/modal/addFuncionary";
import { STATUS_MAP, resolveStatusKey } from "@/components/modal/employeeStatus";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { listEmployees } from "@/services/createprofil";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ROLE_KEYS = {
  owner: "employees.roleOwner",
  admin: "employees.roleAdmin",
  employee: "employees.roleEmployee",
};

export default function EmployeeListScreen() {
  const { t } = useTranslation();
  const { user, configs, showToast } = useAppContext();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState(false);
  const [selectedFuncionary, setSelectedFuncionary] = useState(null);
  const [editEmail, setEditEmail] = useState(false);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await listEmployees(
          `${configs.baseUrl}/companies/my-employees`,
          user.access_token,
        );
        setEmployees(data?.data ?? []);
      } catch (err) {
        const message = err?.message || t("employees.loadFailed");
        setError(message);
        showToast?.("error", message);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [configs.baseUrl, user.access_token, showToast, t],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /* ---------- Render: loading / error ---------- */
  if (loading) {
    return (
      <View style={styles.flex}>
        <LoadingState message={t("employees.loading")} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.flex}>
        <ErrorState
          title={t("employees.oops")}
          message={error}
          retryLabel={t("common.retry")}
          onRetry={() => load()}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={employees}
        keyExtractor={(item) => item.member_id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BackLink />
            <PageHeader
              title={t("nav.employees")}
              subtitle={t("employees.count", { count: employees.length })}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ isRefresh: true })}
            tintColor={Colors.brand.primaryDeep}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="people-outline" title={t("employees.empty")} />
        }
        renderItem={({ item }) => (
          <EmployeeRow
            employee={item}
            onEdit={() => {
              setSelectedFuncionary(item);
              setEditEmail(false);
              setShowCreateEmployeeModal(true);
            }}
          />
        )}
      />

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("home.a11yAddEmployee")}
        onPress={() => {
          setSelectedFuncionary(null);
          setEditEmail(true);
          setShowCreateEmployeeModal(true);
        }}
        style={styles.fab}
      >
        <Ionicons name="add" size={26} color={Colors.button.primaryText} />
      </TouchableOpacity>

      {showCreateEmployeeModal && (
        <CreateEmployeeScreen
          onClose={() => setShowCreateEmployeeModal(false)}
          funcionary={selectedFuncionary}
          editEmail={editEmail}
          onStatusChange={(memberId, status) =>
            setEmployees((prev) =>
              prev.map((e) =>
                e.member_id === memberId
                  ? { ...e, status, active: status === "active" }
                  : e,
              ),
            )
          }
        />
      )}
    </View>
  );
}

/* ---------- Linha ---------- */
function EmployeeRow({ employee, onEdit }) {
  const { t } = useTranslation();
  const initials = (employee.profile_name || employee.profile_email || "?")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = ROLE_KEYS[employee.role]
    ? t(ROLE_KEYS[employee.role])
    : (employee.role ?? "");

  const statusKey = resolveStatusKey(employee);
  const status = STATUS_MAP[statusKey];

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.4}
      onPress={onEdit}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {employee.profile_name || employee.user_name || "—"}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {roleLabel}
          {employee.profile_email ? ` • ${employee.profile_email}` : ""}
        </Text>
      </View>

      <View
        style={[
          styles.badge,
          { backgroundColor: status?.bg ?? Colors.light.surfaceSoft },
        ]}
      >
        <Ionicons
          name={status?.icon ?? "ellipse-outline"}
          size={12}
          color={status?.fg ?? Colors.textLight.muted}
        />
        <Text
          style={[
            styles.badgeText,
            { color: status?.fg ?? Colors.textLight.muted },
          ]}
          numberOfLines={1}
        >
          {status ? t(status.i18n) : statusKey}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "transparent" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: Colors.light.surface,
  },
  muted: {
    color: Colors.textLight.secondary,
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.brand.primaryDeep,
  },
  retryText: { color: Colors.button.primaryText, fontWeight: "600" },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    backgroundColor: Colors.light.surface,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.brand.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.button.primaryText, fontWeight: "700" },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textLight.primary,
    textTransform: "capitalize",
  },
  rowSubtitle: { fontSize: 12, color: Colors.textLight.secondary },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 130,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
