import { Colors } from "@/constants/colors";
import { Image, StyleSheet, View } from "react-native";

export default function AppBackground({ children }) {
  return (
    <View style={styles.page}>
      <Image
        source={require("../../../assets/images/webBackground.png")}
        style={styles.image}
        resizeMode="contain"
        accessible={false}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    minHeight: "100vh",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  image: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 1,
    pointerEvents: "none",
  },
});