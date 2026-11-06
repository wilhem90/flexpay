import { Colors } from "@/constants/colors";
import { useModalOnTop } from "@/helpers/useModalOnTop";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OperatorSelect({ items, selectedOp, onSelect }) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const overlayRef = useModalOnTop(modalVisible);

  // A API retorna { Items: [...] }
  const operators = items?.Items ? items.Items : items || [];

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSelect = (operator) => {
    onSelect(operator);
    closeModal();
  };

  return (
    <View style={styles.container}>
      {/* SELECT */}
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {selectedOp?.Name || t("topup.selectOperator")}
        </Text>

        <Ionicons name="chevron-down-outline" size={20} color={Colors.textLight.secondary} />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View ref={overlayRef} style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>{t("topup.operatorPlaceholder")}</Text>

              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Ionicons name="close-outline" size={26} color={Colors.transactions.fee} />
              </TouchableOpacity>
            </View>

            {/* OPERATORS */}
            <FlatList
              data={operators}
              keyExtractor={(item, index) => `${item.ProviderCode}-${index}`}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={40}
                    color={Colors.textLight.secondary}
                  />

                  <Text style={styles.emptyText}>
                    {t("topup.noOperatorFound")}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  selectedOp?.ProviderCode === item.ProviderCode;

                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.selectedItem]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.selectedItemText,
                        ]}
                      >
                        {item.Name}
                      </Text>

                      <Text
                        style={[
                          styles.providerText,
                          isSelected && styles.selectedProviderText,
                        ]}
                      >
                        {item.ProviderCode}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={Colors.textLight.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },

  select: {
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight.primary,
    marginRight: 10,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalContent: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingBottom: 15,
    marginBottom: 10,

    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight.divider,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },

  item: {
    minHeight: 60,
    paddingHorizontal: 12,
    marginBottom: 5,
    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemContent: {
    flex: 1,
  },

  selectedItem: {
    backgroundColor: Colors.transactions.feeDark,
  },

  itemText: {
    fontSize: 16,
    color: Colors.textLight.primary,
    fontWeight: "500",
  },

  selectedItemText: {
    color: Colors.textLight.primary,
    fontWeight: "600",
  },

  providerText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textLight.secondary,
  },

  selectedProviderText: {
    color: Colors.textLight.secondary,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.textLight.secondary,
  },
});
