import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const BetsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="dice-outline" size={52} color="#2563EB" />
        </View>

        <View style={styles.badge}>
          <View style={styles.statusDot} />
          <Text style={styles.badgeText}>EM DESENVOLVIMENTO</Text>
        </View>

        <Text style={styles.title}>Estamos preparando algo especial!</Text>

        <Text style={styles.description}>
          Nossa plataforma de apostas está sendo desenvolvida para oferecer uma
          experiência simples, segura e inovadora.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="rocket-outline" size={22} color="#2563EB" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Em breve!</Text>
            <Text style={styles.infoDescription}>
              Estamos trabalhando para disponibilizar essa funcionalidade o mais
              rápido possível.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Agradecemos pela sua paciência e confiança.
        </Text>
      </View>
    </View>
  );
};

export default BetsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 20,
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D97706",
  },
  badgeText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 30,
  },
  infoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
  },
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
