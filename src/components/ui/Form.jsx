import { Colors } from "@/constants/colors";
import { Radius, Space, Surface, Type } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export function FormField({ label, error, hint, children }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function TextField({ label, error, hint, icon, style, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  return (
    <FormField label={label} error={error} hint={hint}>
      <View
        style={[
          styles.inputWrap,
          focused && styles.focused,
          !!error && styles.invalid,
          style,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={Surface.textMuted} />
        ) : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={label ?? inputProps.accessibilityLabel}
          placeholderTextColor={Colors.input.placeholder}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={styles.input}
        />
      </View>
    </FormField>
  );
}

export function SearchBar({ value, onChangeText, placeholder, style }) {
  return (
    <TextField
      icon="search-outline"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType="search"
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { ...Type.caption, fontWeight: "600", color: Surface.text },
  hint: { ...Type.caption, color: Surface.textMuted },
  error: { ...Type.caption, color: Colors.statusDark.error },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    height: 46,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },
  focused: { borderColor: Colors.input.focusBorder },
  invalid: { borderColor: Colors.statusDark.error },
  input: { flex: 1, fontSize: 15, color: Surface.text, height: "100%" },
});
