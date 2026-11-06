import BackLink from "@/components/backLink";
import { Layout, Space } from "@/constants/theme";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Container padrão das telas: centraliza o conteúdo, limita a largura e mantém o espaçamento.
export default function Screen({
  children,
  scroll = true,
  back = false,
  maxWidth = Layout.cardMaxWidth,
  contentStyle,
  ...scrollProps
}) {
  const inner = (
    <View style={[styles.content, { maxWidth }, contentStyle]}>
      {back ? <BackLink /> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", padding: Space.lg, paddingBottom: Space.xxxl },
  content: { width: "100%" },
});
