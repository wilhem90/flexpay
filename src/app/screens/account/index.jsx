import Reports from "@/components/reports";
import { useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";

export default function AccountScreen() {
  const reports = useRef(null);
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300) {
          reports.current?.loadMore();
        }
      }}
      scrollEventThrottle={200}
    >
      <Reports ref={reports} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, width: "100%", maxWidth: 960, alignSelf: "center", padding: 16, paddingBottom: 48 },
});