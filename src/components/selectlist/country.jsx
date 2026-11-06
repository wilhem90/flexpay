import { Colors } from "@/constants/colors";
import { useModalOnTop } from "@/helpers/useModalOnTop";
/* eslint-disable react-hooks/exhaustive-deps */
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CountrySelect({ items, selectedCountry, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);
  const overlayRef = useModalOnTop(modalVisible);
  const [search, setSearch] = useState("");

  const countries = items?.Items ?? [];

  /**
   * Filtra pelo nome ou código ISO
   */
  const filteredCountries = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return countries;
    }

    return countries.filter((country) => {
      const countryName = country?.CountryName?.toLowerCase() ?? "";
      const countryIso = country?.CountryIso?.toLowerCase() ?? "";

      return (
        countryName.includes(searchText) || countryIso.includes(searchText)
      );
    });
  }, [countries, search]);

  const closeModal = () => {
    setModalVisible(false);
    setSearch("");
  };

  const openModal = () => {
    setSearch("");
    setModalVisible(true);
  };

  const handleSelect = (country) => {
    onSelect(country);
    closeModal();
  };

  return (
    <View style={styles.container}>
      {/* SELECT */}
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.7}
        onPress={openModal}
      >
        <Text style={styles.selectText}>
          {selectedCountry?.CountryName || "Select Country"}
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
              <Text style={styles.title}>Selecione o país</Text>

              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Ionicons name="close-outline" size={26} color={Colors.transactions.fee} />
              </TouchableOpacity>
            </View>

            {/* SEARCH */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.textLight.secondary} />

              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Pesquisar país..."
                placeholderTextColor={Colors.textLight.disabled}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color={Colors.textLight.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* RESULTADO */}
            <Text style={styles.resultCount}>
              {filteredCountries.length}{" "}
              {filteredCountries.length === 1
                ? "país encontrado"
                : "países encontrados"}
            </Text>

            {/* COUNTRIES */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) =>
                item?.CountryIso || `${item?.CountryName}-${index}`
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={40} color={Colors.textLight.secondary} />

                  <Text style={styles.emptyTitle}>Nenhum país encontrado</Text>

                  <Text style={styles.emptyText}>
                    Tente pesquisar por outro nome ou código.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  selectedCountry?.CountryIso === item.CountryIso;

                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.selectedItem]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.itemContent}>
                      <View style={styles.countryInfo}>
                        <Text
                          style={[
                            styles.itemText,
                            isSelected && styles.selectedItemText,
                          ]}
                        >
                          {item.CountryName}
                        </Text>

                        <Text
                          style={[
                            styles.isoText,
                            isSelected && styles.selectedIsoText,
                          ]}
                        >
                          {item.CountryIso}
                        </Text>
                      </View>
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
    maxHeight: "85%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingBottom: 15,
    marginBottom: 12,

    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight.divider,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textLight.primary,
  },

  searchContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.borderLight.default,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSoft,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,

    fontSize: 16,
    color: Colors.textLight.primary,
  },

  resultCount: {
    fontSize: 13,
    color: Colors.textLight.secondary,
    marginBottom: 8,
    marginLeft: 2,
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
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
  },

  countryInfo: {
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

  isoText: {
    marginTop: 3,
    fontSize: 13,
    color: Colors.textLight.secondary,
  },

  selectedIsoText: {
    color: Colors.textLight.secondary,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textLight.primary,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: Colors.textLight.secondary,
    textAlign: "center",
  },
});
