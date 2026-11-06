<!-- Snippets de Código - Copiar e Colar -->

# 📋 Snippets de Código - Navbar + Reset Password

## 1️⃣ Usar Navbar em um Componente

```jsx
import Navbar from "@/components/navbar/Navbar";
import { View } from "react-native";

export default function MyScreen() {
  return (
    <>
      <Navbar />
      <View style={{ flex: 1 }}>
        {/* Seu conteúdo aqui */}
      </View>
    </>
  );
}
```

---

## 2️⃣ Usar Modal de Reset em Tela de Login

```jsx
import ResetPasswordModal from "@/components/modal/resetPassword";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function LoginScreen() {
  const [showResetPassword, setShowResetPassword] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Seu login form aqui */}

      {/* Botão "Esqueceu a Senha?" */}
      <Pressable
        onPress={() => setShowResetPassword(true)}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: "#3B82F6", fontWeight: "600" }}>
          Esqueceu a senha?
        </Text>
      </Pressable>

      {/* Modal */}
      <ResetPasswordModal
        visible={showResetPassword}
        onClose={() => setShowResetPassword(false)}
      />
    </View>
  );
}
```

---

## 3️⃣ Integração Completa no WebShell (Automática)

```jsx
import WebShell from "@/components/shell/WebShell";
import { useAppContext } from "@/context/Provider";

export default function AppLayout() {
  const { user } = useAppContext();
  
  const isPayer = user?.type_profile === "payer";

  return (
    <WebShell isPayer={isPayer}>
      {/* Seu conteúdo aparecerá aqui */}
      {/* Navbar aparecerá automaticamente no topo */}
    </WebShell>
  );
}
```

---

## 4️⃣ Usar Seletor de Idioma em Modo Dropdown

```jsx
import LanguageSwitcher from "@/components/languageSwitcher";

// No Navbar (modo dropdown)
<LanguageSwitcher compact dropdown />

// Em outras telas (modo botões)
<LanguageSwitcher />

// Em outras telas (modo compacto)
<LanguageSwitcher compact />
```

---

## 5️⃣ Customizar a URL da API de Reset

No arquivo `src/components/modal/resetPassword.jsx`, linha ~75:

```jsx
// Trocar de:
const url = "http://localhost:8080/api/profiles/reset-password";

// Para (produção):
const url = "https://seu-dominio.com/api/profiles/reset-password";
```

---

## 6️⃣ Acessar o Contexto de Autenticação

```jsx
import { useAppContext } from "@/context/Provider";
import { useEffect } from "react";

export default function MyComponent() {
  const { user, logout, showToast } = useAppContext();

  useEffect(() => {
    if (user) {
      console.log("Usuário logado:", user.full_name);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    showToast("success", "Logout realizado com sucesso!");
  };

  return (
    // seu componente
  );
}
```

---

## 7️⃣ Usar Toast Notifications

```jsx
import { useAppContext } from "@/context/Provider";

export default function MyComponent() {
  const { showToast } = useAppContext();

  const handleSuccess = () => {
    showToast("success", "Operação realizada com sucesso!");
  };

  const handleError = () => {
    showToast("error", "Ocorreu um erro ao realizar a operação.");
  };

  const handleInfo = () => {
    showToast("info", "Esta é uma mensagem informativa.");
  };

  return (
    // seu componente
  );
}
```

---

## 8️⃣ Verificar Tipo de Usuário

```jsx
import { useAppContext } from "@/context/Provider";

export default function MyComponent() {
  const { user } = useAppContext();

  const isPayer = user?.type_profile === "payer";
  const isNormalUser = user?.type_profile !== "payer";

  if (isPayer) {
    return <Text>Você é um pagador</Text>;
  }

  if (isNormalUser) {
    return <Text>Você é um usuário normal</Text>;
  }

  return <Text>Sem autenticação</Text>;
}
```

---

## 9️⃣ Usar Translations em Qualquer Componente

```jsx
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <>
      <Text>{t("common.success")}</Text>
      <Text>{t("login.title")}</Text>
      <Text>{t("navbar.notifications")}</Text>
      <Text>{t("resetPassword.sendLink")}</Text>
    </>
  );
}
```

---

## 🔟 Customizar Estilos do Navbar

Abrir `src/components/navbar/Navbar.jsx` e modificar o objeto `styles` no final:

```jsx
const styles = StyleSheet.create({
  navbar: {
    backgroundColor: Surface.card,      // ← Cor de fundo
    borderBottomWidth: 1,
    borderBottomColor: Surface.border,  // ← Cor da borda
    ...Shadow.sm,
  },
  // ... outros estilos
});
```

