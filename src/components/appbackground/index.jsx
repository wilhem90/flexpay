import { Colors } from "@/constants/colors";
import { StyleSheet, View } from "react-native";

export default function AppBackground({ children }) {
  return <View style={styles.page}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", backgroundColor: Colors.light.background },
});
