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

// CORREÇÃO: Garante que o valor seja um número para o toLocaleString funcionar
function formatAmount(amount) {
  const numericAmount = Number(amount) || 0;
  return numericAmount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AmountSelect({ items, selectedAmount, onSelect }) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const overlayRef = useModalOnTop(modalVisible);

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSelect = (item) => {
    onSelect(item); // Passa o objeto completo para o componente pai
    closeModal();
  };

  // CORREÇÃO: Extração da lógica de checagem para deixar o JSX limpo
  const isSelected = (itemValue) => selectedAmount?.sendValue === itemValue;

  return (
    <View style={styles.container}>
      {/* Botão de Seleção */}
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {selectedAmount?.sendValue
            ? formatAmount(selectedAmount.sendValue)
            : t("topup.selectAmount")}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color={Colors.textLight.secondary} />
      </TouchableOpacity>

      {/* Modal de Opções */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View ref={overlayRef} style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t("topup.selectAmount")}</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Ionicons name="close-outline" size={26} color={Colors.transactions.fee} />
              </TouchableOpacity>
            </View>

            {/* Lista de Valores */}
            <FlatList
              data={items}
              keyExtractor={(_item, index) => String(index)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const itemActive = isSelected(item?.sendValue);

                return (
                  <TouchableOpacity
                    style={[styles.item, itemActive && styles.selectedItem]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        itemActive && styles.selectedItemText,
                      ]}
                    >
                      {formatAmount(item?.sendValue)}
                    </Text>
                    {itemActive && (
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
    fontSize: 16,
    color: Colors.textLight.primary,
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
    minHeight: 50,
    paddingHorizontal: 12,
    marginBottom: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedItem: {
    backgroundColor: Colors.transactions.feeDark,
  },
  itemText: {
    fontSize: 16,
    color: Colors.textLight.primary,
  },
  selectedItemText: {
    color: Colors.textLight.primary,
    fontWeight: "600",
  },
});
