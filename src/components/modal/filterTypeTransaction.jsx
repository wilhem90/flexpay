import { Colors } from "@/constants/colors";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

function FilterTypeTransaction({ listItems = [], onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  const uniqueListItems = Array.from(new Set(["Service Types", ...listItems]));

  return (
    <DropDownPicker
      open={open}
      value={value}
      items={uniqueListItems.map((item) => ({
        label:
          item === "Service Types"
            ? t("reports.serviceTypes")
            : item.charAt(0).toUpperCase() + item.slice(1),
        value: item,
        disabled: item === "Service Types",
      }))}
      setOpen={setOpen}
      setValue={(callback) => {
        setValue(callback);
        if (onChange) {
          const newValue =
            typeof callback === "function" ? callback(value) : callback;
          onChange(newValue);
        }
      }}
      placeholder={t("reports.filterTypePlaceholder")}
      listMode="SCROLLVIEW"
      style={styles.picker}
      textStyle={styles.text}
      placeholderStyle={styles.placeholder}
      dropDownContainerStyle={styles.dropdown}
      zIndex={5000}
      zIndexInverse={1000}
      listItemLabelStyle={styles.itemLabel}
      selectedItemLabelStyle={styles.selectedLabel}
      disabledItemLabelStyle={styles.disabledLabel}
      tickIconStyle={styles.tick}
      arrowIconStyle={styles.arrow}
    />
  );
}

const styles = StyleSheet.create({
  picker: {
    zIndex: 999,
    elevation: 999,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 14,
    marginVertical: 16,
  },
  text: { fontSize: 15, fontWeight: "500", color: Colors.textLight.primary },
  placeholder: { color: Colors.textLight.secondary, fontWeight: "400" },
  dropdown: {
    zIndex: 5000,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    elevation: 6,
    shadowColor: Colors.dark.overlay,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  itemLabel: { fontSize: 15, color: Colors.textLight.primary },
  selectedLabel: { fontWeight: "700", color: Colors.textLight.primary },
  disabledLabel: { color: Colors.textLight.secondary, fontSize: 12, textTransform: "uppercase" },
  tick: { tintColor: Colors.brand.primary },
  arrow: { tintColor: Colors.brand.primary },
});

export default memo(FilterTypeTransaction);
