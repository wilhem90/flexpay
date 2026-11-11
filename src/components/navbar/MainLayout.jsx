import Navbar from "@/components/navbar/Navbar";
import { useAppContext } from "@/context/Provider";
import { StyleSheet, View } from "react-native";

export default function MainLayout({ children }) {
  const { user } = useAppContext();

  const isPayer = user?.type_profile === "payer";

  // Hide navbar and sidebar for payer users
  if (isPayer) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.layoutContainer}>
      {!isPayer && <Navbar />}
      <View style={styles.container}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
