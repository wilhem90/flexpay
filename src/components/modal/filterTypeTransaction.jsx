import { Colors } from "@/constants/colors";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

function FilterTypeTransaction({
  typeTransaction,
  setTypeTransaction,
  listItems = [],
  onChange,
  i18nIsDynamicList = false,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => [
      {
        label: t("reports.clear"),
        value: null,
      },
      ...Array.from(new Set(listItems)).map((item) => ({
        label: i18nIsDynamicList
          ? t(`operators.${item}`, item)
          : item.charAt(0).toUpperCase() + item.slice(1),
        value: item,
      })),
    ],
    [listItems, t, i18nIsDynamicList],
  );

  return (
    <DropDownPicker
      open={open}
      value={typeTransaction}
      items={items}
      setOpen={setOpen}
      setValue={(callback) => {
        const newValue =
          typeof callback === "function" ? callback(typeTransaction) : callback;

        setTypeTransaction(newValue);
        onChange?.(newValue);
      }}
      placeholder={t("reports.filterTypePlaceholder")}
      listMode="SCROLLVIEW"
      closeAfterSelecting
      style={styles.picker}
      textStyle={styles.text}
      placeholderStyle={styles.placeholder}
      selectedItemLabelStyle={styles.selectedLabel}
      dropDownContainerStyle={styles.dropdown}
      zIndex={5000}
      zIndexInverse={1000}
    />
  );
}

export default memo(FilterTypeTransaction);

const styles = StyleSheet.create({
  picker: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 14,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textLight.primary,
  },
  placeholder: {
    color: Colors.textLight.secondary,
  },
  selectedLabel: {
    fontWeight: "700",
    color: Colors.brand.primary,
  },
  dropdown: {
    borderColor: Colors.borderLight.default,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    elevation: 6,
  },
});