---

## ⚫ Adicionar Badge de Notificações Dinâmicas

Modificar `src/components/navbar/Navbar.jsx`, linha ~59:

```jsx
// De:
<View style={styles.badge}>
  <Text style={styles.badgeText}>3</Text>  {/* Hardcoded */}
</View>

// Para:
{notificationCount > 0 && (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{notificationCount}</Text>
  </View>
)}
```

E adicionar no componente:

```jsx
const { notificationCount } = useAppContext(); // ou de outro contexto
```

---

## 1️⃣1️⃣ Adicionar Avatar Customizado com Foto

Modificar `src/components/navbar/Navbar.jsx`, linha ~99:

```jsx
// De:
<View style={styles.avatar}>
  <Text style={styles.avatarText}>{initial}</Text>
</View>

// Para:
{user?.photo_url ? (
  <Image
    source={{ uri: user.photo_url }}
    style={styles.avatar}
  />
) : (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initial}</Text>
  </View>
)}
```

E adicionar import:

```jsx
import { Image } from "react-native";
```

---

## 1️⃣2️⃣ Testar o Modal de Reset Localmente

```jsx
import ResetPasswordModal from "@/components/modal/resetPassword";
import { useState } from "react";
import { Button, View } from "react-native";

export default function TestResetPasswordModal() {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button
        title="Abrir Modal de Reset"
        onPress={() => setVisible(true)}
      />
      
      <ResetPasswordModal
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}
```

---

## 1️⃣3️⃣ Esconder Navbar Manualmente (Se Necessário)

```jsx
import { useAppContext } from "@/context/Provider";
import Navbar from "@/components/navbar/Navbar";

export default function MyScreen() {
  const { user } = useAppContext();
  
  // Esconder navbar manualmente
  const showNavbar = user && user.type_profile !== "payer";

  return (
    <>
      {showNavbar && <Navbar />}
      {/* seu conteúdo */}
    </>
  );
}
```

---

## 1️⃣4️⃣ Adicionar Listener de Mudança de Idioma

```jsx
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function MyComponent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    console.log("Idioma mudou para:", i18n.language);
    // Fazer algo quando o idioma muda
  }, [i18n.language]);

  return (
    // seu componente
  );
}
```

---

## 1️⃣5️⃣ Fechar Modal de Reset Programaticamente

```jsx
import { useRef } from "react";
import ResetPasswordModal from "@/components/modal/resetPassword";

export default function MyComponent() {
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const closeResetModal = () => {
    setResetModalVisible(false);
  };

  return (
    <>
      <ResetPasswordModal
        visible={resetModalVisible}
        onClose={closeResetModal}
      />
      
      {/* Botão para abrir */}
      <Pressable onPress={() => setResetModalVisible(true)}>
        <Text>Redefinir Senha</Text>
      </Pressable>
    </>
  );
}
```

---

## 🎨 Cores Disponíveis (Design System)

```jsx
import { Colors } from "@/constants/colors";

// Cores Brand
Colors.brand.primary         // "#3B82F6" (azul principal)
Colors.brand.primaryDark     // "#2563EB" (azul escuro)
Colors.brand.primaryDeep     // "#1D4ED8" (azul bem escuro)

// Cores de Status
Colors.status.success        // "#22C55E" (verde)
Colors.status.error          // "#EF4444" (vermelho)
Colors.status.warning        // "#F59E0B" (amarelo)
Colors.status.info           // "#3B82F6" (azul)

// Cores de Texto
Colors.textLight.primary     // "#0F172A" (preto/cinza escuro)
Colors.textLight.secondary   // "#475569" (cinza)
Colors.textLight.disabled    // "#94A3B8" (cinza claro)
```

---

## 📏 Espaçamentos Disponíveis

```jsx
import { Space } from "@/constants/theme";

Space.xs   // 4px
Space.sm   // 8px
Space.md   // 12px
Space.lg   // 16px
Space.xl   // 24px
Space.xxl  // 32px
Space.xxxl // 48px
```

---

## 🎭 Tipografia Disponível

```jsx
import { Type } from "@/constants/theme";

Type.display    // { fontSize: 28, fontWeight: "800" }
Type.title      // { fontSize: 22, fontWeight: "800" }
Type.heading    // { fontSize: 17, fontWeight: "700" }
Type.body       // { fontSize: 14, fontWeight: "400" }
Type.bodyStrong // { fontSize: 14, fontWeight: "600" }
Type.caption    // { fontSize: 12, fontWeight: "500" }
Type.overline   // { fontSize: 11, fontWeight: "700" }
```

---

**Desenvolvido com ❤️ para FlexPay**
