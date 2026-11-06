import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/Provider";
import { showAlert } from "@/helpers/alert";
import { createEmployee, updateEmployee } from "@/services/createprofil";
import { Ionicons } from "@expo/vector-icons";
import { STATUS_MAP, StatusModal, resolveStatusKey } from "./employeeStatus";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const INITIAL_FORM = {
  fullname: "",
  username: "",
  email: "",
  phone: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form, t) {
  const errors = {};
  if (!form.fullname.trim()) errors.fullname = t("employees.errFullName");
  if (!form.username.trim()) errors.username = t("employees.errUsername");
  if (!EMAIL_RE.test(form.email.trim())) errors.email = t("employees.errEmail");
  if (!form.phone.trim()) errors.phone = t("employees.errPhone");
  return errors;
}

const employeeToForm = (employee) => ({
  fullname: employee?.profile_name ?? "",
  username: employee?.user_name ?? "",
  email: employee?.profile_email ?? "",
  phone: employee?.profile_phone ?? "",
});

export default function CreateEmployeeScreen({
  onClose,
  funcionary,
  editEmail = false,
  onStatusChange,
}) {
  const { t } = useTranslation();
  const { user, configs, showToast } = useAppContext();

  console.log(funcionary);
  const isEdit = Boolean(funcionary);

  const [form, setForm] = useState(() =>
    isEdit ? employeeToForm(funcionary) : INITIAL_FORM,
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(() => resolveStatusKey(funcionary));
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusDraft, setStatusDraft] = useState(status);

  // Se o `funcionary` mudar (ex.: abrir outro registo sem desmontar), sincroniza.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(isEdit ? employeeToForm(funcionary) : INITIAL_FORM);
    setErrors({});
    setStatus(resolveStatusKey(funcionary));
  }, [funcionary, isEdit]);

  const currentStatus = STATUS_MAP[status];

  const openStatusModal = () => {
    setStatusDraft(status);
    setStatusModalVisible(true);
  };

  const confirmStatus = () => {
    setStatus(statusDraft);
    onStatusChange?.(funcionary?.member_id, statusDraft);
    setStatusModalVisible(false);
    showToast?.("success", t("employees.statusUpdated"));
  };

  const setField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const title = useMemo(
    () => (isEdit ? t("employees.editEmployee") : t("employees.newEmployee")),
    [isEdit, t],
  );

  const submitLabel = useMemo(
    () => (isEdit ? t("employees.update") : t("employees.register")),
    [isEdit, t],
  );

  const handleSubmit = async () => {
    const nextErrors = validate(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const data = {
      fullname: form.fullname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status,
      id: funcionary?.profile_id,
    };

    try {
      // Regra correcta:
      //  - criar novo funcionário -> createEmployee
      //  - editar existente      -> updateProfile
      const response = isEdit
        ? await updateEmployee(
            `${configs.baseUrl}/companies/update-employee/${funcionary?.profile_id}`,
            user.access_token,
            {
              status: data.status,
              id: funcionary?.profile_id,
            },
          )
        : await createEmployee(data, configs.baseUrl, user.access_token);

      if (!response?.success) {
        showAlert(
          t("common.error"),
          response?.message || t("employees.registerFailed"),
          undefined,
          { type: "error" },
        );
        return;
      }

      showAlert(
        t("common.success"),
        isEdit
          ? t("employees.updateSuccessMessage")
          : t("employees.registerSuccessMessage"),
        [
          {
            text: "OK",
            onPress: () => {
              setForm(INITIAL_FORM);
              onClose?.();
            },
          },
        ],
        { type: "success" },
      );
    } catch (err) {
      const message = err?.message || t("employees.connectFailed");
      showAlert(t("common.error"), message, undefined, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      transparent={false}
      animationType="slide"
      visible
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("employees.a11yClose")}
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.textLight.secondary}
              />
            </TouchableOpacity>
          </View>

          <Field
            label={t("employees.fullName")}
            value={form.fullname}
            onChangeText={setField("fullname")}
            error={errors.fullname}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Field
            label={t("employees.username")}
            value={form.username}
            onChangeText={setField("username")}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label={t("employees.email")}
            value={form.email}
            onChangeText={setField("email")}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isEdit || editEmail}
            // feedback visual quando o campo está bloqueado na edição
            style={isEdit && !editEmail && styles.inputReadOnly}
          />
          <Field
            label={t("employees.phone")}
            value={form.phone}
            onChangeText={setField("phone")}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          {isEdit && (
            <View style={styles.field}>
              <Text style={styles.label}>{t("employees.statusLabel")}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("employees.changeStatus")}
                onPress={openStatusModal}
                activeOpacity={0.7}
                style={styles.statusButton}
              >
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: currentStatus?.bg },
                  ]}
                >
                  <Ionicons
                    name={currentStatus?.icon ?? "ellipse-outline"}
                    size={16}
                    color={currentStatus?.fg}
                  />
                </View>
                <Text style={[styles.statusText, { color: currentStatus?.fg }]}>
                  {currentStatus ? t(currentStatus.i18n) : status}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={Colors.textLight.disabled}
                />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("employees.a11yRegister")}
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.button, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.button.primaryText} />
            ) : (
              <Text style={styles.buttonText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <StatusModal
          visible={statusModalVisible}
          target={{ ...funcionary, status }}
          value={statusDraft}
          onChange={setStatusDraft}
          onClose={() => setStatusModalVisible(false)}
          onConfirm={confirmStatus}
          saving={false}
          t={t}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, error, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, style, error && styles.inputError]}
        placeholderTextColor={Colors.textLight.disabled}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.surface },
  container: {
    padding: 20,
    gap: 14,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // antes: "between" (inválido)
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textLight.primary,
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: Colors.light.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: Colors.textLight.secondary,
    fontWeight: "700",
    fontSize: 14,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textLight.secondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight.strong,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textLight.primary,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight.strong,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { flex: 1, fontSize: 15, fontWeight: "700" },
  inputReadOnly: {
    backgroundColor: Colors.light.surfaceSoft,
    color: Colors.textLight.secondary,
  },
  inputError: { borderColor: Colors.status.error },
  error: { fontSize: 12, color: Colors.status.error },
  button: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    backgroundColor: Colors.brand.primaryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: Colors.button.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },
});
