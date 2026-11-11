import { getLocale, toApiDate } from "@/components/payer/status";
import { Colors } from "@/constants/colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { createElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomPeriod({ onApply, onClose, initialStart, initialEnd }) {
  const { t, i18n } = useTranslation();
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [field, setField] = useState(null);
  const [draft, setDraft] = useState(new Date());
  const [error, setError] = useState(false);

  const selectDate = (name) => {
    setField(name);
    setDraft((name === "start" ? start : end) || new Date());
  };
  const setDate = (name, value) => {
    if (name === "start") setStart(value);
    else setEnd(value);
    setError(false);
  };
  const dateInputValue = (date) => {
    if (!date) return "";
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const dateField = (name, date) => (
    <View style={styles.column}>
      <Text style={styles.label}>{t(name === "start" ? "reports.startDate" : "reports.endDate")}</Text>
      <TouchableOpacity style={styles.input} onPress={Platform.OS === "web" ? undefined : () => selectDate(name)} accessibilityRole="button">
        <Ionicons name="calendar-outline" size={18} color={Colors.textLight.secondary} />
        <Text style={styles.inputText}>{date ? date.toLocaleDateString(getLocale(i18n.language)) : t("reports.selectDate")}</Text>
        {Platform.OS === "web" && createElement("input", {
          type: "date",
          value: dateInputValue(date),
          max: name === "start" && end ? dateInputValue(end) : dateInputValue(new Date()),
          min: name === "end" && start ? dateInputValue(start) : undefined,
          "aria-label": t(name === "start" ? "reports.startDate" : "reports.endDate"),
          onChange: (event) => {
            const value = event.target.value;
            if (!value) return setDate(name, null);
            const [year, month, day] = value.split("-").map(Number);
            setDate(name, new Date(year, month - 1, day));
          },
          style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" },
        })}
      </TouchableOpacity>
    </View>
  );
  const apply = () => {
    if (!start || !end || dateInputValue(start) > dateInputValue(end)) {
      setError(true);
      return;
    }
    onApply({ startDate: toApiDate(start), endDate: toApiDate(end), start, end });
  };

  return (
    <View style={styles.box}>
      <View style={styles.heading}>
        <Text style={styles.title}>{t("reports.filterPeriod")}</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.action}>{t("common.cancel")}</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>{dateField("start", start)}{dateField("end", end)}</View>
      {error && <Text style={styles.error}>{t("transfers.dateRangeRequired")}</Text>}
      {field && (
        <View>
          {Platform.OS === "ios" && (
            <View style={styles.heading}>
              <TouchableOpacity onPress={() => setField(null)}><Text style={styles.action}>{t("common.cancel")}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setDate(field, draft); setField(null); }}><Text style={styles.action}>{t("common.confirm")}</Text></TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={draft}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={field === "start" && end ? end : new Date()}
            minimumDate={field === "end" && start ? start : undefined}
            onDismiss={() => setField(null)}
            onValueChange={(event, value) => {
              if (Platform.OS === "android") setField(null);
              if (event.type === "dismissed" || !value) return;
              if (Platform.OS === "android") setDate(field, value);
              else setDraft(value);
            }}
          />
        </View>
      )}
      <TouchableOpacity style={styles.apply} onPress={apply} accessibilityRole="button">
        <Text style={styles.applyText}>{t("reports.applyFilters")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.borderLight.default },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: Colors.textLight.primary, fontWeight: "700" },
  action: { color: Colors.brand.primaryDeep, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  label: { color: Colors.textLight.secondary, fontSize: 11, marginBottom: 6 },
  input: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.borderLight.default, borderRadius: 8, padding: 10, position: "relative" },
  inputText: { flex: 1, color: Colors.textLight.primary, fontSize: 12 },
  error: { color: Colors.statusDark.error },
  apply: { alignItems: "center", backgroundColor: Colors.brand.primaryDeep, borderRadius: 8, padding: 12 },
  applyText: { color: Colors.button.primaryText, fontWeight: "700" },
});
