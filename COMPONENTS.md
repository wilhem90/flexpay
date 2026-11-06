# Componentes - Navbar, Modal e Integração

## 🎨 Navbar (Componente)

### Características:
- ✅ Bonito e simples com design clean
- ✅ Notificação com badge (número de notificações)
- ✅ Foto do perfil com dropdown ao clicar
- ✅ Seletor de idioma no dropdown
- ✅ Button de logout no dropdown
- ✅ Responsivo (Mobile e Web)
- ✅ Esconde automaticamente para usuários tipo "payer"

### Localização:
- `src/components/navbar/Navbar.jsx` - Componente principal
- `src/components/navbar/MainLayout.jsx` - Layout auxiliar (opcional)

### Como Usar:

#### 1. No Layout Principal (WebShell)
O Navbar já está integrado no `WebShell.jsx` e aparece automaticamente:

```jsx
import WebShell from "@/components/shell/WebShell";

export default function App() {
  return (
    <WebShell isPayer={false}>
      <YourContent />
    </WebShell>
  );
}
```

#### 2. Em Componentes Individuais
```jsx
import Navbar from "@/components/navbar/Navbar";

export default function MyScreen() {
  return (
    <>
      <Navbar />
      <View>
        {/* seu conteúdo */}
      </View>
    </>
  );
}
```

### Comportamento por Tipo de Usuário:

#### Usuários Normais (type_profile !== "payer")
- ✅ Navbar visível
- ✅ Sidebar visível
- ✅ Todas as funções do navbar ativas

#### Usuários Pagadores (type_profile === "payer")
- ❌ Navbar oculta
- ❌ Sidebar oculta
- ✅ Conteúdo em fullscreen

### Componentes do Navbar:

#### 1. Logo/Brand (Esquerda)
- Ícone de wallet
- Texto "FlexPay"
- Clicável para navegar para home

#### 2. Notificações (Direita)
- Ícone de sino
- Badge com número de notificações (hardcoded = 3)
- Pressão para abrir notificações

#### 3. Dropdown de Perfil (Direita)
Ao clicar na foto do perfil:
- Mostra nome completo do usuário
- Iniciais em avatar colorido
- Dropdown com:
  - 📍 **Seletor de Idioma**: EN, PT, ES, FR
  - 🚪 **Botão Logout**: Vermelho, com ícone
  - Dividers entre seções

---

## 🔐 Modal de Reset de Senha

### Características:
- ✅ 2 estados: "email" e "confirm"
- ✅ Validação de email integrada
- ✅ Integração com API real
- ✅ Loading state com spinner
- ✅ Mensagens de sucesso/erro com toast
- ✅ Suporta 4 idiomas (EN, PT, ES, FR)
- ✅ Design responsivo

### Localização:
- `src/components/modal/resetPassword.jsx`

### Como Usar:

#### 1. Importar e Adicionar ao Componente:
```jsx
import { useState } from "react";
import ResetPasswordModal from "@/components/modal/resetPassword";
import { Pressable, Text } from "react-native";

export default function LoginScreen() {
  const [showResetPassword, setShowResetPassword] = useState(false);

  return (
    <>
      {/* Botão para abrir modal */}
      <Pressable onPress={() => setShowResetPassword(true)}>
        <Text>Esqueceu a senha?</Text>
      </Pressable>

      {/* Modal */}
      <ResetPasswordModal
        visible={showResetPassword}
        onClose={() => setShowResetPassword(false)}
      />
    </>
  );
}
```

#### 2. Integração na Página de Login (Exemplo Real):
```jsx
// src/app/index.jsx

import ResetPasswordModal from "@/components/modal/resetPassword";
import { useState } from "react";

export default function LoginPage() {
  const [showReset, setShowReset] = useState(false);

  return (
    <View>
      {/* Conteúdo do login */}
      
      {/* Botão "Esqueceu a Senha?" */}
      <Pressable onPress={() => setShowReset(true)}>
        <Text>{t("login.forgotPassword")}</Text>
      </Pressable>

      {/* Modal */}
      <ResetPasswordModal visible={showReset} onClose={() => setShowReset(false)} />
    </View>
  );
}
```

### Fluxo do Modal:

#### Etapa 1: Email Input
```
┌─────────────────────────────────┐
│  Reset Password                │
│  [X]                           │
├─────────────────────────────────┤
│ 🔑 Enter your email...          │
│    and we'll send a link...     │
│                                 │
│ Email: [_____________]          │
│                                 │
│ [Send Reset Link]               │
│                                 │
│ You'll receive an email...      │
└─────────────────────────────────┘
```

