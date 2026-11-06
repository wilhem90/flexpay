import { StyleSheet, View } from "react-native";
import Navbar from "@/components/navbar/Navbar";
import { useAppContext } from "@/context/Provider";

export default function MainLayout({ children, showSidebar = false }) {
  const { user } = useAppContext();
  
  const typedUser = user;
  const isPayer = typedUser?.type_profile === "payer";

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
