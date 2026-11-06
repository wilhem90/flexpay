import { Alert, Platform } from "react-native";

let host = null;

export const registerAlertHost = (fn) => {
  host = fn;
  return () => {
    if (host === fn) host = null;
  };
};

// Usa o modal estilizado do AlertHost; sem host montado, cai no alerta nativo.
export const showAlert = (title, message, buttons, options = {}) => {
  if (host) {
    host({ title, message, buttons, type: options.type });
    return;
  }

  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join("\n\n");
  const actions = buttons ?? [];
  const cancel = actions.find((b) => b.style === "cancel");
  const confirm = actions.find((b) => b.style !== "cancel");

  if (cancel && confirm) {
    if (window.confirm(text)) confirm.onPress?.();
    else cancel.onPress?.();
    return;
  }

  window.alert(text);
  (confirm ?? actions[0])?.onPress?.();
};
