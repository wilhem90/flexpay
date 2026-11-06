import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function Message({ text, title = "Oferta especial", onPress }) {
  const isInteractive = Boolean(onPress);

  const content = (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="megaphone-outline" size={21} color={Colors.brand.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>

      {isInteractive && (
        <Ionicons name="chevron-forward" size={20} color={Colors.brand.primary} />
      )}
    </>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.wrapper, styles.container]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${text}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.wrapper, styles.container]}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${text}`}
    >
      {content}
    </View>
  );
}

export default memo(Message);

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
    marginBottom: 4,
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.light.surfaceSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceSoft,
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textLight.primary,
    marginBottom: 3,
  },

  text: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textLight.primary,
  },
});