#### Etapa 2: Confirmação
```
┌─────────────────────────────────┐
│  Reset Password                │
│  [X]                           │
├─────────────────────────────────┤
│          ✓ Email Sent           │
│                                 │
│ We've sent a password reset...  │
│ user@example.com                │
│ Check your inbox and follow...  │
│                                 │
│ Didn't receive? Check spam...   │
│                                 │
│ [Done]                          │
└─────────────────────────────────┘
```

### Endpoint da API:

```
GET http://localhost:8080/api/profiles/reset-password
Body: {
  "email": "user@example.com"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Reset link sent to your email"
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Email not found"
}
```

### Validações:
- ✅ Email obrigatório
- ✅ Formato de email válido (regex)
- ✅ Tratamento de erros da API
- ✅ Estados de loading

### Translations Adicionadas:

#### 🇬🇧 English
- `resetPassword.title`: "Reset Password"
- `resetPassword.subtitle`: "Enter your email..."
- `resetPassword.sendLink`: "Send Reset Link"
- `resetPassword.helpText`: "You'll receive an email..."
- `resetPassword.sentTitle`: "Email Sent"
- `resetPassword.sentMessage`: "We've sent a password reset link..."
- `resetPassword.sentSuccess`: "We sent a reset link..."
- `resetPassword.dontReceive`: "Didn't receive the email?..."
- `resetPassword.tryAgain`: "try again"

#### 🇧🇷 Português
- `resetPassword.title`: "Redefinir Senha"
- `resetPassword.subtitle`: "Informe seu e-mail..."
- `resetPassword.sendLink`: "Enviar Link de Redefinição"
- E mais 6 textos traduzidos...

#### 🇪🇸 Español
- `resetPassword.title`: "Restablecer Contraseña"
- `resetPassword.subtitle`: "Ingrese su correo..."
- E mais 6 textos traduzidos...

#### 🇫🇷 Français
- `resetPassword.title`: "Réinitialiser le mot de passe"
- `resetPassword.subtitle`: "Entrez votre adresse e-mail..."
- E mais 6 textos traduzidos...

---

## 🌐 LanguageSwitcher Melhorado

### Alterações:
- ✅ Novo modo `dropdown` para uso no Navbar
- ✅ Modo compacto mantido para outras telas
- ✅ Seletor de idioma com check visual

### Como Usar:

#### Modo Normal (Botões):
```jsx
import LanguageSwitcher from "@/components/languageSwitcher";

<LanguageSwitcher />
```

#### Modo Compacto:
```jsx
<LanguageSwitcher compact />
```

#### Modo Dropdown (Usado no Navbar):
```jsx
<LanguageSwitcher compact dropdown />
```

---

## 📋 Estrutura de Arquivos

```
src/
├── components/
│   ├── navbar/
│   │   ├── Navbar.jsx          ← Navbar principal
│   │   └── MainLayout.jsx      ← Layout opcional
│   ├── modal/
│   │   └── resetPassword.jsx   ← Modal de reset
│   └── languageSwitcher/
│       └── index.jsx            ← Melhorado com dropdown
├── shell/
│   └── WebShell.jsx             ← Integrado com Navbar
├── libs/
│   └── translate.json           ← Translations adicionadas
└── context/
    └── Provider.js              ← Contexto de autenticação
```

---

## 🎯 Checklist de Implementação

- [x] Navbar criado e estilizado
- [x] Dropdown de perfil funcional
- [x] Badge de notificações
- [x] Seletor de idioma no dropdown
- [x] Logout button no dropdown
- [x] Modal de reset de senha criado
- [x] Validação de email
- [x] Integração com API
- [x] Estados de loading/sucesso/erro
- [x] Translations em 4 idiomas
- [x] Esconde navbar/sidebar para payers
- [x] ESLint validation passou ✅

---

## 🚀 Próximos Passos (Opcional)

1. **Conectar notificações reais**: Substituir hardcoded "3" por valor dinâmico
2. **Adicionar avatar customizado**: Usar foto do usuário em vez de iniciais
3. **WebSocket para notificações**: Atualizar em tempo real
4. **Persistência de idioma**: Já está implementado no contexto
5. **Dark mode**: Adicionar suporte a tema escuro

---

## ⚡ Performance

- ✅ Memo para evitar re-renders desnecessários
- ✅ State local para menu dropdown
- ✅ Lazy loading de modais
- ✅ Otimização de animações

---

**Desenvolvido com ❤️ para FlexPay**
