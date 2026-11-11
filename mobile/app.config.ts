import type { ExpoConfig } from "expo/config";

// app.config.ts (em vez de app.json) só porque precisamos ler env vars em
// build-time — a chave do Google Maps Android e os client IDs do Google
// Sign-In entram aqui, não dá pra fazer isso num app.json estático. Ver
// README.md deste pacote pra instruções completas de setup.
const config: ExpoConfig = {
  name: "MaPinha",
  slug: "mapinha-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "mapinha",
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.mapinha.mobile",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Geofence nativo (Parte 5) precisa da localização mesmo com o app em
    // segundo plano/fechado — é por isso que existem 2 permissões Android
    // separadas (fine + background), pedidas em 2 passos na UI (ver
    // src/lib/geofence.ts), nunca as duas de uma vez.
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    // Login com Google via expo-auth-session (navegador) — ver
    // LoginScreen.tsx. Trocamos @react-native-google-signin/google-signin
    // por essa abordagem depois de confirmar, via issues oficiais do
    // pacote (#1350, #1330, #1362), que o módulo nativo dele falha de
    // forma intermitente em builds Expo com a New Architecture (mesmo
    // build funcionando às vezes e falhando outras) — sem correção
    // publicada. expo-web-browser não tem esse tipo de problema.
    "expo-status-bar",
    "expo-web-browser",
    "expo-secure-store",
    "expo-image-picker",
    "expo-task-manager",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "O MaPinha usa sua localização pra avisar quando você chegar perto de um ponto favoritado ou seu.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/android-icon-foreground.png",
        color: "#E6F4FE",
      },
    ],
    [
      "react-native-maps",
      {
        // Mesmo sem Google como mapa base (usamos tiles da Stadia via
        // UrlTile, igual a web), o Android ainda exige essa chave pro
        // componente inicializar — ver README.md.
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // Crash real achado via emulador + logcat (11/11/2026) só na
          // build "preview" (com minificação R8 ligada — o perfil
          // "development" usa variante debug, sem R8, por isso nunca
          // reproduziu): "Failed to create an instance of class
          // androidx.work.impl.WorkDatabase" ao iniciar o app, antes de
          // qualquer código nosso rodar. É um problema conhecido de R8
          // removendo/renomeando a classe gerada pelo Room que o
          // WorkManager usa por baixo dos panos — as regras padrão da
          // própria lib não bastam nesse combo de versões. Mantém as
          // classes do androidx.work intactas no R8.
          extraProguardRules: "-keep class androidx.work.** { *; }\n-dontwarn androidx.work.**",
        },
      },
    ],
  ],
  extra: {
    eas: {
      // Vincula este projeto ao projeto já criado na conta EAS do dono do
      // projeto (`eas build` gerou isso automaticamente na 1ª tentativa, mas
      // não conseguiu escrever sozinho porque este é um app.config.ts
      // dinâmico, não app.json estático — precisou entrar à mão).
      projectId: "a91505b7-8f3e-408a-9350-7df76a2eb3a8",
    },
  },
};

export default config;
